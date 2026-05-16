from __future__ import annotations

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import pytest_asyncio

from app.services.alert_service import AlertService


@pytest.fixture
def svc() -> AlertService:
    return AlertService()


# ---------------------------------------------------------------------------
# check_thresholds — tests unitarios sin DB ni red
# ---------------------------------------------------------------------------

class TestCheckThresholds:
    def test_all_ok_returns_empty(self, svc: AlertService) -> None:
        reading = {
            "soil_moisture_pct": 50.0,
            "air_temp_c": 28.0,
            "vpd_kpa": 1.0,
            "battery_mv": 3800,
        }
        assert svc.check_thresholds(reading) == []

    def test_soil_moisture_warning(self, svc: AlertService) -> None:
        result = svc.check_thresholds({"soil_moisture_pct": 20.0})
        severities = [s for _, s in result]
        assert "warning" in severities
        assert "critical" not in severities

    def test_soil_moisture_critical(self, svc: AlertService) -> None:
        result = svc.check_thresholds({"soil_moisture_pct": 10.0})
        severities = [s for _, s in result]
        assert "critical" in severities

    def test_air_temp_warning(self, svc: AlertService) -> None:
        result = svc.check_thresholds({"air_temp_c": 39.0})
        assert any(s == "warning" for _, s in result)

    def test_air_temp_critical(self, svc: AlertService) -> None:
        result = svc.check_thresholds({"air_temp_c": 43.0})
        assert any(s == "critical" for _, s in result)

    def test_vpd_warning(self, svc: AlertService) -> None:
        result = svc.check_thresholds({"vpd_kpa": 1.8})
        assert any(s == "warning" for _, s in result)

    def test_vpd_critical(self, svc: AlertService) -> None:
        result = svc.check_thresholds({"vpd_kpa": 3.0})
        assert any(s == "critical" for _, s in result)

    def test_battery_warning(self, svc: AlertService) -> None:
        result = svc.check_thresholds({"battery_mv": 3300})
        assert any(s == "warning" for _, s in result)

    def test_battery_critical(self, svc: AlertService) -> None:
        result = svc.check_thresholds({"battery_mv": 3100})
        assert any(s == "critical" for _, s in result)

    def test_missing_fields_are_skipped(self, svc: AlertService) -> None:
        assert svc.check_thresholds({}) == []

    def test_multiple_violations(self, svc: AlertService) -> None:
        reading = {"soil_moisture_pct": 10.0, "air_temp_c": 43.0, "vpd_kpa": 3.0}
        result = svc.check_thresholds(reading)
        assert len(result) == 3
        assert all(s == "critical" for _, s in result)


# ---------------------------------------------------------------------------
# send_email_alert — mockea resend.Emails.send
# ---------------------------------------------------------------------------

class TestSendEmailAlert:
    @pytest.mark.asyncio
    async def test_send_success(self, svc: AlertService) -> None:
        with patch("resend.Emails.send", return_value={"id": "test-id"}) as mock_send:
            result = await svc.send_email_alert(
                to_email="farmer@example.com",
                farm_name="Finca La Esperanza",
                alert_level="critical",
                summary="Temperatura crítica: 43°C",
                recommendations=[{"category": "CRITICAL", "action": "Regar de inmediato"}],
            )
        assert result is True
        mock_send.assert_called_once()
        call_params = mock_send.call_args[0][0]
        assert "farmer@example.com" in call_params["to"]
        assert "CRITICAL" in call_params["subject"]
        assert "Finca La Esperanza" in call_params["subject"]

    @pytest.mark.asyncio
    async def test_send_failure_returns_false(self, svc: AlertService) -> None:
        with patch("resend.Emails.send", side_effect=Exception("API error")):
            result = await svc.send_email_alert(
                to_email="farmer@example.com",
                farm_name="Test",
                alert_level="warning",
                summary="Test warning",
                recommendations=[],
            )
        assert result is False

    @pytest.mark.asyncio
    async def test_emoji_mapping(self, svc: AlertService) -> None:
        with patch("resend.Emails.send", return_value={"id": "x"}) as mock_send:
            await svc.send_email_alert("a@b.com", "F", "ok", "todo bien", [])
        subject = mock_send.call_args[0][0]["subject"]
        assert "🟢" in subject

        with patch("resend.Emails.send", return_value={"id": "x"}) as mock_send:
            await svc.send_email_alert("a@b.com", "F", "warning", "cuidado", [])
        subject = mock_send.call_args[0][0]["subject"]
        assert "🟡" in subject

        with patch("resend.Emails.send", return_value={"id": "x"}) as mock_send:
            await svc.send_email_alert("a@b.com", "F", "critical", "urgente", [])
        subject = mock_send.call_args[0][0]["subject"]
        assert "🔴" in subject


# ---------------------------------------------------------------------------
# process_threshold_violations — mockea DB y email
# ---------------------------------------------------------------------------

