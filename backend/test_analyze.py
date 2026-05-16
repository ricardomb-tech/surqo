"""Day 3 — test end-to-end del endpoint /analyze con Claude Haiku."""
import asyncio
import json
import sys
import urllib.request
import urllib.error


def call_analyze():
    body = json.dumps({
        "farm_name": "Finca La Esperanza",
        "lat": 8.7575,
        "lon": -75.8891,
        "crop_type": "maiz",
        "alert_email": None,
    }).encode()

    req = urllib.request.Request(
        "http://localhost:8000/api/v1/analysis/analyze",
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        print(f"HTTP {e.code}: {e.read(500).decode()}")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


def main():
    print("Llamando a /api/v1/analysis/analyze...")
    data = call_analyze()

    print(f"\nalert_level      : {data.get('alert_level')}")
    print(f"main_alert       : {data.get('main_alert')}")
    print(f"irrigation_needed: {data.get('irrigation_needed')}")
    print(f"water_stress     : {data.get('water_stress_index')}")
    print(f"avg_temp_c       : {data.get('avg_temperature_c')}")
    print(f"rain_7d_mm       : {data.get('total_rain_7d_mm')}")
    print(f"et0_7d_mm        : {data.get('et0_7d_mm')}")
    print(f"model_used       : {data.get('model_used')}")
    print(f"tokens in/out    : {data.get('input_tokens')} / {data.get('output_tokens')}")
    print(f"cost_usd         : {data.get('cost_usd')}")
    print(f"prompt_version   : {data.get('prompt_version')}")
    print(f"id (DB)          : {data.get('id')}")

    print("\n--- Resumen para el agricultor ---")
    print(data.get("summary_for_farmer", ""))

    recs = data.get("recommendations", [])
    print(f"\n--- Recomendaciones ({len(recs)}) ---")
    for rec in recs:
        print(f"  * {rec}")


if __name__ == "__main__":
    main()
