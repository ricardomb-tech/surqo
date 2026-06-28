from __future__ import annotations

import uuid
from collections.abc import AsyncGenerator
from datetime import UTC, datetime
from types import SimpleNamespace

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.database import Base, get_db
from app.dependencies import get_current_user, get_current_user_optional, get_paid_user
from app.main import app
from app.models.alert import Alert
from app.models.analysis import Analysis
from app.models.farm import Farm
from app.models.sensor_reading import SensorReading
from app.models.user import UserProfile

# ---------------------------------------------------------------------------
# Test database — SQLite in-memory
# ---------------------------------------------------------------------------

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine_test = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = async_sessionmaker(
    engine_test, class_=AsyncSession, expire_on_commit=False
)

# ---------------------------------------------------------------------------
# Shared test identity
# ---------------------------------------------------------------------------

TEST_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")


def _fake_user() -> SimpleNamespace:
    """Return a plain namespace that satisfies all UserProfile attribute access."""
    return SimpleNamespace(
        user_id=TEST_USER_ID,
        email="test@surqo.io",
        full_name="Test User",
        plan="free",
        is_admin=False,
        is_paid=True,
        can_use_ai_analysis=True,
        can_send_email_alert=True,
        email_alerts_this_month=0,
        created_at=datetime(2024, 1, 1, tzinfo=UTC),
    )


# ---------------------------------------------------------------------------
# Dependency overrides
# ---------------------------------------------------------------------------

async def _override_get_db() -> AsyncGenerator[AsyncSession, None]:
    async with TestSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


app.dependency_overrides[get_db] = _override_get_db
app.dependency_overrides[get_current_user] = _fake_user
app.dependency_overrides[get_current_user_optional] = _fake_user
app.dependency_overrides[get_paid_user] = _fake_user

# ---------------------------------------------------------------------------
# Session-scoped: create tables + seed test user once
# ---------------------------------------------------------------------------


@pytest_asyncio.fixture(scope="session", autouse=True)
async def create_tables():
    async with engine_test.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestSessionLocal() as session:
        session.add(
            UserProfile(
                user_id=TEST_USER_ID,
                email="test@surqo.io",
                full_name="Test User",
                plan="free",
            )
        )
        await session.commit()

    yield

    async with engine_test.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


# ---------------------------------------------------------------------------
# Function-scoped: wipe mutable data between tests
# ---------------------------------------------------------------------------


@pytest_asyncio.fixture(autouse=True)
async def clean_data():
    """Delete mutable data between tests for isolation (order matters for FKs)."""
    yield
    async with TestSessionLocal() as session:
        await session.execute(delete(Alert))
        await session.execute(delete(Analysis))
        await session.execute(delete(SensorReading))
        await session.execute(delete(Farm))
        await session.commit()


# ---------------------------------------------------------------------------
# Client fixture
# ---------------------------------------------------------------------------


@pytest_asyncio.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with TestSessionLocal() as session:
        yield session


# ---------------------------------------------------------------------------
# Shared data fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def sample_farm_data() -> dict:
    return {
        "name": "Finca La Esperanza",
        "owner_name": "Carlos Martínez",
        "owner_email": "carlos@example.com",
        "latitude": 8.7575,
        "longitude": -75.8891,
        "crop_type": "maíz",
        "area_hectares": 15.5,
        "altitude_masl": 120,
        "department": "Córdoba",
        "municipality": "Montería",
    }


@pytest.fixture
def sample_sensor_data() -> dict:
    return {
        "device_id": "ESP32-NODE-001",
        "soil_moisture_pct": 45.2,
        "soil_temp_c": 27.8,
        "air_temp_c": 31.4,
        "air_humidity_pct": 68.0,
        "uv_index": 6.8,
        "battery_mv": 3890,
        "rssi_dbm": -62,
        "source": "http",
        "firmware_version": "1.0.0",
    }
