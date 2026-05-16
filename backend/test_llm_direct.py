"""Day 3 — test directo del LLMService con Anthropic real."""
import asyncio
import sys

from dotenv import load_dotenv
load_dotenv()

from app.services.climate_service import ClimateService
from app.services.llm_service import LLMService
from app.config import settings


async def main():
    print(f"Model : {settings.LLM_MODEL}")
    print(f"Key   : {settings.ANTHROPIC_API_KEY[:20]}...")
    print()

    climate_svc = ClimateService()
    llm_svc = LLMService()

    print("Fetching Open-Meteo para Montería (8.7575, -75.8891)...")
    climate = await climate_svc.fetch_forecast(8.7575, -75.8891)
    print(f"  Temp: {climate.temp_min_7d}°–{climate.temp_max_7d}°C | Rain: {climate.rain_total_7d}mm | ET0: {climate.et0_total_7d:.1f}mm")
    print()

    print("Llamando a Claude Haiku...")
    result = await llm_svc.analyze_farm(
        climate_data=climate,
        crop_type="maiz",
        farm_name="Finca La Esperanza",
        sensor_data={
            "Humedad suelo": "38%",
            "Temperatura aire": "34°C",
            "Humedad aire": "72%",
        },
    )

    print(f"\nalert_level      : {result.alert_level}")
    print(f"main_alert       : {result.main_alert}")
    print(f"irrigation_needed: {result.irrigation_needed}")
    print(f"water_stress     : {result.water_stress_index}")
    print(f"model_used       : {result.model_used}")
    print(f"tokens in/out    : {result.input_tokens} / {result.output_tokens}")
    print(f"cost_usd         : ${result.cost_usd:.6f}")
    print(f"prompt_version   : {result.prompt_version}")

    print("\n--- Resumen para el agricultor ---")
    print(result.summary_for_farmer)

    print(f"\n--- Recomendaciones ({len(result.recommendations)}) ---")
    for rec in result.recommendations:
        print(f"  * {rec}")


if __name__ == "__main__":
    asyncio.run(main())
