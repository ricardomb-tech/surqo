from __future__ import annotations

import math
from datetime import datetime, timedelta, timezone

import logfire
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.sensor_reading import SensorReading


class KPIService:
    KC_COEFFICIENTS = {
        "maíz": 1.15, "yuca": 0.85, "plátano": 1.10,
        "café": 0.95, "arroz": 1.20, "algodón": 1.05,
    }
    TBASE = {"maíz": 10, "arroz": 10, "café": 15}

    def calculate_vpd(self, temp_c: float, humidity_pct: float) -> float:
        es = 0.6108 * math.exp(17.27 * temp_c / (temp_c + 237.3))
        ea = es * humidity_pct / 100
        return max(0.0, round(es - ea, 3))

    def calculate_etc(self, et0: float, crop_type: str) -> float:
        kc = self.KC_COEFFICIENTS.get(crop_type.lower(), 1.0)
        return round(et0 * kc, 2)

    def calculate_water_deficit(self, etc_7d: float, rain_7d: float) -> float:
        return max(0.0, round(etc_7d - rain_7d, 2))

    def calculate_gdd(self, tmax: float, tmin: float, crop_type: str) -> float:
        tbase = self.TBASE.get(crop_type.lower(), 10)
        tavg = (tmax + tmin) / 2
        return max(0.0, round(tavg - tbase, 2))

    def calculate_soil_health_score(
        self,
        soil_moisture: float,
        soil_temp: float,
        ec: float | None = None,
    ) -> int:
        score = 0
        # Humedad óptima 40-70%
        if 40 <= soil_moisture <= 70:
            score += 40
        elif 30 <= soil_moisture < 40 or 70 < soil_moisture <= 80:
            score += 25
        elif 20 <= soil_moisture < 30:
            score += 10

        # Temperatura suelo óptima 15-30°C
        if 15 <= soil_temp <= 30:
            score += 30
        elif 10 <= soil_temp < 15 or 30 < soil_temp <= 35:
            score += 15

        # EC (si disponible)
        if ec is not None:
            if 200 <= ec <= 800:
                score += 30
            elif 100 <= ec < 200 or 800 < ec <= 1200:
                score += 15
        else:
            score += 15  # Neutral si no hay dato

        return min(100, score)

    def calculate_pest_risk(
        self, temp_c: float, humidity_pct: float, crop_type: str
    ) -> dict:
        risk_pct = 0
        pathogens: list[str] = []
        conditions: str = "Condiciones normales"

        # Riesgo fungal: temp alta + alta humedad
        if temp_c > 25 and humidity_pct > 80:
            risk_pct = 75
            conditions = "Alta temperatura y humedad — riesgo fungal elevado"
        elif temp_c > 22 and humidity_pct > 70:
            risk_pct = 40
            conditions = "Condiciones moderadas de riesgo"
        elif humidity_pct > 85:
            risk_pct = 50
            conditions = "Humedad muy alta — vigilar enfermedades"

        crop_pathogens = {
            "maíz": ["roya", "fusarium", "pudrición de mazorca"],
            "café": ["roya del café", "broca", "antracnosis"],
            "plátano": ["sigatoka negra", "moko"],
            "yuca": ["bacteriosis", "superalargamiento"],
            "arroz": ["pyricularia", "helminthosporium"],
            "algodón": ["verticillium", "fusarium"],
        }
        if risk_pct > 40:
            pathogens = crop_pathogens.get(crop_type.lower(), ["hongos foliares"])

        return {
            "risk_pct": risk_pct,
            "pathogens": pathogens,
            "conditions": conditions,
        }

    async def get_farm_kpis(self, farm_id: str, db: AsyncSession) -> dict:
        with logfire.span("kpi.get_farm_kpis", farm_id=farm_id):
            since = datetime.now(timezone.utc) - timedelta(hours=24)
            stmt = (
                select(SensorReading)
                .where(
                    SensorReading.farm_id == farm_id,
                    SensorReading.created_at >= since,
                )
                .order_by(SensorReading.created_at.desc())
            )
            result = await db.execute(stmt)
            readings = result.scalars().all()

            if not readings:
                return {"error": "Sin lecturas en las últimas 24 horas"}

            latest = readings[0]
            avg_temp = sum(float(r.air_temp_c) for r in readings if r.air_temp_c) / max(
                sum(1 for r in readings if r.air_temp_c), 1
            )
            avg_humidity = sum(float(r.air_humidity_pct) for r in readings if r.air_humidity_pct) / max(
                sum(1 for r in readings if r.air_humidity_pct), 1
            )
            avg_soil = sum(float(r.soil_moisture_pct) for r in readings if r.soil_moisture_pct) / max(
                sum(1 for r in readings if r.soil_moisture_pct), 1
            )

            vpd = self.calculate_vpd(avg_temp, avg_humidity)
            soil_health = self.calculate_soil_health_score(
                avg_soil,
                float(latest.soil_temp_c) if latest.soil_temp_c else 25.0,
            )
            pest_risk = self.calculate_pest_risk(avg_temp, avg_humidity, "maíz")

            return {
                "vpd_kpa": vpd,
                "avg_air_temp_c": round(avg_temp, 2),
                "avg_humidity_pct": round(avg_humidity, 2),
                "avg_soil_moisture_pct": round(avg_soil, 2),
                "soil_health_score": soil_health,
                "pest_risk": pest_risk,
                "readings_count_24h": len(readings),
                "latest_reading_at": latest.created_at.isoformat() if latest.created_at else None,
            }
