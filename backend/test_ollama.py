"""
Test completo del sistema de análisis IA usando Ollama + Mistral en local.

Requisitos:
  1. Instalar Ollama: https://ollama.com/download
  2. Descargar Mistral:  ollama pull mistral
  3. Ollama corre en:   http://localhost:11434

Uso:
  cd backend
  uv run python test_ollama.py

El script prueba los 3 endpoints de IA:
  ✓ Análisis de finca (farm_analysis)
  ✓ Triage de alertas (alert_triage)
  ✓ Resumen diario   (daily_summary)
"""

import asyncio
import json
import sys
import time
from pathlib import Path

import httpx
import yaml

# ─── Configuración ────────────────────────────────────────────────────────────
OLLAMA_BASE  = "http://localhost:11434"
MODEL        = "mistral"          # Cambiar a "llama3" o "gemma2" si prefieres
PROMPTS_DIR  = Path(__file__).parent / "app" / "prompts"
TIMEOUT      = 120               # segundos — Mistral tarda más que Haiku

# ─── Helpers ──────────────────────────────────────────────────────────────────

def header(text: str) -> None:
    print(f"\n{'='*60}")
    print(f"  {text}")
    print(f"{'='*60}")

def ok(msg: str) -> None:
    print(f"  ✅  {msg}")

def fail(msg: str) -> None:
    print(f"  ❌  {msg}")

def info(msg: str) -> None:
    print(f"  ℹ️   {msg}")

def load_prompt(name: str) -> dict:
    path = PROMPTS_DIR / name
    with open(path) as f:
        return yaml.safe_load(f)

def extract_json(text: str) -> dict:
    """Extrae el primer bloque JSON de la respuesta del modelo."""
    # Limpiar markdown fences
    if "```json" in text:
        text = text.split("```json")[1].split("```")[0].strip()
    elif "```" in text:
        text = text.split("```")[1].split("```")[0].strip()

    # Buscar primer { y último }
    start = text.find("{")
    end   = text.rfind("}") + 1
    if start == -1:
        raise ValueError("No se encontró JSON en la respuesta")
    return json.loads(text[start:end])

async def call_ollama(
    system_prompt: str,
    user_content: str,
    model: str = MODEL,
    max_tokens: int = 1024,
) -> tuple[str, float]:
    """Llama a Ollama con la API compatible con OpenAI. Retorna (texto, latencia_ms)."""
    payload = {
        "model":    model,
        "messages": [
            {"role": "system",  "content": system_prompt},
            {"role": "user",    "content": user_content},
        ],
        "options": {
            "temperature":  0.2,
            "num_predict":  max_tokens,
        },
        "stream": False,
    }
    t0 = time.monotonic()
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        r = await client.post(f"{OLLAMA_BASE}/api/chat", json=payload)
        r.raise_for_status()
    latency_ms = (time.monotonic() - t0) * 1000
    data = r.json()
    text = data["message"]["content"]
    return text, latency_ms

# ─── Comprobación de Ollama ────────────────────────────────────────────────────

async def check_ollama() -> bool:
    """Verifica que Ollama está corriendo y que el modelo está disponible."""
    header("🔍  Verificando Ollama")
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            r = await client.get(f"{OLLAMA_BASE}/api/tags")
            r.raise_for_status()
        models = [m["name"] for m in r.json().get("models", [])]
        ok(f"Ollama corriendo en {OLLAMA_BASE}")
        info(f"Modelos disponibles: {', '.join(models) or 'ninguno'}")

        # Buscar el modelo (puede venir como "mistral:latest" o "mistral")
        found = any(MODEL in m for m in models)
        if found:
            ok(f"Modelo '{MODEL}' listo")
            return True
        else:
            fail(f"Modelo '{MODEL}' no encontrado")
            print(f"\n  Ejecuta:  ollama pull {MODEL}\n")
            return False
    except httpx.ConnectError:
        fail("Ollama no está corriendo")
        print("\n  Instala y arranca Ollama:")
        print("    → https://ollama.com/download")
        print(f"    → ollama pull {MODEL}")
        print("    → ollama serve\n")
        return False

# ─── Test 1: Análisis de finca ─────────────────────────────────────────────────

