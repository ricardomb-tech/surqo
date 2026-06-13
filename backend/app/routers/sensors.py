from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta

import logfire
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy import select

from app.dependencies import DBSession
from app.models.sensor_reading import SensorReading
from app.schemas.sensor import SensorReadingCreate, SensorReadingResponse, TimeseriesPoint
from app.services.kpi_service import KPIService
from app.websocket.manager import manager

router = APIRouter()
kpi_svc = KPIService()


@router.post("/reading", response_model=SensorReadingResponse, status_code=201)
async def ingest_reading(body: SensorReadingCreate, db: DBSession) -> SensorReading:
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
async def get_latest(device_id: str, db: DBSession) -> SensorReading:
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
    return reading


@router.get("/timeseries/{farm_id}", response_model=list[TimeseriesPoint])
async def get_timeseries(
    farm_id: uuid.UUID,
    db: DBSession,
    hours: int = 24,
    metric: str = "soil_moisture_pct",
) -> list[TimeseriesPoint]:
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
async def get_stats(farm_id: uuid.UUID, db: DBSession) -> dict:
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
async def websocket_live(websocket: WebSocket, farm_id: str, db: DBSession) -> None:
    await manager.connect(websocket, farm_id)
    try:
        # Enviar última lectura al conectar
        stmt = (
            select(SensorReading)
            .where(SensorReading.farm_id == uuid.UUID(farm_id))
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
            await websocket.receive_text()  # Mantener conexión activa
    except WebSocketDisconnect:
        await manager.disconnect(websocket, farm_id)
    except Exception:
        await manager.disconnect(websocket, farm_id)
