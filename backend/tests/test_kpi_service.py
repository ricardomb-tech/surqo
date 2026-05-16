from __future__ import annotations

import pytest

from app.services.kpi_service import KPIService


@pytest.fixture
def svc() -> KPIService:
    return KPIService()


def test_vpd_calculation(svc: KPIService) -> None:
    vpd = svc.calculate_vpd(30.0, 65.0)
    assert 0.5 < vpd < 2.0


def test_etc_cafe(svc: KPIService) -> None:
    etc = svc.calculate_etc(5.0, "café")
    assert etc == pytest.approx(4.75, rel=0.01)


def test_etc_arroz(svc: KPIService) -> None:
    etc = svc.calculate_etc(4.0, "arroz")
    assert etc == pytest.approx(4.80, rel=0.01)


def test_water_deficit_positive(svc: KPIService) -> None:
    deficit = svc.calculate_water_deficit(30.0, 10.0)
    assert deficit == pytest.approx(20.0, rel=0.01)


def test_water_deficit_no_negative(svc: KPIService) -> None:
    deficit = svc.calculate_water_deficit(5.0, 40.0)
    assert deficit == 0.0


def test_gdd_maiz(svc: KPIService) -> None:
    gdd = svc.calculate_gdd(32.0, 18.0, "maíz")
    # Tbase=10, Tavg=25 → GDD=15
    assert gdd == pytest.approx(15.0, rel=0.01)


def test_soil_health_optimal(svc: KPIService) -> None:
    score = svc.calculate_soil_health_score(55.0, 25.0)
    assert score >= 70


def test_soil_health_dry_hot(svc: KPIService) -> None:
    score = svc.calculate_soil_health_score(10.0, 40.0)
    assert score < 50


def test_pest_risk_high(svc: KPIService) -> None:
    result = svc.calculate_pest_risk(30.0, 85.0, "maíz")
    assert result["risk_pct"] >= 70
    assert "roya" in result["pathogens"]


def test_pest_risk_low(svc: KPIService) -> None:
    result = svc.calculate_pest_risk(22.0, 50.0, "maíz")
    assert result["risk_pct"] < 40
