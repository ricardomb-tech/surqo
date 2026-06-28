from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from app.dependencies import CurrentUser, DBSession
from app.models.farm import Farm
from app.models.sensor_reading import SensorReading
from app.services.kpi_service import KPIService

router = APIRouter()
kpi_svc = KPIService()


async def _require_farm_access(db: DBSession, farm_id: uuid.UUID, current_user: CurrentUser) -> None:
    farm = await db.get(Farm, farm_id)
    if not farm or farm.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Sin acceso a esta finca")


@router.get("/farm/{farm_id}")
async def get_farm_kpis(farm_id: uuid.UUID, db: DBSession, current_user: CurrentUser) -> dict:
    await _require_farm_access(db, farm_id, current_user)
    return await kpi_svc.get_farm_kpis(str(farm_id), db)


@router.get("/farm/{farm_id}/vpd-history")
async def get_vpd_history(farm_id: uuid.UUID, db: DBSession, current_user: CurrentUser) -> list[dict]:
    await _require_farm_access(db, farm_id, current_user)
    since = datetime.now(UTC) - timedelta(hours=48)
    stmt = (
        select(SensorReading)
        .where(
            SensorReading.farm_id == farm_id,
            SensorReading.created_at >= since,
            SensorReading.vpd_kpa.isnot(None),
        )
        .order_by(SensorReading.created_at.asc())
    )
    result = await db.execute(stmt)
    readings = result.scalars().all()
    return [
        {"timestamp": r.created_at.isoformat(), "vpd_kpa": float(r.vpd_kpa)}
        for r in readings
    ]


@router.get("/farm/{farm_id}/water-balance")
async def get_water_balance(farm_id: uuid.UUID, db: DBSession, current_user: CurrentUser) -> dict:
    """Balance hídrico estimado de los últimos 7 días."""
    await _require_farm_access(db, farm_id, current_user)
    since = datetime.now(UTC) - timedelta(days=7)
    stmt = (
        select(SensorReading)
        .where(
            SensorReading.farm_id == farm_id,
            SensorReading.created_at >= since,
        )
    )
    result = await db.execute(stmt)
    readings = result.scalars().all()

    if readings:
        temps = [float(r.air_temp_c) for r in readings if r.air_temp_c]
        _ = sum(temps) / len(temps) if temps else 28.0  # noqa: F841

    et0_approx = 4.5  # mm/día approx para zona tropical colombiana
    etc_7d = kpi_svc.calculate_etc(et0_approx * 7, "maíz")
    rain_approx = 0.0

    return {
        "farm_id": str(farm_id),
        "period_days": 7,
        "et0_acumulada_mm": round(et0_approx * 7, 1),
        "etc_acumulada_mm": round(etc_7d, 1),
        "lluvia_acumulada_mm": rain_approx,
        "deficit_hidrico_mm": kpi_svc.calculate_water_deficit(etc_7d, rain_approx),
        "nota": "ETc calculada con ET0 estimada. Para mayor precisión, ejecutar /analysis/analyze",
    }


@router.get("/farm/{farm_id}/pest-risk")
async def get_pest_risk(farm_id: uuid.UUID, db: DBSession, current_user: CurrentUser) -> dict:
    await _require_farm_access(db, farm_id, current_user)
    since = datetime.now(UTC) - timedelta(hours=24)
    stmt = (
        select(SensorReading)
        .where(
            SensorReading.farm_id == farm_id,
            SensorReading.created_at >= since,
        )
        .order_by(SensorReading.created_at.desc())
        .limit(48)
    )
    result = await db.execute(stmt)
    readings = result.scalars().all()

    if not readings:
        return {"error": "Sin lecturas recientes para calcular riesgo"}

    avg_temp = sum(float(r.air_temp_c) for r in readings if r.air_temp_c) / max(
        sum(1 for r in readings if r.air_temp_c), 1
    )
    avg_humidity = sum(float(r.air_humidity_pct) for r in readings if r.air_humidity_pct) / max(
        sum(1 for r in readings if r.air_humidity_pct), 1
    )

    risk = kpi_svc.calculate_pest_risk(avg_temp, avg_humidity, "maíz")
    return {
        "farm_id": str(farm_id),
        "calculated_at": datetime.now(UTC).isoformat(),
        "avg_temp_c": round(avg_temp, 1),
        "avg_humidity_pct": round(avg_humidity, 1),
        **risk,
    }
