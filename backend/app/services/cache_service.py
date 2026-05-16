from __future__ import annotations

import json
import logging

import redis.asyncio as aioredis

from app.config import settings

logger = logging.getLogger(__name__)


class CacheService:
    def __init__(self) -> None:
        self._client: aioredis.Redis | None = None

    async def _get_client(self) -> aioredis.Redis:
        if self._client is None:
            self._client = aioredis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True,
            )
        return self._client

    async def get(self, key: str) -> dict | None:
        try:
            client = await self._get_client()
            raw = await client.get(key)
            if raw:
                return json.loads(raw)
        except Exception as e:
            logger.warning("Cache GET error for %s: %s", key, e)
        return None

    async def set(self, key: str, value: dict, ttl: int) -> None:
        try:
            client = await self._get_client()
            await client.setex(key, ttl, json.dumps(value, default=str))
        except Exception as e:
            logger.warning("Cache SET error for %s: %s", key, e)

    async def delete(self, key: str) -> None:
        try:
            client = await self._get_client()
            await client.delete(key)
        except Exception as e:
            logger.warning("Cache DELETE error for %s: %s", key, e)

    async def close(self) -> None:
        if self._client:
            await self._client.aclose()
            self._client = None


cache_service = CacheService()
