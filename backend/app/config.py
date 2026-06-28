from __future__ import annotations

import json

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore", env_ignore_empty=True)

    # LLM — proveedor: "groq" (producción gratis) | "anthropic" | "ollama" (local/dev)
    LLM_PROVIDER: str = "groq"
    LLM_MAX_TOKENS: int = 1024

    # Groq (gratis: 14,400 req/día con Llama 3.3 70B)
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    # Anthropic (fallback de pago)
    ANTHROPIC_API_KEY: str = ""
    LLM_MODEL: str = "claude-haiku-4-5-20251001"

    # Ollama (desarrollo local sin API key)
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "mistral"

    # Base de datos (Supabase)
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""
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

    # App — CORS_ORIGINS como str para evitar conflicto con pydantic-settings JSON parser
    APP_ENV: str = "development"
    CORS_ORIGINS_RAW: str = "http://localhost:3000,https://surqo.vercel.app,https://www.surqo.online,https://surqo.online"
    LOGFIRE_TOKEN: str = ""

    @property
    def CORS_ORIGINS(self) -> list[str]:
        v = self.CORS_ORIGINS_RAW
        if not v:
            return ["http://localhost:3000"]
        try:
            parsed = json.loads(v)
            if isinstance(parsed, list):
                return parsed
        except Exception:
            pass
        return [u.strip() for u in v.split(",") if u.strip()]

    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production"

    @property
    def mqtt_topic_sensors(self) -> str:
        return f"{self.MQTT_TOPIC_PREFIX}/farms/+/sensors"


settings = Settings()
