from __future__ import annotations

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore", env_ignore_empty=True)

    # Anthropic
    ANTHROPIC_API_KEY: str = ""
    LLM_MODEL: str = "claude-haiku-4-5-20251001"
    LLM_MAX_TOKENS: int = 1024

    # Base de datos (Supabase)
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    # JWK público de Supabase (ES256) — Settings → API → JWT Settings → JWKS
    SUPABASE_JWK_X: str = ""
    SUPABASE_JWK_Y: str = ""
    SUPABASE_JWK_KID: str = ""
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/surqo"

    # Cache (Upstash Redis)
    REDIS_URL: str = "redis://localhost:6379"
    CACHE_TTL_CLIMATE: int = 3600
    CACHE_TTL_ANALYSIS: int = 3600

    # MQTT (HiveMQ Cloud)
    HIVEMQ_HOST: str = "broker.hivemq.com"
    HIVEMQ_PORT: int = 8883
    HIVEMQ_USERNAME: str = ""
    HIVEMQ_PASSWORD: str = ""
    MQTT_TOPIC_PREFIX: str = "surqo"

    # Email (Resend)
    RESEND_API_KEY: str = ""
    FROM_EMAIL: str = "alertas@surqo.io"

    # App
    APP_ENV: str = "development"
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "https://surqo.vercel.app"]
    LOGFIRE_TOKEN: str = ""

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: str | list[str]) -> list[str]:
        if isinstance(v, str):
            import json
            return json.loads(v)
        return v

    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production"

    @property
    def mqtt_topic_sensors(self) -> str:
        return f"{self.MQTT_TOPIC_PREFIX}/farms/+/sensors"


settings = Settings()
