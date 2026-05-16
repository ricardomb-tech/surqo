from __future__ import annotations

import logging
from datetime import datetime, timezone

import logfire
import resend
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.alert import Alert

logger = logging.getLogger(__name__)

resend.api_key = settings.RESEND_API_KEY

# Cooldown por defecto: no enviar más de 1 email por finca cada 30 minutos
EMAIL_COOLDOWN_SECONDS = 1800


class AlertService:
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

    def check_thresholds(self, reading: dict) -> list[tuple[str, str]]:
        """Retorna lista de (mensaje, severity) para cada umbral violado."""
        violations: list[tuple[str, str]] = []

        soil = reading.get("soil_moisture_pct")
        if soil is not None:
            if soil < self.THRESHOLDS["soil_moisture_critical"]:
                violations.append((f"Humedad suelo crítica: {soil:.1f}%", "critical"))
            elif soil < self.THRESHOLDS["soil_moisture_low"]:
                violations.append((f"Humedad suelo baja: {soil:.1f}%", "warning"))

        temp = reading.get("air_temp_c")
        if temp is not None:
            if temp > self.THRESHOLDS["air_temp_critical"]:
                violations.append((f"Temperatura crítica: {temp:.1f}°C", "critical"))
            elif temp > self.THRESHOLDS["air_temp_high"]:
                violations.append((f"Temperatura alta: {temp:.1f}°C", "warning"))

        vpd = reading.get("vpd_kpa")
        if vpd is not None:
            if vpd > self.THRESHOLDS["vpd_critical"]:
                violations.append((f"VPD crítico: {vpd:.2f} kPa", "critical"))
            elif vpd > self.THRESHOLDS["vpd_high"]:
                violations.append((f"VPD alto: {vpd:.2f} kPa", "warning"))

        battery = reading.get("battery_mv")
        if battery is not None:
            if battery < self.THRESHOLDS["battery_critical"]:
                violations.append((f"Batería crítica: {battery}mV", "critical"))
            elif battery < self.THRESHOLDS["battery_low"]:
                violations.append((f"Batería baja: {battery}mV", "warning"))

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

    async def process_threshold_violations(
        self,
        db: AsyncSession,
        reading: dict,
        farm_id: str | None,
        device_id: str | None,
        farm_name: str = "Finca",
        owner_email: str | None = None,
        user_id: str | None = None,
    ) -> list[Alert]:
        """Crea alertas en DB y envía email si hay violaciones de umbral y no hay cooldown activo."""
        violations = self.check_thresholds(reading)
        if not violations:
            return []

        created_alerts: list[Alert] = []
        max_severity = "critical" if any(s == "critical" for _, s in violations) else "warning"

        for message, severity in violations:
            alert = await self.create_alert(
                db=db,
                farm_id=farm_id,
                device_id=device_id,
                alert_type="threshold_violation",
                severity=severity,
                title=message,
                description=f"Lectura del dispositivo {device_id or 'desconocido'}: {message}",
                recommended_action="Revisar condiciones del cultivo inmediatamente"
                if severity == "critical"
                else "Monitorear de cerca en las próximas horas",
                response_time="2h" if severity == "critical" else "6h",
            )
            created_alerts.append(alert)

        # Verificar si el usuario puede enviar más alertas por email (límite free)
        can_email = owner_email is not None and farm_id is not None
        if can_email and user_id:
            import uuid as _uuid
            from app.models.user import UserProfile as _UserProfile
            try:
                uid = _uuid.UUID(user_id)
                profile = await db.get(_UserProfile, uid)
                if profile and not profile.can_send_email_alert:
                    can_email = False
                    logger.info(
                        "Límite de alertas email alcanzado para usuario %s (plan free)", user_id
                    )
            except (ValueError, Exception):
                pass

        if can_email:
            sent = await self._send_with_cooldown(
                db=db,
                farm_id=farm_id,
                farm_name=farm_name,
                owner_email=owner_email,
                violations=violations,
                alert_level=max_severity,
                alerts=created_alerts,
            )
            if sent:
                logfire.info(
                    "Email de alerta enviado",
                    farm_id=farm_id,
                    to=owner_email,
                    violations=len(violations),
                )
                # Incrementar contador mensual del usuario
                if user_id:
                    import uuid as _uuid
                    from app.models.user import UserProfile as _UP
                    try:
                        profile = await db.get(_UP, _uuid.UUID(user_id))
                        if profile:
                            profile.email_alerts_this_month += 1
                            await db.commit()
                    except Exception:
                        pass

        return created_alerts

    async def _send_with_cooldown(
        self,
        db: AsyncSession,
        farm_id: str,
        farm_name: str,
        owner_email: str,
        violations: list[tuple[str, str]],
        alert_level: str,
        alerts: list[Alert],
    ) -> bool:
        """Comprueba cooldown en Redis antes de enviar email. Si Redis no está disponible, envía igualmente."""
        from app.services.cache_service import cache_service

        cooldown_key = f"alert_email_cooldown:{farm_id}"
        try:
            cached = await cache_service.get(cooldown_key)
            if cached:
                logger.debug("Email en cooldown para farm %s, omitiendo", farm_id)
                return False
        except Exception:
            pass  # Redis no disponible → continuar de todas formas

        summary = "; ".join(msg for msg, _ in violations)
        recommendations = [
            {"category": sev.upper(), "action": msg} for msg, sev in violations[:3]
        ]
        sent = await self.send_email_alert(
            to_email=owner_email,
            farm_name=farm_name,
            alert_level=alert_level,
            summary=summary,
            recommendations=recommendations,
        )

        if sent:
            # Marcar alertas como notificadas por email
            now = datetime.now(timezone.utc)
            for alert in alerts:
                alert.email_sent = True
                alert.email_sent_at = now
            await db.commit()

            # Activar cooldown
            try:
                await cache_service.set(cooldown_key, {"sent": True}, ttl=EMAIL_COOLDOWN_SECONDS)
            except Exception:
                pass

        return sent

    async def send_email_for_alert(self, db: AsyncSession, alert: Alert, farm_name: str, to_email: str) -> bool:
        """Envía email para una alerta específica (disparo manual desde endpoint)."""
        sent = await self.send_email_alert(
            to_email=to_email,
            farm_name=farm_name,
            alert_level=alert.severity,
            summary=alert.description,
            recommendations=[{"category": alert.severity.upper(), "action": alert.recommended_action or alert.title}],
        )
        if sent:
            alert.email_sent = True
            alert.email_sent_at = datetime.now(timezone.utc)
            await db.commit()
        return sent

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
                color = {"ok": "#16a34a", "warning": "#d97706", "critical": "#dc2626"}.get(alert_level, "#6b7280")
                rec_rows = "".join(
                    f"""
                    <tr>
                      <td style="padding:8px 12px;border-bottom:1px solid #f0fdf4;">
                        <strong style="color:{color}">{r.get('category', '')}:</strong>
                        {r.get('action', '')}
                      </td>
                    </tr>"""
                    for r in recommendations[:3]
                )
                html_body = f"""
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0fdf4;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;padding:32px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">

        <!-- Header -->
        <tr>
          <td style="background:{color};padding:24px 32px;text-align:center">
            <h1 style="color:#fff;margin:0;font-size:22px">🌾 Surqo — Alerta de Campo</h1>
            <p style="color:rgba(255,255,255,.85);margin:6px 0 0;font-size:14px">Del surco al insight</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:28px 32px">
            <p style="font-size:16px;margin:0 0 8px">
              Estado de tu finca <strong>{farm_name}</strong>:
            </p>
            <div style="display:inline-block;background:#fef9c3;border:1px solid {color};border-radius:6px;padding:8px 16px;margin-bottom:20px;font-size:18px;font-weight:700;color:{color}">
              {emoji} {alert_level.upper()}
            </div>

            <p style="color:#374151;line-height:1.6;margin:0 0 20px">{summary}</p>

            <h3 style="color:#166534;margin:0 0 12px;font-size:15px">Acciones recomendadas:</h3>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #dcfce7;border-radius:8px;overflow:hidden">
              {rec_rows}
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #e5e7eb">
            <p style="color:#6b7280;font-size:12px;margin:0">
              Surqo · Inteligencia agroclimática para el campo colombiano<br>
              <a href="https://surqo.vercel.app" style="color:#16a34a">surqo.vercel.app</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>"""

                params: resend.Emails.SendParams = {
                    "from": settings.FROM_EMAIL,
                    "to": [to_email],
                    "subject": f"{emoji} Surqo — Alerta {alert_level.upper()}: {farm_name}",
                    "html": html_body,
                }
                resend.Emails.send(params)
                return True
            except Exception as e:
                logger.error("Error enviando email: %s", e)
                return False
