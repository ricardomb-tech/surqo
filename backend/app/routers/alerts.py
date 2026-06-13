from __future__ import annotations

import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from app.dependencies import DBSession
from app.models.alert import Alert
from app.models.farm import Farm
from app.schemas.alert import AlertNotifyRequest, AlertResolveRequest, AlertResponse
from app.services.alert_service import AlertService

router = APIRouter()
_alert_svc = AlertService()


@router.get("/active", response_model=list[AlertResponse])
async def get_active_alerts(db: DBSession, farm_id: uuid.UUID | None = None) -> list[Alert]:
    stmt = select(Alert).where(Alert.is_resolved == False)  # noqa: E712
    if farm_id:
        stmt = stmt.where(Alert.farm_id == farm_id)
    stmt = stmt.order_by(Alert.created_at.desc()).limit(50)
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.get("/history", response_model=list[AlertResponse])
async def get_alert_history(
    db: DBSession,
    farm_id: uuid.UUID | None = None,
    limit: int = 20,
) -> list[Alert]:
    stmt = select(Alert)
    if farm_id:
        stmt = stmt.where(Alert.farm_id == farm_id)
    stmt = stmt.order_by(Alert.created_at.desc()).limit(limit)
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.get("/{alert_id}", response_model=AlertResponse)
async def get_alert(alert_id: uuid.UUID, db: DBSession) -> Alert:
    alert = await db.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")
    return alert


@router.patch("/{alert_id}/resolve", response_model=AlertResponse)
async def resolve_alert(
    alert_id: uuid.UUID, body: AlertResolveRequest, db: DBSession
) -> Alert:
    alert = await db.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")
    alert.is_resolved = body.resolved
    if body.resolved:
        alert.resolved_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(alert)
    return alert


@router.post("/{alert_id}/notify", response_model=AlertResponse)
async def notify_alert(
    alert_id: uuid.UUID, body: AlertNotifyRequest, db: DBSession
) -> Alert:
    """Envía email para una alerta específica. Útil para renotificaciones manuales."""
    alert = await db.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")

    # Si la finca tiene owner_email registrado, tomarlo de ahí por defecto
    farm_name = body.farm_name
    to_email = body.to_email
    if alert.farm_id:
        farm = await db.get(Farm, alert.farm_id)
        if farm:
            farm_name = farm.name
            if not to_email:
                to_email = farm.owner_email or ""

    if not to_email:
        raise HTTPException(status_code=422, detail="No hay email de destino configurado")

    sent = await _alert_svc.send_email_for_alert(
        db=db, alert=alert, farm_name=farm_name, to_email=to_email
    )
    if not sent:
        raise HTTPException(status_code=502, detail="No se pudo enviar el email. Verifica RESEND_API_KEY.")

    await db.refresh(alert)
    return alert
