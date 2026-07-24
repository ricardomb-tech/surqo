from __future__ import annotations

import secrets
import uuid
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, HTTPException, Request, status
from slowapi import Limiter
from sqlalchemy import select

from app.dependencies import CurrentUser, DBSession, rate_limit_key
from app.models.device import Device
from app.models.farm import Farm
from app.schemas.device import (
    DeviceClaim,
    DeviceRegister,
    DeviceRegisterResponse,
    DeviceRename,
    DeviceResponse,
)
from app.services.ingest_service import ingest_reading
from app.websocket.manager import manager

router = APIRouter()
limiter = Limiter(key_func=rate_limit_key)

# Ventana para considerar un nodo "recién conectado" en la detección automática.
# Mayor que el deep sleep del nodo (15 min) para que no desaparezca entre ciclos.
DISCOVERY_WINDOW_MIN = 20

# Ventana TOFU tras el claim: el primer /register que llegue en estos minutos
# se asume el nodo real (recién encendido por su dueño) y recibe el secreto.
SECRET_TOFU_WINDOW_MIN = 5


@router.post("/register", response_model=DeviceRegisterResponse)
@limiter.limit("30/minute")
async def register_device(request: Request, body: DeviceRegister, db: DBSession) -> DeviceRegisterResponse:
    """Endpoint público: el nodo se anuncia al arrancar. Crea el registro si no
    existe (sin emparejar) y devuelve el código para que el usuario lo reclame."""
    norm = Device.normalize_mac(body.device_mac)
    if len(norm) < 6:
        raise HTTPException(status_code=400, detail="MAC inválida")

    result = await db.execute(select(Device).where(Device.device_mac == norm))
    device = result.scalar_one_or_none()

    if device is None:
        device = Device(
            device_mac=norm,
            claim_code=Device.code_from_mac(norm),
            firmware_version=body.firmware_version,
            last_seen=datetime.now(UTC),
        )
        db.add(device)
    else:
        device.last_seen = datetime.now(UTC)
        if body.firmware_version:
            device.firmware_version = body.firmware_version

    # TOFU: si estamos dentro de la ventana abierta por /claim y todavía no
    # se emitió secreto, este /register es (asumimos) el nodo real recién
    # encendido por su dueño — se le entrega el secreto UNA sola vez.
    issued_secret: str | None = None
    now = datetime.now(UTC)
    pending_until = device.pending_secret_until
    if pending_until is not None and pending_until.tzinfo is None:
        # SQLite (tests) no preserva tz-awareness; Postgres/asyncpg sí. Se
        # asume UTC en ambos casos porque así se escribió el valor.
        pending_until = pending_until.replace(tzinfo=UTC)
    if (
        device.farm_id is not None
        and device.device_secret is None
        and pending_until is not None
        and now < pending_until
    ):
        issued_secret = secrets.token_hex(16)
        device.device_secret = issued_secret
        device.pending_secret_until = None

    await db.commit()
    await db.refresh(device)
    return DeviceRegisterResponse(
        claim_code=device.claim_code,
        is_claimed=device.farm_id is not None,
        device_secret=issued_secret,
    )


@router.get("/", response_model=list[DeviceResponse])
async def list_devices(current_user: CurrentUser, db: DBSession) -> list[Device]:
    """Nodos emparejados por el usuario autenticado."""
    result = await db.execute(select(Device).where(Device.user_id == current_user.user_id))
    return list(result.scalars().all())


@router.get("/discoverable", response_model=list[DeviceResponse])
async def discoverable_devices(current_user: CurrentUser, db: DBSession) -> list[Device]:
    """Nodos SIN emparejar vistos en los últimos minutos — alimenta la detección
    automática: el usuario prende el nodo y aparece solo, sin escribir código."""
    cutoff = datetime.now(UTC) - timedelta(minutes=DISCOVERY_WINDOW_MIN)
    result = await db.execute(
        select(Device)
        .where(
            Device.user_id.is_(None),
            Device.last_seen.is_not(None),
            Device.last_seen >= cutoff,
        )
        .order_by(Device.last_seen.desc())
    )
    return list(result.scalars().all())


