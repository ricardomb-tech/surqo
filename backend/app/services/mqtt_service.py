from __future__ import annotations

import asyncio
import json
import logging
import ssl
import threading
import time
from typing import TYPE_CHECKING

import logfire
import paho.mqtt.client as mqtt

from app.config import settings

if TYPE_CHECKING:
    from app.websocket.manager import WebSocketManager

logger = logging.getLogger(__name__)


class SurqoMQTTService:
    TOPIC_PATTERN = "surqo/farms/+/sensors"
    RECONNECT_DELAYS = [1, 2, 4, 8, 16, 32, 60]

    def __init__(
        self,
        db_session_factory,
        ws_manager: "WebSocketManager",
        loop: asyncio.AbstractEventLoop,
    ) -> None:
        self._db_factory = db_session_factory
        self._ws_manager = ws_manager
        self._loop = loop
        self._client: mqtt.Client | None = None
        self._reconnect_attempt = 0
        self._running = False

    def _build_client(self) -> mqtt.Client:
        client = mqtt.Client(
            client_id=f"surqo-backend-{int(time.time())}",
            protocol=mqtt.MQTTv5,
        )
        if settings.HIVEMQ_USERNAME:
            client.username_pw_set(settings.HIVEMQ_USERNAME, settings.HIVEMQ_PASSWORD)

        tls_ctx = ssl.create_default_context()
        client.tls_set_context(tls_ctx)

        client.on_connect = self._on_connect
        client.on_disconnect = self._on_disconnect
        client.on_message = self._on_message
        return client

    def _on_connect(self, client, userdata, flags, rc, properties=None) -> None:
        if rc == 0:
            self._reconnect_attempt = 0
            client.subscribe(self.TOPIC_PATTERN, qos=1)
            logfire.info("MQTT conectado a HiveMQ", host=settings.HIVEMQ_HOST)
        else:
            logger.error("MQTT conexión rechazada, código: %s", rc)

    def _on_disconnect(self, client, userdata, rc, properties=None) -> None:
        if self._running:
            delay = self.RECONNECT_DELAYS[
                min(self._reconnect_attempt, len(self.RECONNECT_DELAYS) - 1)
            ]
            self._reconnect_attempt += 1
            logger.warning("MQTT desconectado (rc=%s). Reintentando en %ss", rc, delay)
            time.sleep(delay)
            try:
                client.reconnect()
            except Exception as e:
                logger.error("Error reconectando MQTT: %s", e)

    def _on_message(self, client, userdata, msg: mqtt.MQTTMessage) -> None:
        try:
            payload = json.loads(msg.payload.decode())
            parts = msg.topic.split("/")
            farm_id = parts[2] if len(parts) >= 3 else None

            asyncio.run_coroutine_threadsafe(
                self._process_reading(payload, farm_id),
                self._loop,
            )
        except json.JSONDecodeError as e:
            logger.error("MQTT payload JSON inválido: %s", e)
        except Exception as e:
            logger.error("Error procesando mensaje MQTT: %s", e)

    async def _process_reading(self, payload: dict, farm_id: str | None) -> None:
        import uuid as _uuid

        from sqlalchemy import select

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
            "farm_id": farm_id,
            "soil_moisture_pct": sensors.get("soil_moisture_pct"),
            "soil_temp_c": sensors.get("soil_temp_c"),
            "air_temp_c": air_temp,
            "air_humidity_pct": humidity,
            "uv_index": sensors.get("light_uv_index") or sensors.get("uv_index"),
            "battery_mv": payload.get("battery_mv"),
            "rssi_dbm": payload.get("rssi_dbm"),
            "vpd_kpa": vpd,
            "raw_payload": payload,
            "source": "mqtt",
            "firmware_version": payload.get("firmware_version"),
        }

        farm_uuid: _uuid.UUID | None = None
        if farm_id:
            try:
                farm_uuid = _uuid.UUID(farm_id)
            except ValueError:
                pass

        async with self._db_factory() as db:
            reading = SensorReading(**{k: v for k, v in reading_data.items() if k != "farm_id"})
            reading.farm_id = farm_uuid
            db.add(reading)
            await db.commit()

            # Lookup finca para email
            farm_name = "Finca"
            owner_email: str | None = None
            if farm_uuid:
                farm = await db.get(Farm, farm_uuid)
                if farm:
                    farm_name = farm.name
                    owner_email = farm.owner_email

            # Verificar umbrales y enviar alertas/email
            await alert_svc.process_threshold_violations(
                db=db,
                reading={**reading_data, "vpd_kpa": vpd},
                farm_id=farm_id,
                device_id=reading_data["device_id"],
                farm_name=farm_name,
                owner_email=owner_email,
            )

        # Broadcast a WebSocket
        if farm_id:
            await self._ws_manager.broadcast_to_farm(farm_id, {
                "type": "sensor_reading",
                "data": {**reading_data, "vpd_kpa": vpd},
            })

    def start_background(self) -> None:
        self._running = True
        self._client = self._build_client()
        try:
            self._client.connect(settings.HIVEMQ_HOST, settings.HIVEMQ_PORT, keepalive=60)
            self._client.loop_start()
            logfire.info("MQTT consumer iniciado en background")
        except Exception as e:
            logger.error("No se pudo conectar a MQTT: %s", e)

    def stop(self) -> None:
        self._running = False
        if self._client:
            self._client.loop_stop()
            self._client.disconnect()
            logfire.info("MQTT consumer detenido")
