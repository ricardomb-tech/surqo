from __future__ import annotations

import logging
from datetime import datetime, timezone

import logfire
import resend
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.alert import Alert

logger = logging.getLogger(__name__)

resend.api_key = settings.RESEND_API_KEY


class AlertService:
    # Umbrales para detección automática
    THRESHOLDS = {
        "soil_moisture_low": 25.0,
        "soil_moisture_critical": 15.0,
        "air_temp_high": 38.0,
        "air_temp_critical": 42.0,
        "vpd_high": 1.6,
        "vpd_critical": 2.5,
        "battery_low": 3400,
        "battery_critical": 3200,
    }

    def check_thresholds(self, reading: dict) -> list[str]:
        violations: list[str] = []

        soil = reading.get("soil_moisture_pct")
        if soil is not None:
            if soil < self.THRESHOLDS["soil_moisture_critical"]:
                violations.append(f"Humedad suelo crítica: {soil:.1f}%")
            elif soil < self.THRESHOLDS["soil_moisture_low"]:
                violations.append(f"Humedad suelo baja: {soil:.1f}%")

        temp = reading.get("air_temp_c")
        if temp is not None:
            if temp > self.THRESHOLDS["air_temp_critical"]:
                violations.append(f"Temperatura crítica: {temp:.1f}°C")
            elif temp > self.THRESHOLDS["air_temp_high"]:
                violations.append(f"Temperatura alta: {temp:.1f}°C")

        vpd = reading.get("vpd_kpa")
        if vpd is not None:
            if vpd > self.THRESHOLDS["vpd_critical"]:
                violations.append(f"VPD crítico: {vpd:.2f} kPa")
            elif vpd > self.THRESHOLDS["vpd_high"]:
                violations.append(f"VPD alto: {vpd:.2f} kPa")

        battery = reading.get("battery_mv")
        if battery is not None:
            if battery < self.THRESHOLDS["battery_critical"]:
                violations.append(f"Batería crítica: {battery}mV")
            elif battery < self.THRESHOLDS["battery_low"]:
                violations.append(f"Batería baja: {battery}mV")

        return violations

    async def create_alert(
        self,
        db: AsyncSession,
        farm_id: str | None,
        device_id: str | None,
        alert_type: str,
        severity: str,
        title: str,
        description: str,
        recommended_action: str | None = None,
        response_time: str | None = None,
    ) -> Alert:
        alert = Alert(
            farm_id=farm_id,
            device_id=device_id,
            alert_type=alert_type,
            severity=severity,
            title=title,
            description=description,
            recommended_action=recommended_action,
            response_time=response_time,
        )
        db.add(alert)
        await db.commit()
        await db.refresh(alert)
        logfire.info("Alerta creada", alert_id=str(alert.id), severity=severity, title=title)
        return alert

    async def send_email_alert(
        self,
        to_email: str,
        farm_name: str,
        alert_level: str,
        summary: str,
        recommendations: list[dict],
    ) -> bool:
        with logfire.span("alert.send_email", to=to_email, level=alert_level):
            try:
                emoji = {"ok": "🟢", "warning": "🟡", "critical": "🔴"}.get(alert_level, "⚠️")
                rec_html = "".join(
                    f"<li><strong>{r.get('category', '')}:</strong> {r.get('action', '')}</li>"
                    for r in recommendations[:3]
                )
                params: resend.Emails.SendParams = {
                    "from": settings.FROM_EMAIL,
                    "to": [to_email],
                    "subject": f"{emoji} Surqo — Alerta {alert_level.upper()}: {farm_name}",
                    "html": f"""
                    <h2>🌾 Surqo — Reporte de tu finca <em>{farm_name}</em></h2>
                    <p><strong>Estado:</strong> {emoji} {alert_level.upper()}</p>
                    <p>{summary}</p>
                    <h3>Recomendaciones principales:</h3>
                    <ul>{rec_html}</ul>
                    <hr>
                    <small>Del surco al insight — <a href="https://surqo.vercel.app">surqo.vercel.app</a></small>
                    """,
                }
                resend.Emails.send(params)
                return True
            except Exception as e:
                logger.error("Error enviando email: %s", e)
                return False