@router.post("/claim", response_model=DeviceResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("20/minute")
async def claim_device(
    request: Request, body: DeviceClaim, current_user: CurrentUser, db: DBSession
) -> Device:
    """Empareja un nodo (por su claim_code) con una finca del usuario."""
    farm = await db.get(Farm, body.farm_id)
    if not farm or farm.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Sin acceso a esta finca")

    result = await db.execute(
        select(Device).where(Device.claim_code == body.claim_code.strip().upper())
    )
    device = result.scalar_one_or_none()
    if device is None:
        raise HTTPException(
            status_code=404,
            detail="No encontramos un nodo con ese código. Verifica que esté encendido y conectado.",
        )
    if device.user_id is not None and device.user_id != current_user.user_id:
        raise HTTPException(status_code=409, detail="Este nodo ya está emparejado con otra cuenta.")

    device.user_id = current_user.user_id
    device.farm_id = body.farm_id
    if body.name:
        device.name = body.name
    elif not device.name:
        device.name = f"Nodo {device.claim_code}"

    # Abre (o reabre) la ventana TOFU solo si el dispositivo aún no tiene
    # secreto — si ya lo tenía (re-claim del mismo dueño sin haber
    # desvinculado), no hace falta re-provisionar.
    if device.device_secret is None:
        device.pending_secret_until = datetime.now(UTC) + timedelta(minutes=SECRET_TOFU_WINDOW_MIN)

    await db.commit()
    await db.refresh(device)
    return device


@router.patch("/{device_id}", response_model=DeviceResponse)
async def rename_device(
    device_id: uuid.UUID, body: DeviceRename, current_user: CurrentUser, db: DBSession
) -> Device:
    device = await db.get(Device, device_id)
    if not device or device.user_id != current_user.user_id:
        raise HTTPException(status_code=404, detail="Nodo no encontrado")
    device.name = body.name
    await db.commit()
    await db.refresh(device)
    return device


@router.delete("/{device_id}", status_code=204)
async def unclaim_device(device_id: uuid.UUID, current_user: CurrentUser, db: DBSession) -> None:
    """Desvincula el nodo de la cuenta (queda libre para reclamar de nuevo)."""
    device = await db.get(Device, device_id)
    if not device or device.user_id != current_user.user_id:
        raise HTTPException(status_code=404, detail="Nodo no encontrado")
    device.user_id = None
    device.farm_id = None
    # El siguiente dueño debe re-provisionar su propio secreto — este nodo
    # pudo cambiar de manos físicamente.
    device.device_secret = None
    device.pending_secret_until = None
    await db.commit()


@router.post("/{device_mac}/reading", status_code=202)
@limiter.limit("120/minute")
async def ingest_device_reading(
    request: Request, device_mac: str, body: dict, db: DBSession
) -> dict:
    """Fallback HTTP público: el nodo publica aquí cuando MQTT falla. Resuelve la
    finca desde el dispositivo (por su MAC) y procesa la lectura igual que MQTT."""
    norm = Device.normalize_mac(device_mac)
    result = await db.execute(select(Device).where(Device.device_mac == norm))
    device = result.scalar_one_or_none()

    if device is None:
        # Auto-registrar para que aparezca como reclamable, pero sin finca aún
        device = Device(
            device_mac=norm,
            claim_code=Device.code_from_mac(norm),
            firmware_version=body.get("firmware_version"),
            last_seen=datetime.now(UTC),
        )
        db.add(device)
        await db.commit()
        return {"status": "unclaimed", "claim_code": device.claim_code}

    # Si el dispositivo ya tiene secreto (provisionado vía TOFU en /register),
    # la lectura debe traerlo — cierra la ingesta anónima por MAC adivinada.
    if device.device_secret is not None and body.get("device_secret") != device.device_secret:
        raise HTTPException(status_code=401, detail="Secreto de dispositivo inválido o ausente")

    device.last_seen = datetime.now(UTC)
    if body.get("firmware_version"):
        device.firmware_version = body["firmware_version"]
    await db.commit()

    if device.farm_id is None:
        return {"status": "unclaimed", "claim_code": device.claim_code}

    await ingest_reading(db, manager, body, str(device.farm_id), source="http")
    return {"status": "ok"}