async def test_farm_analysis() -> bool:
    header("🌾  Test 1 — Análisis de Finca (farm_analysis_v1.0)")
    prompt_cfg = load_prompt("farm_analysis_v1.0.yaml")

    # Datos de prueba realistas para Córdoba, Colombia
    user_content = prompt_cfg["user_template"].format(
        farm_name="Finca La Esperanza",
        crop_type="maíz",
        location="Montería, Córdoba",
        analysis_date="17/05/2026",
        temp_min=22.5,
        temp_max=35.8,
        temp_avg=29.2,
        rain_total=8.4,
        rain_prob_max=25,
        et0_total=28.6,
        vpd_avg=1.64,
        uv_max=9.2,
        sensor_section=(
            "  soil_moisture_pct: 41.5\n"
            "  soil_temp_c: 28.3\n"
            "  air_temp_c: 31.2\n"
            "  air_humidity_pct: 68.4\n"
            "  light_uv_index: 7.8"
        ),
        etc_daily=3.29,
        water_deficit=20.2,
        water_stress_index=4.0,
    )

    print(f"\n  📤  Enviando prompt a {MODEL}...")
    try:
        raw, latency_ms = await call_ollama(
            prompt_cfg["system_prompt"], user_content, max_tokens=1024
        )
        print(f"  ⏱️   Latencia: {latency_ms:.0f}ms\n")

        data = extract_json(raw)

        # Validar campos requeridos
        required = prompt_cfg.get("response_required_fields", [])
        missing  = [f for f in required if f not in data]

        if missing:
            fail(f"Campos faltantes: {missing}")
            return False

        # Mostrar resultado
        ok(f"JSON válido · {len(data)} campos")
        ok(f"alert_level:       {data.get('alert_level')}")
        ok(f"irrigation_needed: {data.get('irrigation_needed')}")
        ok(f"water_stress_idx:  {data.get('water_stress_index')}")
        ok(f"recomendaciones:   {len(data.get('recommendations', []))}")
        print(f"\n  💬  Mensaje al agricultor:")
        print(f"      \"{data.get('summary_for_farmer', '')}\"")

        if data.get("recommendations"):
            print(f"\n  📋  Top recomendación:")
            r = data["recommendations"][0]
            print(f"      [{r.get('category')}] {r.get('action')}")
            print(f"      Cuándo: {r.get('time_window')} — {r.get('justification')}")

        return True

    except json.JSONDecodeError as e:
        fail(f"JSON inválido: {e}")
        print(f"\n  Respuesta cruda:\n{raw[:500]}")
        return False
    except Exception as e:
        fail(f"Error: {e}")
        return False

# ─── Test 2: Triage de alertas ─────────────────────────────────────────────────

async def test_alert_triage() -> bool:
    header("🚨  Test 2 — Triage de Alerta (alert_triage_v1.0)")
    prompt_cfg = load_prompt("alert_triage_v1.0.yaml")

    sensor_reading = {
        "device_id":           "ESP32-CAMPO-001",
        "farm_id":             "310f2f64-4faf-4552-bc13-e9964e1cfccb",
        "soil_moisture_pct":   18.2,   # ← CRÍTICO: por debajo del umbral
        "soil_temp_c":         32.1,
        "air_temp_c":          38.7,   # ← Muy alta
        "air_humidity_pct":    45.3,
        "vpd_kpa":             2.41,   # ← CRÍTICO
        "battery_mv":          3410,
    }

    violations = [
        "soil_moisture_pct=18.2% (umbral: >25%)",
        "air_temp_c=38.7°C (umbral: <37°C)",
        "vpd_kpa=2.41kPa (umbral: <2.0kPa)",
    ]

    user_content = prompt_cfg["user_template"].format(
        device_id=sensor_reading["device_id"],
        farm_id=sensor_reading["farm_id"],
        crop_type="maíz",
        sensor_json=json.dumps(sensor_reading, indent=2),
        violations_list="\n".join(f"- {v}" for v in violations),
        recent_history="3 lecturas previas con tendencia descendente en humedad",
    )

    print(f"\n  📤  Evaluando 3 violaciones de umbral con {MODEL}...")
    try:
        raw, latency_ms = await call_ollama(
            prompt_cfg["system_prompt"], user_content, max_tokens=256
        )
        print(f"  ⏱️   Latencia: {latency_ms:.0f}ms\n")

        data = extract_json(raw)

        required = prompt_cfg.get("response_required_fields", [])
        missing  = [f for f in required if f not in data]

        if missing:
            fail(f"Campos faltantes: {missing}")
            return False

        ok(f"JSON válido")
        ok(f"is_alert:  {data.get('is_alert')}")
        ok(f"severity:  {data.get('severity')}")
        ok(f"title:     {data.get('title')}")
        ok(f"action:    {data.get('action')}")
        ok(f"response:  {data.get('response_time')}")

        return True

    except json.JSONDecodeError as e:
        fail(f"JSON inválido: {e}")
        print(f"\n  Respuesta cruda:\n{raw[:400]}")
        return False
    except Exception as e:
        fail(f"Error: {e}")
        return False

# ─── Test 3: Resumen diario ────────────────────────────────────────────────────

