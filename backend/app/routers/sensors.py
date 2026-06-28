from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta

import logfire
from fastapi import APIRouter, HTTPException, Query, WebSocket, WebSocketDisconnect
from sqlalchemy import select

from app.database import get_db
from app.dependencies import CurrentUser, DBSession, validate_ws_token
from app.models.farm import Farm
from app.models.sensor_reading import SensorReading
from app.models.user import UserProfile
from app.schemas.sensor import SensorReadingCreate, SensorReadingResponse, TimeseriesPoint
from app.services.kpi_service import KPIService
from app.websocket.manager import manager

router = APIRouter()
kpi_svc = KPIService()


async def _require_farm_access(db: DBSession, farm_id: uuid.UUID, user: UserProfile) -> None:
    farm = await db.get(Farm, farm_id)
    if not farm or farm.user_id != user.user_id:
        raise HTTPException(status_code=403, detail="Sin acceso a esta finca")


@router.post("/reading", response_model=SensorReadingResponse, status_code=201)
async def ingest_reading(
    body: SensorReadingCreate,
    db: DBSession,
    current_user: CurrentUser,
) -> SensorReading:
    # Verifica que el farm_id pertenece al usuario autenticado
    if body.farm_id:
        await _require_farm_access(db, body.farm_id, current_user)

    vpd = None
    if body.air_temp_c is not None and body.air_humidity_pct is not None:
        vpd = kpi_svc.calculate_vpd(body.air_temp_c, body.air_humidity_pct)

    reading = SensorReading(
        **body.model_dump(exclude={"farm_id", "source"}),
        farm_id=body.farm_id,
        vpd_kpa=vpd,
        source="http",
    )
    db.add(reading)
    await db.commit()
    await db.refresh(reading)

    logfire.info("Lectura HTTP recibida", device_id=body.device_id)

    if body.farm_id:
        await manager.broadcast_to_farm(str(body.farm_id), {
            "type": "sensor_reading",
            "data": {
                "device_id": body.device_id,
                "soil_moisture_pct": body.soil_moisture_pct,
                "air_temp_c": body.air_temp_c,
                "air_humidity_pct": body.air_humidity_pct,
                "vpd_kpa": vpd,
                "created_at": reading.created_at.isoformat() if reading.created_at else None,
            },
        })

    return reading


@router.get("/latest/{device_id}", response_model=SensorReadingResponse)
async def get_latest(device_id: str, db: DBSession, current_user: CurrentUser) -> SensorReading:
    stmt = (
        select(SensorReading)
        .where(SensorReading.device_id == device_id)
        .order_by(SensorReading.created_at.desc())
        .limit(1)
    )
    result = await db.execute(stmt)
    reading = result.scalar_one_or_none()
    if not reading:
        raise HTTPException(status_code=404, detail="No hay lecturas para este dispositivo")
    # Verify the reading's farm belongs to the user
    if reading.farm_id:
        await _require_farm_access(db, reading.farm_id, current_user)
    return reading


@router.get("/timeseries/{farm_id}", response_model=list[TimeseriesPoint])
async def get_timeseries(
    farm_id: uuid.UUID,
    db: DBSession,
    current_user: CurrentUser,
    hours: int = 24,
    metric: str = "soil_moisture_pct",
) -> list[TimeseriesPoint]:
    await _require_farm_access(db, farm_id, current_user)

    allowed_metrics = {
        "soil_moisture_pct", "soil_temp_c", "air_temp_c",
        "air_humidity_pct", "uv_index", "vpd_kpa",
    }
    if metric not in allowed_metrics:
        raise HTTPException(status_code=400, detail=f"Métrica no válida. Usar: {allowed_metrics}")

    since = datetime.now(UTC) - timedelta(hours=hours)
    stmt = (
        select(SensorReading)
        .where(
            SensorReading.farm_id == farm_id,
            SensorReading.created_at >= since,
        )
        .order_by(SensorReading.created_at.asc())
    )
    result = await db.execute(stmt)
    readings = result.scalars().all()

    return [
        TimeseriesPoint(
            timestamp=r.created_at,
            value=float(getattr(r, metric)) if getattr(r, metric) is not None else None,
        )
        for r in readings
    ]


@router.get("/stats/{farm_id}")
async def get_stats(farm_id: uuid.UUID, db: DBSession, current_user: CurrentUser) -> dict:
    await _require_farm_access(db, farm_id, current_user)

    since = datetime.now(UTC) - timedelta(hours=24)
    stmt = (
        select(SensorReading)
        .where(
            SensorReading.farm_id == farm_id,
            SensorReading.created_at >= since,
        )
    )
    result = await db.execute(stmt)
    readings = result.scalars().all()

    if not readings:
        return {"error": "Sin datos en las últimas 24h"}

    metrics = ["soil_moisture_pct", "air_temp_c", "air_humidity_pct", "vpd_kpa"]
    stats: dict = {}
    for m in metrics:
        values = [float(getattr(r, m)) for r in readings if getattr(r, m) is not None]
        if values:
            stats[m] = {
                "min": round(min(values), 2),
                "max": round(max(values), 2),
                "avg": round(sum(values) / len(values), 2),
                "trend": "up" if values[-1] > values[0] else ("down" if values[-1] < values[0] else "stable"),
            }
    return {"farm_id": str(farm_id), "hours": 24, "stats": stats}


@router.websocket("/ws/live/{farm_id}")
async def websocket_live(
    websocket: WebSocket,
    farm_id: str,
    token: str | None = Query(default=None),
) -> None:
    # Autenticar antes de aceptar la conexión WebSocket
    if not token:
        await websocket.close(code=4001)
        return

    async for db in get_db():
        try:
            user = await validate_ws_token(token, db)
        except HTTPException:
            await websocket.close(code=4001)
            return

        try:
            farm_uuid = uuid.UUID(farm_id)
        except ValueError:
            await websocket.close(code=4002)
            return

        farm = await db.get(Farm, farm_uuid)
        if not farm or farm.user_id != user.user_id:
            await websocket.close(code=4003)
            return

        await manager.connect(websocket, farm_id)
        try:
            stmt = (
                select(SensorReading)
                .where(SensorReading.farm_id == farm_uuid)
                .order_by(SensorReading.created_at.desc())
                .limit(1)
            )
            result = await db.execute(stmt)
            latest = result.scalar_one_or_none()
            if latest:
                await websocket.send_json({
                    "type": "initial",
                    "data": SensorReadingResponse.model_validate(latest).model_dump(mode="json"),
                })

            while True:
                await websocket.receive_text()
        except WebSocketDisconnect:
            await manager.disconnect(websocket, farm_id)
        except Exception:
            await manager.disconnect(websocket, farm_id)
        break
