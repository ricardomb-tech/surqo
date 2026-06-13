from __future__ import annotations

import math
from dataclasses import dataclass, field

import httpx
import logfire


@dataclass
class DailyClimate:
    date: str
    temp_max: float
    temp_min: float
    precipitation: float
    rain: float
    et0: float
    uv_max: float
    wind_max: float
    rain_prob_max: float


@dataclass
class ClimateData:
    latitude: float
    longitude: float
    location_name: str
    current_temp: float
    current_humidity: float
    current_precipitation: float
    daily: list[DailyClimate] = field(default_factory=list)
    # Aggregated over 7 days
    temp_min_7d: float = 0.0
    temp_max_7d: float = 0.0
    temp_avg_7d: float = 0.0
    rain_total_7d: float = 0.0
    rain_prob_max_7d: float = 0.0
    et0_total_7d: float = 0.0
    vpd_avg: float = 0.0
    uv_max_7d: float = 0.0


class ClimateService:
    BASE_URL = "https://api.open-meteo.com/v1/forecast"
    NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse"

    async def fetch_forecast(self, lat: float, lon: float, days: int = 7) -> ClimateData:
        with logfire.span("climate.fetch_forecast", lat=lat, lon=lon):
            async with httpx.AsyncClient(timeout=10.0) as client:
                params = {
                    "latitude": lat,
                    "longitude": lon,
                    "daily": ",".join([
                        "temperature_2m_max",
                        "temperature_2m_min",
                        "precipitation_sum",
                        "rain_sum",
                        "windspeed_10m_max",
                        "et0_fao_evapotranspiration",
                        "uv_index_max",
                        "sunshine_duration",
                        "precipitation_probability_max",
                    ]),
                    "current": ",".join([
                        "temperature_2m",
                        "relativehumidity_2m",
                        "precipitation",
                        "windspeed_10m",
                        "weathercode",
                    ]),
                    "timezone": "America/Bogota",
                    "precipitation_unit": "mm",
                    "wind_speed_unit": "kmh",
                    "forecast_days": days,
                }
                try:
                    resp = await client.get(self.BASE_URL, params=params)
                    resp.raise_for_status()
                    data = resp.json()
                except (httpx.TimeoutException, httpx.HTTPStatusError):
                    # Retry once
                    resp = await client.get(self.BASE_URL, params=params)
                    resp.raise_for_status()
                    data = resp.json()

            location_name = await self.get_location_name(lat, lon)
            current = data.get("current", {})
            daily_raw = data.get("daily", {})

            daily_list: list[DailyClimate] = []
            dates = daily_raw.get("time", [])
            for i, d in enumerate(dates):
                daily_list.append(DailyClimate(
                    date=d,
                    temp_max=daily_raw["temperature_2m_max"][i] or 0,
                    temp_min=daily_raw["temperature_2m_min"][i] or 0,
                    precipitation=daily_raw["precipitation_sum"][i] or 0,
                    rain=daily_raw["rain_sum"][i] or 0,
                    et0=daily_raw["et0_fao_evapotranspiration"][i] or 0,
                    uv_max=daily_raw["uv_index_max"][i] or 0,
                    wind_max=daily_raw["windspeed_10m_max"][i] or 0,
                    rain_prob_max=daily_raw["precipitation_probability_max"][i] or 0,
                ))

            current_temp = current.get("temperature_2m", 25.0)
            current_humidity = current.get("relativehumidity_2m", 70.0)
            vpd = self.calculate_vpd(current_temp, current_humidity)

            rain_total = sum(d.rain for d in daily_list)
            et0_total = sum(d.et0 for d in daily_list)
            temps_avg = [(d.temp_max + d.temp_min) / 2 for d in daily_list]

            return ClimateData(
                latitude=lat,
                longitude=lon,
                location_name=location_name,
                current_temp=current_temp,
                current_humidity=current_humidity,
                current_precipitation=current.get("precipitation", 0.0),
                daily=daily_list,
                temp_min_7d=min((d.temp_min for d in daily_list), default=0),
                temp_max_7d=max((d.temp_max for d in daily_list), default=0),
                temp_avg_7d=sum(temps_avg) / len(temps_avg) if temps_avg else 0,
                rain_total_7d=rain_total,
                rain_prob_max_7d=max((d.rain_prob_max for d in daily_list), default=0),
                et0_total_7d=et0_total,
                vpd_avg=vpd,
                uv_max_7d=max((d.uv_max for d in daily_list), default=0),
            )

    def calculate_vpd(self, temp_c: float, humidity_pct: float) -> float:
        # Fórmula Magnus
        es = 0.6108 * math.exp(17.27 * temp_c / (temp_c + 237.3))
        ea = es * humidity_pct / 100
        return max(0.0, round(es - ea, 3))

    def calculate_water_stress(
        self, soil_moisture_pct: float, et0_daily: float, rain_7d_mm: float
    ) -> float:
        stress = 0.0
        if soil_moisture_pct < 20:
            stress += 5.0
        elif soil_moisture_pct < 30:
            stress += 3.0
        elif soil_moisture_pct < 40:
            stress += 1.5

        et0_weekly = et0_daily * 7
        deficit = et0_weekly - rain_7d_mm
        if deficit > 30:
            stress += 4.0
        elif deficit > 15:
            stress += 2.0
        elif deficit > 5:
            stress += 1.0

        return min(10.0, round(stress, 2))

    def calculate_etc(self, et0: float, crop_type: str) -> float:
        kc_map = {
            "maíz": 1.15, "yuca": 0.85, "plátano": 1.10,
            "café": 0.95, "arroz": 1.20, "algodón": 1.05,
        }
        kc = kc_map.get(crop_type.lower(), 1.0)
        return round(et0 * kc, 2)

    async def get_location_name(self, lat: float, lon: float) -> str:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(
                    self.NOMINATIM_URL,
                    params={"lat": lat, "lon": lon, "format": "json", "zoom": 10},
                    headers={"User-Agent": "Surqo/1.0 (surqo.io)"},
                )
                resp.raise_for_status()
                return resp.json().get("display_name", f"{lat:.4f}, {lon:.4f}")
        except Exception:
            return f"{lat:.4f}, {lon:.4f}"
