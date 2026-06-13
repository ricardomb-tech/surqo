from __future__ import annotations

import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.alert import Alert
from tests.conftest import TEST_USER_ID


async def _create_alert(db: AsyncSession, **kwargs) -> Alert:
    """Helper: insert an alert directly into the test DB."""
    defaults = {
        "farm_id": None,
        "alert_type": "drought_stress",
        "severity": "high",
        "title": "Estrés hídrico detectado",
        "description": "La humedad del suelo está por debajo del umbral crítico.",
        "recommended_action": "Riego inmediato",
        "is_resolved": False,
    }
    defaults.update(kwargs)
    alert = Alert(**defaults)
    db.add(alert)
    await db.commit()
    await db.refresh(alert)
    return alert


# ---------------------------------------------------------------------------
# GET /active
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_active_alerts_empty(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/alerts/active")
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_get_active_alerts_returns_unresolved(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    await _create_alert(db_session)
    resp = await client.get("/api/v1/alerts/active")
    assert resp.status_code == 200
    alerts = resp.json()
    assert len(alerts) == 1
    assert alerts[0]["is_resolved"] is False


@pytest.mark.asyncio
async def test_get_active_alerts_excludes_resolved(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    await _create_alert(db_session, is_resolved=True)
    resp = await client.get("/api/v1/alerts/active")
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_get_active_alerts_filtered_by_farm(
    client: AsyncClient, db_session: AsyncSession, sample_farm_data: dict
) -> None:
    farm_resp = await client.post("/api/v1/farms/", json=sample_farm_data)
    farm_id = uuid.UUID(farm_resp.json()["id"])

    await _create_alert(db_session, farm_id=farm_id)
    await _create_alert(db_session)  # alert without farm

    resp = await client.get(f"/api/v1/alerts/active?farm_id={farm_id}")
    assert resp.status_code == 200
    alerts = resp.json()
    assert len(alerts) == 1
    assert alerts[0]["farm_id"] == str(farm_id)


# ---------------------------------------------------------------------------
# GET /history
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_alert_history(client: AsyncClient, db_session: AsyncSession) -> None:
    await _create_alert(db_session, is_resolved=True)
    await _create_alert(db_session, is_resolved=False)

    resp = await client.get("/api/v1/alerts/history")
    assert resp.status_code == 200
    assert len(resp.json()) == 2


@pytest.mark.asyncio
async def test_get_alert_history_limit(client: AsyncClient, db_session: AsyncSession) -> None:
    for i in range(5):
        await _create_alert(db_session, title=f"Alerta {i}")

    resp = await client.get("/api/v1/alerts/history?limit=3")
    assert resp.status_code == 200
    assert len(resp.json()) == 3


# ---------------------------------------------------------------------------
# GET /{alert_id}
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_alert_by_id(client: AsyncClient, db_session: AsyncSession) -> None:
    alert = await _create_alert(db_session)
    resp = await client.get(f"/api/v1/alerts/{alert.id}")
    assert resp.status_code == 200
    assert resp.json()["id"] == str(alert.id)


@pytest.mark.asyncio
async def test_get_alert_not_found(client: AsyncClient) -> None:
    resp = await client.get(f"/api/v1/alerts/{uuid.uuid4()}")
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# PATCH /{alert_id}/resolve
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_resolve_alert(client: AsyncClient, db_session: AsyncSession) -> None:
    alert = await _create_alert(db_session)
    resp = await client.patch(
        f"/api/v1/alerts/{alert.id}/resolve",
        json={"resolved": True},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["is_resolved"] is True
    assert data["resolved_at"] is not None


@pytest.mark.asyncio
async def test_unresolve_alert(client: AsyncClient, db_session: AsyncSession) -> None:
    alert = await _create_alert(db_session, is_resolved=True)
    resp = await client.patch(
        f"/api/v1/alerts/{alert.id}/resolve",
        json={"resolved": False},
    )
    assert resp.status_code == 200
    assert resp.json()["is_resolved"] is False


@pytest.mark.asyncio
async def test_resolve_alert_not_found(client: AsyncClient) -> None:
    resp = await client.patch(
        f"/api/v1/alerts/{uuid.uuid4()}/resolve",
        json={"resolved": True},
    )
    assert resp.status_code == 404
