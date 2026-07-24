from __future__ import annotations

import asyncio
import json
import logging
import uuid

import redis.asyncio as aioredis
from fastapi import WebSocket

from app.config import settings

logger = logging.getLogger(__name__)

BROADCAST_CHANNEL = "surqo:ws:broadcast"
# Identifica a esta instancia del backend para no auto-entregarse dos veces
# el mismo mensaje (una vez directo, otra vía su propia suscripción a Redis).
INSTANCE_ID = str(uuid.uuid4())


class WebSocketManager:
    def __init__(self) -> None:
        self.active_connections: dict[str, list[WebSocket]] = {}
        self._redis: aioredis.Redis | None = None
        self._pubsub_task: asyncio.Task | None = None

    async def connect(self, websocket: WebSocket, farm_id: str) -> None:
        await websocket.accept()
        if farm_id not in self.active_connections:
            self.active_connections[farm_id] = []
        self.active_connections[farm_id].append(websocket)
        logger.info("WebSocket conectado para finca %s. Total: %d", farm_id,
                    len(self.active_connections[farm_id]))

    async def disconnect(self, websocket: WebSocket, farm_id: str) -> None:
        if farm_id in self.active_connections:
            try:
                self.active_connections[farm_id].remove(websocket)
            except ValueError:
                pass
            if not self.active_connections[farm_id]:
                del self.active_connections[farm_id]

    async def _deliver_local(self, farm_id: str, data: dict) -> None:
        """Entrega solo a las conexiones WebSocket de ESTA instancia del backend."""
        if farm_id not in self.active_connections:
            return
        dead: list[WebSocket] = []
        message = json.dumps(data, default=str)
        for ws in self.active_connections[farm_id]:
            try:
                await ws.send_text(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            await self.disconnect(ws, farm_id)

    async def broadcast_to_farm(self, farm_id: str, data: dict) -> None:
        # Entrega inmediata a los clientes de ESTA instancia — funciona igual
        # que antes de tener Redis pub/sub, aunque Redis esté caído.
        await self._deliver_local(farm_id, data)

        # Best-effort: avisar a OTRAS instancias del backend (si algún día hay
        # más de una VM detrás del mismo dominio) para que entreguen a sus
        # propios clientes conectados. Si Redis falla, solo se pierde el
        # fanout entre instancias — el comportamiento de hoy (1 sola VM) no
        # cambia en nada.
        try:
            client = await self._get_redis()
            await client.publish(
                BROADCAST_CHANNEL,
                json.dumps({"origin": INSTANCE_ID, "farm_id": farm_id, "data": data}, default=str),
            )
        except Exception as e:
            logger.warning("Redis pub/sub no disponible, broadcast solo local: %s", e)

    async def broadcast_all(self, data: dict) -> None:
        message = json.dumps(data, default=str)
        for farm_id, connections in list(self.active_connections.items()):
            dead: list[WebSocket] = []
            for ws in connections:
                try:
                    await ws.send_text(message)
                except Exception:
                    dead.append(ws)
            for ws in dead:
                await self.disconnect(ws, farm_id)

    async def _get_redis(self) -> aioredis.Redis:
        if self._redis is None:
            self._redis = aioredis.from_url(
                settings.REDIS_URL, encoding="utf-8", decode_responses=True,
                socket_connect_timeout=3,
            )
        return self._redis

    async def start_listener(self) -> None:
        """Se suscribe al canal de broadcast para recibir lo que publiquen
        OTRAS instancias del backend. Si falla, el backend sigue funcionando
        normal en modo 1-VM (solo se pierde el fanout entre instancias)."""
        try:
            client = await self._get_redis()
            pubsub = client.pubsub()
            await pubsub.subscribe(BROADCAST_CHANNEL)
        except Exception as e:
            logger.warning("No se pudo iniciar el listener de WebSocket pub/sub: %s", e)
            return
        self._pubsub_task = asyncio.create_task(self._listen_loop(pubsub))
        logger.info("WebSocket pub/sub listener iniciado (instance=%s)", INSTANCE_ID)

    async def _listen_loop(self, pubsub) -> None:
        try:
            async for message in pubsub.listen():
                if message["type"] != "message":
                    continue
                try:
                    payload = json.loads(message["data"])
                    if payload.get("origin") == INSTANCE_ID:
                        continue  # ya se entregó localmente en broadcast_to_farm
                    await self._deliver_local(payload["farm_id"], payload["data"])
                except Exception as e:
                    logger.warning("Mensaje de WS pub/sub inválido: %s", e)
        except asyncio.CancelledError:
            raise
        except Exception as e:
            logger.error("Listener de WS pub/sub terminó con error: %s", e)

    async def stop_listener(self) -> None:
        if self._pubsub_task:
            self._pubsub_task.cancel()
            try:
                await self._pubsub_task
            except (asyncio.CancelledError, Exception):
                pass
            self._pubsub_task = None
        if self._redis:
            try:
                await self._redis.aclose()
            except Exception:
                pass
            self._redis = None

    @property
    def total_connections(self) -> int:
        return sum(len(v) for v in self.active_connections.values())


manager = WebSocketManager()
