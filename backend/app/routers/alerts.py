from __future__ import annotations

import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from app.dependencies import CurrentUser, DBSession
from app.models.alert import Alert
from app.models.farm import Farm
from app.models.user import UserProfile
from app.schemas.alert import AlertNotifyRequest, AlertResolveRequest, AlertResponse
from app.services.alert_service import AlertService

router = APIRouter()
_alert_svc = AlertService()


async def _verify_farm_owner(db: DBSession, farm_id: uuid.UUID, user: UserProfile) -> Farm:
    farm = await db.get(Farm, farm_id)
    if not farm or farm.user_id != user.user_id:
        raise HTTPException(status_code=403, detail="Sin acceso a esta finca")
    return farm


async def _verify_alert_owner(db: DBSession, alert_id: uuid.UUID, user: UserProfile) -> Alert:
    alert = await db.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")
    if alert.farm_id:
        farm = await db.get(Farm, alert.farm_id)
        if not farm or farm.user_id != user.user_id:
            raise HTTPException(status_code=403, detail="Sin acceso a esta alerta")
    return alert


@router.get("/active", response_model=list[AlertResponse])
async def get_active_alerts(
    db: DBSession,
    current_user: CurrentUser,
    farm_id: uuid.UUID | None = None,
) -> list[Alert]:
    if farm_id:
        await _verify_farm_owner(db, farm_id, current_user)
        stmt = (
            select(Alert)
            .where(Alert.is_resolved == False, Alert.farm_id == farm_id)  # noqa: E712
            .order_by(Alert.created_at.desc())
            .limit(50)
        )
    else:
        # Solo alertas de fincas propias
        user_farm_stmt = select(Farm.id).where(Farm.user_id == current_user.user_id)
        user_farm_result = await db.execute(user_farm_stmt)
        user_farm_ids = [r for r, in user_farm_result.all()]
        stmt = (
            select(Alert)
            .where(Alert.is_resolved == False, Alert.farm_id.in_(user_farm_ids))  # noqa: E712
            .order_by(Alert.created_at.desc())
            .limit(50)
        )
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.get("/history", response_model=list[AlertResponse])
async def get_alert_history(
    db: DBSession,
    current_user: CurrentUser,
    farm_id: uuid.UUID | None = None,
    limit: int = 20,
) -> list[Alert]:
    if farm_id:
        await _verify_farm_owner(db, farm_id, current_user)
        stmt = (
            select(Alert)
            .where(Alert.farm_id == farm_id)
            .order_by(Alert.created_at.desc())
            .limit(limit)
        )
    else:
        user_farm_stmt = select(Farm.id).where(Farm.user_id == current_user.user_id)
        user_farm_result = await db.execute(user_farm_stmt)
        user_farm_ids = [r for r, in user_farm_result.all()]
        stmt = (
            select(Alert)
            .where(Alert.farm_id.in_(user_farm_ids))
            .order_by(Alert.created_at.desc())
            .limit(limit)
        )
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.get("/{alert_id}", response_model=AlertResponse)
async def get_alert(alert_id: uuid.UUID, db: DBSession, current_user: CurrentUser) -> Alert:
    return await _verify_alert_owner(db, alert_id, current_user)


@router.patch("/{alert_id}/resolve", response_model=AlertResponse)
async def resolve_alert(
    alert_id: uuid.UUID, body: AlertResolveRequest, db: DBSession, current_user: CurrentUser
) -> Alert:
    alert = await _verify_alert_owner(db, alert_id, current_user)
    alert.is_resolved = body.resolved
    if body.resolved:
        alert.resolved_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(alert)
    return alert


@router.post("/{alert_id}/notify", response_model=AlertResponse)
async def notify_alert(
    alert_id: uuid.UUID, body: AlertNotifyRequest, db: DBSession, current_user: CurrentUser
) -> Alert:
    """Envía email para una alerta específica. Útil para renotificaciones manuales."""
    alert = await _verify_alert_owner(db, alert_id, current_user)

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
