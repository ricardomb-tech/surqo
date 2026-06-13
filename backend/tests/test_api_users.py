from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_my_profile(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/users/me")
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == "test@surqo.io"
    assert data["plan"] == "free"
    assert "farms_count" in data


@pytest.mark.asyncio
async def test_get_my_profile_farms_count_zero(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/users/me")
    assert resp.status_code == 200
    assert resp.json()["farms_count"] == 0


@pytest.mark.asyncio
async def test_get_my_profile_farms_count_after_create(
    client: AsyncClient, sample_farm_data: dict
) -> None:
    await client.post("/api/v1/farms/", json=sample_farm_data)
    resp = await client.get("/api/v1/users/me")
    assert resp.status_code == 200
    assert resp.json()["farms_count"] == 1


@pytest.mark.asyncio
async def test_get_plan_limits(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/users/me/plan-limits")
    assert resp.status_code == 200
    data = resp.json()
    assert "plan" in data
    assert "farms" in data
    assert data["farms"]["used"] == 0
    assert data["farms"]["limit"] >= 1


@pytest.mark.asyncio
async def test_plan_limits_increments_with_farm(
    client: AsyncClient, sample_farm_data: dict
) -> None:
    await client.post("/api/v1/farms/", json=sample_farm_data)
    resp = await client.get("/api/v1/users/me/plan-limits")
    assert resp.status_code == 200
    assert resp.json()["farms"]["used"] == 1


@pytest.mark.asyncio
async def test_admin_update_plan_forbidden_for_non_admin(client: AsyncClient) -> None:
    """Non-admin user should get 403."""
    import uuid
    resp = await client.patch(
        f"/api/v1/users/{uuid.uuid4()}/plan",
        json={"plan": "paid"},
    )
    assert resp.status_code == 403