class TestProcessThresholdViolations:
    def _make_db(self) -> AsyncMock:
        db = AsyncMock()
        db.add = MagicMock()
        db.commit = AsyncMock()
        db.refresh = AsyncMock()
        return db

    @pytest.mark.asyncio
    async def test_no_violations_returns_empty(self, svc: AlertService) -> None:
        db = self._make_db()
        reading = {"soil_moisture_pct": 60.0, "air_temp_c": 25.0}
        result = await svc.process_threshold_violations(db, reading, "farm-1", "dev-1")
        assert result == []
        db.add.assert_not_called()

    @pytest.mark.asyncio
    async def test_violation_creates_alert(self, svc: AlertService) -> None:
        db = self._make_db()

        created: list = []

        def capture_add(obj):
            obj.id = uuid.uuid4()
            obj.created_at = datetime.now(timezone.utc)
            obj.email_sent = False
            obj.email_sent_at = None
            created.append(obj)

        db.add.side_effect = capture_add
        db.refresh.side_effect = lambda obj: None

        with patch.object(svc, "_send_with_cooldown", new_callable=AsyncMock, return_value=False):
            result = await svc.process_threshold_violations(
                db=db,
                reading={"soil_moisture_pct": 10.0},
                farm_id="farm-1",
                device_id="dev-1",
            )

        assert len(result) == 1
        db.add.assert_called_once()

    @pytest.mark.asyncio
    async def test_email_sent_when_owner_email_present(self, svc: AlertService) -> None:
        db = self._make_db()

        def capture_add(obj):
            obj.id = uuid.uuid4()
            obj.created_at = datetime.now(timezone.utc)
            obj.email_sent = False
            obj.email_sent_at = None

        db.add.side_effect = capture_add
        db.refresh.side_effect = lambda obj: None

        with patch.object(svc, "_send_with_cooldown", new_callable=AsyncMock, return_value=True) as mock_send:
            await svc.process_threshold_violations(
                db=db,
                reading={"soil_moisture_pct": 10.0},
                farm_id="farm-1",
                device_id="dev-1",
                farm_name="Finca Test",
                owner_email="owner@finca.co",
            )
        mock_send.assert_called_once()
        call_kwargs = mock_send.call_args.kwargs
        assert call_kwargs["owner_email"] == "owner@finca.co"
        assert call_kwargs["farm_name"] == "Finca Test"

    @pytest.mark.asyncio
    async def test_no_email_without_owner(self, svc: AlertService) -> None:
        db = self._make_db()

        def capture_add(obj):
            obj.id = uuid.uuid4()
            obj.created_at = datetime.now(timezone.utc)
            obj.email_sent = False
            obj.email_sent_at = None

        db.add.side_effect = capture_add
        db.refresh.side_effect = lambda obj: None

        with patch.object(svc, "_send_with_cooldown", new_callable=AsyncMock) as mock_send:
            await svc.process_threshold_violations(
                db=db,
                reading={"soil_moisture_pct": 10.0},
                farm_id="farm-1",
                device_id="dev-1",
                owner_email=None,
            )
        mock_send.assert_not_called()


# ---------------------------------------------------------------------------
# _send_with_cooldown — testea la lógica de cooldown
# ---------------------------------------------------------------------------

class TestSendWithCooldown:
    def _make_alert(self) -> MagicMock:
        a = MagicMock()
        a.email_sent = False
        a.email_sent_at = None
        return a

    @pytest.mark.asyncio
    async def test_cooldown_active_skips_email(self, svc: AlertService) -> None:
        alert = self._make_alert()
        db = AsyncMock()

        with patch("app.services.cache_service.cache_service") as mock_cache:
            mock_cache.get = AsyncMock(return_value={"sent": True})

            result = await svc._send_with_cooldown(
                db=db,
                farm_id="farm-1",
                farm_name="Test",
                owner_email="x@x.com",
                violations=[("Humedad baja", "warning")],
                alert_level="warning",
                alerts=[alert],
            )

        assert result is False
        assert alert.email_sent is False

    @pytest.mark.asyncio
    async def test_no_cooldown_sends_email(self, svc: AlertService) -> None:
        alert = self._make_alert()
        db = AsyncMock()
        db.commit = AsyncMock()

        with patch("app.services.cache_service.cache_service") as mock_cache:
            mock_cache.get = AsyncMock(return_value=None)
            mock_cache.set = AsyncMock()

            with patch.object(svc, "send_email_alert", new_callable=AsyncMock, return_value=True):
                result = await svc._send_with_cooldown(
                    db=db,
                    farm_id="farm-1",
                    farm_name="Test",
                    owner_email="x@x.com",
                    violations=[("Humedad baja", "warning")],
                    alert_level="warning",
                    alerts=[alert],
                )

        assert result is True
        assert alert.email_sent is True
        mock_cache.set.assert_called_once()

    @pytest.mark.asyncio
    async def test_redis_unavailable_still_sends(self, svc: AlertService) -> None:
        alert = self._make_alert()
        db = AsyncMock()
        db.commit = AsyncMock()

        with patch("app.services.cache_service.cache_service") as mock_cache:
            mock_cache.get = AsyncMock(side_effect=Exception("Redis down"))
            mock_cache.set = AsyncMock(side_effect=Exception("Redis down"))

            with patch.object(svc, "send_email_alert", new_callable=AsyncMock, return_value=True):
                result = await svc._send_with_cooldown(
                    db=db,
                    farm_id="farm-1",
                    farm_name="Test",
                    owner_email="x@x.com",
                    violations=[("Temperatura alta", "warning")],
                    alert_level="warning",
                    alerts=[alert],
                )

        assert result is True
