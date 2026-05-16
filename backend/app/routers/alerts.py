from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from app.dependencies import DBSession
from app.models.alert import Alert
from app.schemas.alert import AlertResponse, AlertResolveRequest

router = APIRouter()


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
        alert.resolved_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(alert)
    return alert
