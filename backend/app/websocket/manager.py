from __future__ import annotations

import json
import logging

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class WebSocketManager:
    def __init__(self) -> None:
        self.active_connections: dict[str, list[WebSocket]] = {}

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

    async def broadcast_to_farm(self, farm_id: str, data: dict) -> None:
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

    @property
    def total_connections(self) -> int:
        return sum(len(v) for v in self.active_connections.values())


manager = WebSocketManager()
