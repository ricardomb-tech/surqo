from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.sensor_reading import SensorReading


def _avg(vals: list[float]) -> float | None:
    return round(sum(vals) / len(vals), 1) if vals else None


def build_sensor_context(readings: list[SensorReading]) -> dict | None:
    """Resume una lista de lecturas (ordenadas de más nueva a más vieja) en
    tendencias legibles para el LLM. Un valor + su tendencia ("la humedad bajó
    de 60% a 44% en 6h") permite decisiones de riego mucho mejores que una foto
    puntual.
    """
    if not readings:
        return None

    newest, oldest = readings[0], readings[-1]
    n = len(readings)

    span_h = 0.0
    if newest.created_at and oldest.created_at:
        span_h = (newest.created_at - oldest.created_at).total_seconds() / 3600

    ctx: dict[str, str] = {}

    # Humedad de suelo — actual + tendencia (lo más importante para riego)
    soils = [float(r.soil_moisture_pct) for r in readings if r.soil_moisture_pct is not None]
    if soils:
        cur = soils[0]
        ctx["Humedad suelo (actual)"] = f"{cur:.0f}%"
        if len(soils) >= 2 and span_h > 0.1:
            old = soils[-1]
            delta = cur - old
            rate = delta / span_h
            dirn = "bajando" if delta < -1 else ("subiendo" if delta > 1 else "estable")
            ctx["Humedad suelo (tendencia)"] = (
                f"{dirn}: {old:.0f}% → {cur:.0f}% en {span_h:.1f}h ({rate:+.1f}%/h)"
            )

    st = [float(r.soil_temp_c) for r in readings if r.soil_temp_c is not None]
    if st:
        ctx["Temperatura suelo (actual)"] = f"{st[0]:.1f}°C"

    at = [float(r.air_temp_c) for r in readings if r.air_temp_c is not None]
    if at:
        ctx["Temperatura aire"] = f"actual {at[0]:.1f}°C · min {min(at):.1f} / max {max(at):.1f} / prom {_avg(at)}°C"

    ah = [float(r.air_humidity_pct) for r in readings if r.air_humidity_pct is not None]
    if ah:
        ctx["Humedad aire"] = f"actual {ah[0]:.0f}% · prom {_avg(ah):.0f}%"

    vp = [float(r.vpd_kpa) for r in readings if r.vpd_kpa is not None]
    if vp:
        ctx["VPD"] = f"actual {vp[0]:.2f} kPa · prom {_avg(vp)} kPa"

    if newest.battery_mv:
        ctx["Batería"] = f"{newest.battery_mv}mV"

    ctx["Lecturas analizadas"] = f"{n} lecturas en {span_h:.1f}h"
    return ctx or None
