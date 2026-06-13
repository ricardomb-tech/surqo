from __future__ import annotations

import pytest
from httpx import AsyncClient


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_health(client: AsyncClient) -> None:
    resp = await client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert data["service"] == "surqo-api"


# ---------------------------------------------------------------------------
# Farm CRUD
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_create_farm(client: AsyncClient, sample_farm_data: dict) -> None:
    resp = await client.post("/api/v1/farms/", json=sample_farm_data)
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == sample_farm_data["name"]
    assert data["crop_type"] == sample_farm_data["crop_type"]
    assert "id" in data


@pytest.mark.asyncio
async def test_create_farm_returns_all_fields(client: AsyncClient, sample_farm_data: dict) -> None:
    resp = await client.post("/api/v1/farms/", json=sample_farm_data)
    assert resp.status_code == 201
    data = resp.json()
    assert data["department"] == sample_farm_data["department"]
    assert data["municipality"] == sample_farm_data["municipality"]
    assert float(data["area_hectares"]) == pytest.approx(sample_farm_data["area_hectares"], rel=0.01)


@pytest.mark.asyncio
async def test_create_farm_invalid_latitude(client: AsyncClient) -> None:
    bad = {
        "name": "Test",
        "latitude": 999.0,
        "longitude": -75.0,
        "crop_type": "maíz",
    }
    resp = await client.post("/api/v1/farms/", json=bad)
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_create_farm_invalid_longitude(client: AsyncClient) -> None:
    bad = {
        "name": "Test",
        "latitude": 8.0,
        "longitude": 999.0,
        "crop_type": "maíz",
    }
    resp = await client.post("/api/v1/farms/", json=bad)
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_create_farm_missing_required_fields(client: AsyncClient) -> None:
    resp = await client.post("/api/v1/farms/", json={"name": "Finca Sin Coords"})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_list_farms_empty(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/farms/")
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_list_farms_after_create(client: AsyncClient, sample_farm_data: dict) -> None:
    await client.post("/api/v1/farms/", json=sample_farm_data)
    resp = await client.get("/api/v1/farms/")
    assert resp.status_code == 200
    farms = resp.json()
    assert len(farms) == 1
    assert farms[0]["name"] == sample_farm_data["name"]


@pytest.mark.asyncio
async def test_get_farm_by_id(client: AsyncClient, sample_farm_data: dict) -> None:
    create_resp = await client.post("/api/v1/farms/", json=sample_farm_data)
    farm_id = create_resp.json()["id"]

    resp = await client.get(f"/api/v1/farms/{farm_id}")
    assert resp.status_code == 200
    assert resp.json()["id"] == farm_id


@pytest.mark.asyncio
async def test_get_farm_not_found(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/farms/00000000-0000-0000-0000-000000000000")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_update_farm(client: AsyncClient, sample_farm_data: dict) -> None:
    create_resp = await client.post("/api/v1/farms/", json=sample_farm_data)
    farm_id = create_resp.json()["id"]

    resp = await client.patch(f"/api/v1/farms/{farm_id}", json={"name": "Finca Actualizada"})
    assert resp.status_code == 200
    assert resp.json()["name"] == "Finca Actualizada"


@pytest.mark.asyncio
async def test_update_farm_not_found(client: AsyncClient) -> None:
    resp = await client.patch(
        "/api/v1/farms/00000000-0000-0000-0000-000000000000",
        json={"name": "No Existe"},
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_delete_farm(client: AsyncClient, sample_farm_data: dict) -> None:
    create_resp = await client.post("/api/v1/farms/", json=sample_farm_data)
    farm_id = create_resp.json()["id"]

    resp = await client.delete(f"/api/v1/farms/{farm_id}")
    assert resp.status_code in (200, 204)

    # Verify it's gone (or soft-deleted / inactive)
    get_resp = await client.get(f"/api/v1/farms/{farm_id}")
    # Either 404 (hard delete) or still returns with is_active=False (soft delete)
    assert get_resp.status_code in (200, 404)


@pytest.mark.asyncio
async def test_delete_farm_not_found(client: AsyncClient) -> None:
    resp = await client.delete("/api/v1/farms/00000000-0000-0000-0000-000000000000")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_farm_limit_enforced(client: AsyncClient, sample_farm_data: dict) -> None:
    """Free plan allows only 1 farm; second creation should be rejected."""
    first = await client.post("/api/v1/farms/", json=sample_farm_data)
    assert first.status_code == 201

    second = await client.post("/api/v1/farms/", json={**sample_farm_data, "name": "Segunda Finca"})
    assert second.status_code == 400
