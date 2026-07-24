from __future__ import annotations

import asyncio
import json
import logging
import ssl
import time
from typing import TYPE_CHECKING

import logfire
import paho.mqtt.client as mqtt

from app.config import settings

if TYPE_CHECKING:
    from app.websocket.manager import WebSocketManager

logger = logging.getLogger(__name__)


class SurqoMQTTService:
    # Tópico nuevo (basado en dispositivo, sin FARM_ID hardcodeado) + legacy (finca)
    TOPIC_DEVICES = "surqo/devices/+/sensors"
    TOPIC_FARMS = "surqo/farms/+/sensors"
    RECONNECT_DELAYS = [1, 2, 4, 8, 16, 32, 60]

    def __init__(
        self,
        db_session_factory,
        ws_manager: WebSocketManager,
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
            client.subscribe([(self.TOPIC_DEVICES, 1), (self.TOPIC_FARMS, 1)])
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
            # surqo/{devices|farms}/{identificador}/sensors
            scheme = parts[1] if len(parts) >= 2 else ""
            identifier = parts[2] if len(parts) >= 3 else None

            asyncio.run_coroutine_threadsafe(
                self._process_reading(payload, scheme, identifier),
                self._loop,
            )
        except json.JSONDecodeError as e:
            logger.error("MQTT payload JSON inválido: %s", e)
        except Exception as e:
            logger.error("Error procesando mensaje MQTT: %s", e)

    async def _process_reading(self, payload: dict, scheme: str, identifier: str | None) -> None:
        from app.services.ingest_service import ingest_reading

        async with self._db_factory() as db:
            if scheme == "devices" and identifier:
                farm_id = await self._resolve_device_farm(db, identifier, payload)
                if farm_id is None:
                    # Dispositivo registrado pero aún sin emparejar a una finca
                    return
            else:
                farm_id = identifier

            await ingest_reading(db, self._ws_manager, payload, farm_id, source="mqtt")

    async def _resolve_device_farm(self, db, mac: str, payload: dict) -> str | None:
        """Busca (o crea) el dispositivo por MAC, actualiza last_seen y retorna su farm_id."""
        from datetime import UTC, datetime

        from sqlalchemy import select

        from app.models.device import Device

        norm = Device.normalize_mac(mac)
        result = await db.execute(select(Device).where(Device.device_mac == norm))
        device = result.scalar_one_or_none()

        if device is None:
            device = Device(
                device_mac=norm,
                claim_code=Device.code_from_mac(norm),
                firmware_version=payload.get("firmware_version"),
                last_seen=datetime.now(UTC),
            )
            db.add(device)
            await db.commit()
            return None

        if device.device_secret is not None and payload.get("device_secret") != device.device_secret:
            logger.warning("MQTT: secreto inválido o ausente para dispositivo %s — lectura descartada", mac)
            return None

        device.last_seen = datetime.now(UTC)
        if payload.get("firmware_version"):
            device.firmware_version = payload["firmware_version"]
        await db.commit()
        return str(device.farm_id) if device.farm_id else None

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
