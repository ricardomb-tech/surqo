from __future__ import annotations

import asyncio
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

import logfire
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.config import settings
from app.database import AsyncSessionLocal, init_db
from app.routers import alerts, analysis, farms, kpis, sensors, users
from app.websocket.manager import manager

limiter = Limiter(key_func=get_remote_address)

if settings.LOGFIRE_TOKEN:
    logfire.configure(token=settings.LOGFIRE_TOKEN)
else:
    logfire.configure(send_to_logfire=False)

_mqtt_service = None
_db_ok = False


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    global _mqtt_service, _db_ok

    try:
        await init_db()
        _db_ok = True
        logfire.info("Base de datos inicializada")
    except Exception as e:
        _db_ok = False
        import logging
        logging.getLogger(__name__).warning("DB no disponible al arrancar: %s", e)

    # Iniciar MQTT consumer solo si hay credenciales configuradas
    if settings.HIVEMQ_HOST and settings.HIVEMQ_USERNAME:
        from app.services.mqtt_service import SurqoMQTTService
        loop = asyncio.get_event_loop()
        _mqtt_service = SurqoMQTTService(
            db_session_factory=AsyncSessionLocal,
            ws_manager=manager,
            loop=loop,
        )
        _mqtt_service.start_background()

    logfire.info("Surqo API iniciada", env=settings.APP_ENV)
    yield

    if _mqtt_service:
        _mqtt_service.stop()
    logfire.info("Surqo API detenida")


app = FastAPI(
    title="Surqo API",
    description="Del surco al insight — inteligencia en tiempo real para el campo colombiano",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if settings.LOGFIRE_TOKEN:
    logfire.instrument_fastapi(app)

app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(farms.router, prefix="/api/v1/farms", tags=["farms"])
app.include_router(analysis.router, prefix="/api/v1/analysis", tags=["analysis"])
app.include_router(sensors.router, prefix="/api/v1/sensors", tags=["sensors"])
app.include_router(alerts.router, prefix="/api/v1/alerts", tags=["alerts"])
app.include_router(kpis.router, prefix="/api/v1/kpis", tags=["kpis"])


@app.get("/health", tags=["system"])
async def health() -> dict:
    return {
        "status": "healthy",
        "service": "surqo-api",
        "tagline": "Del surco al insight",
        "version": "1.0.0",
        "env": settings.APP_ENV,
        "db": "ok" if _db_ok else "unavailable",
        "mqtt_active": _mqtt_service is not None,
        "ws_connections": manager.total_connections,
    }
