from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health(client: AsyncClient) -> None:
    resp = await client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert data["service"] == "surqo-api"


@pytest.mark.asyncio
async def test_create_farm(client: AsyncClient, sample_farm_data: dict) -> None:
    resp = await client.post("/api/v1/farms/", json=sample_farm_data)
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == sample_farm_data["name"]
    assert data["crop_type"] == sample_farm_data["crop_type"]
    assert "id" in data


@pytest.mark.asyncio
async def test_list_farms(client: AsyncClient, sample_farm_data: dict) -> None:
    await client.post("/api/v1/farms/", json=sample_farm_data)
    resp = await client.get("/api/v1/farms/")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
    assert len(resp.json()) >= 1


@pytest.mark.asyncio
async def test_get_farm_not_found(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/farms/00000000-0000-0000-0000-000000000000")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_ingest_sensor_reading(client: AsyncClient, sample_sensor_data: dict) -> None:
    resp = await client.post("/api/v1/sensors/reading", json=sample_sensor_data)
    assert resp.status_code == 201
    data = resp.json()
    assert data["device_id"] == sample_sensor_data["device_id"]
    assert data["vpd_kpa"] is not None  # Calculado automáticamente


@pytest.mark.asyncio
async def test_get_latest_sensor_not_found(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/sensors/latest/NONEXISTENT-DEVICE")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_get_latest_sensor(client: AsyncClient, sample_sensor_data: dict) -> None:
    await client.post("/api/v1/sensors/reading", json=sample_sensor_data)
    resp = await client.get(f"/api/v1/sensors/latest/{sample_sensor_data['device_id']}")
    assert resp.status_code == 200
    assert resp.json()["device_id"] == sample_sensor_data["device_id"]


@pytest.mark.asyncio
async def test_create_farm_invalid_coordinates(client: AsyncClient) -> None:
    bad_data = {
        "name": "Test",
        "latitude": 999.0,  # Inválido
        "longitude": -75.0,
        "crop_type": "maíz",
    }
    resp = await client.post("/api/v1/farms/", json=bad_data)
    assert resp.status_code == 422
