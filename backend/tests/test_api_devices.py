from __future__ import annotations

import uuid

import pytest
from httpx import AsyncClient


async def _create_user_farm(client: AsyncClient, sample_farm_data: dict) -> str:
    resp = await client.post("/api/v1/farms/", json=sample_farm_data)
    return resp.json()["id"]


def _random_mac() -> str:
    return uuid.uuid4().hex[:12]


@pytest.mark.asyncio
async def test_register_new_device(client: AsyncClient) -> None:
    mac = _random_mac()
    resp = await client.post(
        "/api/v1/devices/register",
        json={"device_mac": mac, "firmware_version": "2.0.0"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["is_claimed"] is False
    assert data["device_secret"] is None
    assert len(data["claim_code"]) == 6


@pytest.mark.asyncio
async def test_claim_then_register_issues_secret_once(
    client: AsyncClient, sample_farm_data: dict
) -> None:
    mac = _random_mac()
    reg = await client.post("/api/v1/devices/register", json={"device_mac": mac})
    claim_code = reg.json()["claim_code"]

    farm_id = await _create_user_farm(client, sample_farm_data)
    claim = await client.post(
        "/api/v1/devices/claim",
        json={"claim_code": claim_code, "farm_id": farm_id},
    )
    assert claim.status_code == 201

    # Primer /register tras el claim: cae dentro de la ventana TOFU -> secreto.
    reg2 = await client.post("/api/v1/devices/register", json={"device_mac": mac})
    secret = reg2.json()["device_secret"]
    assert secret is not None
    assert len(secret) == 32  # secrets.token_hex(16)

    # Segundo /register: el secreto ya fue emitido, no se reenvía.
    reg3 = await client.post("/api/v1/devices/register", json={"device_mac": mac})
    assert reg3.json()["device_secret"] is None


@pytest.mark.asyncio
async def test_reading_without_secret_before_provisioning_still_works(
    client: AsyncClient, sample_farm_data: dict
) -> None:
    """Compatibilidad hacia atrás: si el dispositivo aún no tiene secreto
    (nunca completó el intercambio TOFU), la ingesta sigue aceptando lecturas
    sin device_secret -- igual que el comportamiento previo a esta migración."""
    mac = _random_mac()
    await client.post("/api/v1/devices/register", json={"device_mac": mac})
    farm_id = await _create_user_farm(client, sample_farm_data)
    reg = await client.post("/api/v1/devices/register", json={"device_mac": mac})
    claim_code = reg.json()["claim_code"]
    await client.post(
        "/api/v1/devices/claim", json={"claim_code": claim_code, "farm_id": farm_id}
    )
    # Nota: no volvemos a llamar /register, así que el secreto nunca se emitió.

    resp = await client.post(
        f"/api/v1/devices/{mac}/reading",
        json={"device_id": mac, "sensors": {"soil_moisture_pct": 40.0}},
    )
    assert resp.status_code == 202
    assert resp.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_reading_rejected_without_secret_once_provisioned(
    client: AsyncClient, sample_farm_data: dict
) -> None:
    mac = _random_mac()
    await client.post("/api/v1/devices/register", json={"device_mac": mac})
    farm_id = await _create_user_farm(client, sample_farm_data)
    reg = await client.post("/api/v1/devices/register", json={"device_mac": mac})
    claim_code = reg.json()["claim_code"]
    await client.post(
        "/api/v1/devices/claim", json={"claim_code": claim_code, "farm_id": farm_id}
    )
    # Este /register cae en la ventana TOFU y emite el secreto.
    await client.post("/api/v1/devices/register", json={"device_mac": mac})

    resp = await client.post(
        f"/api/v1/devices/{mac}/reading",
        json={"device_id": mac, "sensors": {"soil_moisture_pct": 40.0}},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_reading_accepted_with_correct_secret(
    client: AsyncClient, sample_farm_data: dict
) -> None:
    mac = _random_mac()
    await client.post("/api/v1/devices/register", json={"device_mac": mac})
    farm_id = await _create_user_farm(client, sample_farm_data)
    reg = await client.post("/api/v1/devices/register", json={"device_mac": mac})
    claim_code = reg.json()["claim_code"]
    await client.post(
        "/api/v1/devices/claim", json={"claim_code": claim_code, "farm_id": farm_id}
    )
    reg2 = await client.post("/api/v1/devices/register", json={"device_mac": mac})
    secret = reg2.json()["device_secret"]

    resp = await client.post(
        f"/api/v1/devices/{mac}/reading",
        json={
            "device_id": mac,
            "device_secret": secret,
            "sensors": {"soil_moisture_pct": 40.0},
        },
    )
    assert resp.status_code == 202
    assert resp.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_unclaim_clears_secret(client: AsyncClient, sample_farm_data: dict) -> None:
    mac = _random_mac()
    await client.post("/api/v1/devices/register", json={"device_mac": mac})
    farm_id = await _create_user_farm(client, sample_farm_data)
    reg = await client.post("/api/v1/devices/register", json={"device_mac": mac})
    claim_code = reg.json()["claim_code"]
    claim = await client.post(
        "/api/v1/devices/claim", json={"claim_code": claim_code, "farm_id": farm_id}
    )
    device_id = claim.json()["id"]
    await client.post("/api/v1/devices/register", json={"device_mac": mac})  # emite secreto

    del_resp = await client.delete(f"/api/v1/devices/{device_id}")
    assert del_resp.status_code == 204

    # Re-claim (misma finca, plan free permite 1 sola): como el secreto se
    # limpió al desvincular, la ventana TOFU se reabre y un nuevo /register
    # debe volver a emitir un secreto (no seguir bloqueado para siempre).
    reg3 = await client.post("/api/v1/devices/register", json={"device_mac": mac})
    claim_code_2 = reg3.json()["claim_code"]
    await client.post(
        "/api/v1/devices/claim", json={"claim_code": claim_code_2, "farm_id": farm_id}
    )
    reg4 = await client.post("/api/v1/devices/register", json={"device_mac": mac})
    assert reg4.json()["device_secret"] is not None
