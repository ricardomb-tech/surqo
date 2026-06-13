from __future__ import annotations

import uuid

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_ingest_sensor_reading(client: AsyncClient, sample_sensor_data: dict) -> None:
    resp = await client.post("/api/v1/sensors/reading", json=sample_sensor_data)
    assert resp.status_code == 201
    data = resp.json()
    assert data["device_id"] == sample_sensor_data["device_id"]
    assert data["vpd_kpa"] is not None  # auto-calculated


@pytest.mark.asyncio
async def test_ingest_sensor_vpd_calculated(client: AsyncClient, sample_sensor_data: dict) -> None:
    resp = await client.post("/api/v1/sensors/reading", json=sample_sensor_data)
    assert resp.status_code == 201
    vpd = resp.json()["vpd_kpa"]
    assert isinstance(vpd, float)
    assert vpd > 0


@pytest.mark.asyncio
async def test_ingest_sensor_missing_fields(client: AsyncClient) -> None:
    """POST without required device_id returns 422."""
    resp = await client.post("/api/v1/sensors/reading", json={"soil_moisture_pct": 50.0})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_get_latest_sensor(client: AsyncClient, sample_sensor_data: dict) -> None:
    await client.post("/api/v1/sensors/reading", json=sample_sensor_data)
    resp = await client.get(f"/api/v1/sensors/latest/{sample_sensor_data['device_id']}")
    assert resp.status_code == 200
    assert resp.json()["device_id"] == sample_sensor_data["device_id"]


@pytest.mark.asyncio
async def test_get_latest_sensor_not_found(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/sensors/latest/NONEXISTENT-DEVICE")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_get_latest_returns_most_recent(client: AsyncClient) -> None:
    payload_old = {
        "device_id": "DEVICE-MULTI",
        "soil_moisture_pct": 30.0,
        "air_temp_c": 25.0,
        "air_humidity_pct": 60.0,
        "source": "http",
    }
    payload_new = {**payload_old, "soil_moisture_pct": 75.0}

    await client.post("/api/v1/sensors/reading", json=payload_old)
    await client.post("/api/v1/sensors/reading", json=payload_new)

    resp = await client.get("/api/v1/sensors/latest/DEVICE-MULTI")
    assert resp.status_code == 200
    assert float(resp.json()["soil_moisture_pct"]) == pytest.approx(75.0, rel=0.01)


@pytest.mark.asyncio
async def test_timeseries_empty(client: AsyncClient) -> None:
    farm_id = str(uuid.uuid4())
    resp = await client.get(f"/api/v1/sensors/timeseries/{farm_id}")
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_timeseries_invalid_metric(client: AsyncClient) -> None:
    farm_id = str(uuid.uuid4())
    resp = await client.get(f"/api/v1/sensors/timeseries/{farm_id}?metric=invalid_metric")
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_timeseries_with_farm_data(client: AsyncClient, sample_farm_data: dict) -> None:
    # Create farm first
    farm_resp = await client.post("/api/v1/farms/", json=sample_farm_data)
    farm_id = farm_resp.json()["id"]

    # Ingest a reading linked to the farm
    reading = {
        "device_id": "DEVICE-TS",
        "farm_id": farm_id,
        "soil_moisture_pct": 55.0,
        "air_temp_c": 30.0,
        "air_humidity_pct": 70.0,
        "source": "http",
    }
    await client.post("/api/v1/sensors/reading", json=reading)

    resp = await client.get(f"/api/v1/sensors/timeseries/{farm_id}")
    assert resp.status_code == 200
    points = resp.json()
    assert len(points) == 1
    assert float(points[0]["value"]) == pytest.approx(55.0, rel=0.01)


@pytest.mark.asyncio
async def test_stats_no_data(client: AsyncClient) -> None:
    farm_id = str(uuid.uuid4())
    resp = await client.get(f"/api/v1/sensors/stats/{farm_id}")
    assert resp.status_code == 200
    assert "error" in resp.json()