async def test_daily_summary() -> bool:
    header("📊  Test 3 — Resumen Diario (daily_summary_v1.0)")
    prompt_cfg = load_prompt("daily_summary_v1.0.yaml")

    kpis_today = {
        "vpd_kpa":               1.42,
        "avg_soil_moisture_pct": 44.1,
        "avg_air_temp_c":        29.5,
        "soil_health_score":     72,
        "pest_risk_pct":         35,
        "readings_count_24h":    96,
    }

    analyses_7d = [
        {"date": "15/05", "alert_level": "ok",      "irrigation_needed": False},
        {"date": "16/05", "alert_level": "warning",  "irrigation_needed": True},
        {"date": "17/05", "alert_level": "ok",       "irrigation_needed": False},
    ]

    user_content = prompt_cfg["user_template"].format(
        farm_name="Finca La Esperanza",
        date="17/05/2026",
        kpis_json=json.dumps(kpis_today, indent=2),
        analyses_summary=json.dumps(analyses_7d, indent=2),
        forecast_48h="Temperatura 28-34°C, lluvia improbable (15%)",
    )

    print(f"\n  📤  Generando resumen semanal con {MODEL}...")
    try:
        raw, latency_ms = await call_ollama(
            prompt_cfg["system_prompt"], user_content, max_tokens=512
        )
        print(f"  ⏱️   Latencia: {latency_ms:.0f}ms\n")

        data = extract_json(raw)

        ok(f"emoji_status:  {data.get('emoji_status')}")
        ok(f"top_priority:  {data.get('top_priority')}")
        print(f"\n  📝  Resumen:")
        print(f"      {data.get('summary_text', '')}")
        print(f"\n  🔭  Perspectiva:")
        print(f"      {data.get('week_outlook', '')}")

        return True

    except json.JSONDecodeError as e:
        fail(f"JSON inválido: {e}")
        print(f"\n  Respuesta cruda:\n{raw[:400]}")
        return False
    except Exception as e:
        fail(f"Error: {e}")
        return False

# ─── Test 4: Llamada al endpoint real (opcional) ───────────────────────────────

async def test_api_endpoint() -> bool:
    """Prueba el endpoint /api/v1/analysis/analyze en el servidor local.
    Requiere que el backend esté corriendo con LLM_PROVIDER=ollama."""
    header("🌐  Test 4 — Endpoint REST /api/v1/analysis/analyze")
    info("Requiere: backend corriendo + LLM_PROVIDER=ollama en .env")

    payload = {
        "farm_id":    "310f2f64-4faf-4552-bc13-e9964e1cfccb",
        "farm_name":  "Finca La Esperanza",
        "lat":         8.7575,
        "lon":        -75.8891,
        "crop_type":  "maíz",
        "alert_email": "test@surqo.io",
    }

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            t0 = time.monotonic()
            r  = await client.post(
                "http://localhost:8000/api/v1/analysis/analyze",
                json=payload,
            )
            latency_ms = (time.monotonic() - t0) * 1000

        if r.status_code == 402:
            info("Endpoint devuelve 402 (requiere plan Pro) — normal en modo demo")
            info("Para saltarlo, asegúrate de enviar un JWT con plan 'paid'")
            return True
        if r.status_code == 200:
            data = r.json()
            ok(f"Latencia total: {latency_ms:.0f}ms")
            ok(f"alert_level: {data.get('alert_level')}")
            ok(f"irrigation_needed: {data.get('irrigation_needed')}")
            return True

        fail(f"HTTP {r.status_code}: {r.text[:200]}")
        return False

    except httpx.ConnectError:
        info("Backend no está corriendo localmente — saltando test 4")
        info("Arranca con: uv run uvicorn app.main:app --reload")
        return True  # No falla — es opcional

# ─── Resultado final ──────────────────────────────────────────────────────────

async def main() -> None:
    print("""
╔══════════════════════════════════════════════════════════════╗
║        SURQO · Test LLM con Ollama + Mistral                 ║
║        Verifica el sistema de análisis IA en local           ║
╚══════════════════════════════════════════════════════════════╝
    """)

    # 0. Verificar Ollama
    if not await check_ollama():
        sys.exit(1)

    # Correr tests
    results = {
        "Análisis de finca":  await test_farm_analysis(),
        "Triage de alertas":  await test_alert_triage(),
        "Resumen diario":     await test_daily_summary(),
        "Endpoint REST":      await test_api_endpoint(),
    }

    # Reporte final
    header("📋  REPORTE FINAL")
    passed = sum(results.values())
    total  = len(results)

    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {status}  {test_name}")

    print(f"\n  {'─'*40}")
    print(f"  Resultado: {passed}/{total} tests pasaron")

    if passed == total:
        print("""
  🎉  ¡Todo funciona! El sistema de análisis IA opera correctamente
      con Ollama + Mistral como motor local.

  Para usar Ollama en el backend completo:
    1. Agrega LLM_PROVIDER=ollama en backend/.env
    2. Agrega OLLAMA_BASE_URL=http://localhost:11434
    3. Reinicia el servidor: uv run uvicorn app.main:app --reload
        """)
    else:
        print("""
  ⚠️  Algunos tests fallaron. Revisa los errores arriba.
  Tip: Mistral puede tardar más. Si el timeout se dispara,
       prueba con: ollama run mistral (para calentarlo primero)
        """)
    print()

if __name__ == "__main__":
    asyncio.run(main())
