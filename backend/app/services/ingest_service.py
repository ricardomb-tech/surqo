from __future__ import annotations

import uuid as _uuid
from typing import TYPE_CHECKING

from sqlalchemy.ext.asyncio import AsyncSession

if TYPE_CHECKING:
    from app.websocket.manager import WebSocketManager


async def ingest_reading(
    db: AsyncSession,
    ws_manager: WebSocketManager | None,
    payload: dict,
    farm_id: str | None,
    source: str,
) -> None:
    """Procesa una lectura de sensores (venga de MQTT o HTTP): calcula VPD,
    la persiste, evalúa umbrales de alerta y la transmite por WebSocket.

    Es la única ruta de ingesta — comparte lógica entre el consumidor MQTT y el
    endpoint HTTP de fallback para que ambos se comporten igual.
    """
    from app.models.farm import Farm
    from app.models.sensor_reading import SensorReading
    from app.services.alert_service import AlertService
    from app.services.kpi_service import KPIService

    kpi_svc = KPIService()
    alert_svc = AlertService()
    sensors = payload.get("sensors", payload)

    air_temp = sensors.get("air_temp_c") or payload.get("air_temp_c")
    humidity = sensors.get("air_humidity_pct") or payload.get("air_humidity_pct")
    vpd = None
    if air_temp is not None and humidity is not None:
        vpd = kpi_svc.calculate_vpd(air_temp, humidity)

    reading_data = {
        "device_id": payload.get("device_id", "unknown"),
        "soil_moisture_pct": sensors.get("soil_moisture_pct"),
        "soil_temp_c": sensors.get("soil_temp_c"),
        "air_temp_c": air_temp,
        "air_humidity_pct": humidity,
        "uv_index": sensors.get("light_uv_index") or sensors.get("uv_index"),
        "battery_mv": payload.get("battery_mv"),
        "rssi_dbm": payload.get("rssi_dbm"),
        "vpd_kpa": vpd,
        "raw_payload": payload,
        "source": source,
        "firmware_version": payload.get("firmware_version"),
    }

    farm_uuid: _uuid.UUID | None = None
    if farm_id:
        try:
            farm_uuid = _uuid.UUID(farm_id)
        except ValueError:
            pass

    reading = SensorReading(**reading_data)
    reading.farm_id = farm_uuid
    db.add(reading)
    await db.commit()

    farm_name = "Finca"
    owner_email: str | None = None
    farm = None
    if farm_uuid:
        farm = await db.get(Farm, farm_uuid)
        if farm:
            farm_name = farm.name
            owner_email = farm.owner_email

    user_id_str = str(farm.user_id) if farm and farm.user_id else None
    await alert_svc.process_threshold_violations(
        db=db,
        reading={**reading_data, "farm_id": farm_id, "vpd_kpa": vpd},
        farm_id=farm_id,
        device_id=reading_data["device_id"],
        farm_name=farm_name,
        owner_email=owner_email,
        user_id=user_id_str,
    )

    if farm_id and ws_manager is not None:
        await ws_manager.broadcast_to_farm(farm_id, {
            "type": "sensor_reading",
            "data": {**reading_data, "farm_id": farm_id, "vpd_kpa": vpd},
        })
