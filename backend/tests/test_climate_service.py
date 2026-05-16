from __future__ import annotations

import pytest

from app.services.climate_service import ClimateService


@pytest.fixture
def svc() -> ClimateService:
    return ClimateService()


def test_calculate_vpd_dry_hot(svc: ClimateService) -> None:
    # Temperatura alta, humedad baja → VPD alto
    vpd = svc.calculate_vpd(35.0, 40.0)
    assert vpd > 2.5
    assert vpd < 5.0


def test_calculate_vpd_humid_cool(svc: ClimateService) -> None:
    # Temperatura baja, humedad alta → VPD bajo
    vpd = svc.calculate_vpd(20.0, 90.0)
    assert vpd < 0.3


def test_calculate_vpd_never_negative(svc: ClimateService) -> None:
    vpd = svc.calculate_vpd(15.0, 100.0)
    assert vpd == 0.0


def test_calculate_etc_maiz(svc: ClimateService) -> None:
    etc = svc.calculate_etc(5.0, "maíz")
    assert etc == pytest.approx(5.75, rel=0.01)


def test_calculate_etc_default_crop(svc: ClimateService) -> None:
    etc = svc.calculate_etc(4.0, "desconocido")
    assert etc == pytest.approx(4.0, rel=0.01)


def test_calculate_water_stress_severe(svc: ClimateService) -> None:
    stress = svc.calculate_water_stress(10.0, 6.0, 0.0)
    assert stress >= 7.0


def test_calculate_water_stress_normal(svc: ClimateService) -> None:
    stress = svc.calculate_water_stress(55.0, 4.0, 35.0)
    assert stress < 2.0


@pytest.mark.asyncio
async def test_get_location_name_fallback(svc: ClimateService) -> None:
    # Con coordenadas inválidas, debe retornar fallback
    name = await svc.get_location_name(0.0, 0.0)
    assert isinstance(name, str)
    assert len(name) > 0
