from __future__ import annotations

import uuid
from collections.abc import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.database import Base, get_db
from app.dependencies import get_current_user
from app.main import app
from app.models.user import UserProfile

# SQLite en memoria para tests
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine_test = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = async_sessionmaker(
    engine_test, class_=AsyncSession, expire_on_commit=False
)


async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
    async with TestSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


_TEST_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")


def override_get_current_user() -> UserProfile:
    return UserProfile(
        user_id=_TEST_USER_ID,
        email="test@surqo.io",
        full_name="Test User",
        plan="free",
    )


app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_current_user] = override_get_current_user


@pytest_asyncio.fixture(scope="session", autouse=True)
async def create_tables():
    async with engine_test.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    # Seed test user so FK constraints pass
    async with TestSessionLocal() as session:
        session.add(UserProfile(
            user_id=_TEST_USER_ID,
            email="test@surqo.io",
            full_name="Test User",
            plan="free",
        ))
        await session.commit()
    yield
    async with engine_test.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


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
