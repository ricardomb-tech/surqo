# SURQO — Inteligencia Agroclimática

> Plataforma IoT + IA para el campo colombiano. Del sensor al insight en segundos.

[![CI/CD](https://github.com/ricardomb-tech/surqo/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/ricardomb-tech/surqo/actions)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python)](https://python.org)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=nextdotjs)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![Fly.io](https://img.shields.io/badge/Backend-Fly.io-8B5CF6)](https://fly.io)
[![Vercel](https://img.shields.io/badge/Frontend-Vercel-000000?logo=vercel)](https://vercel.com)

---

## ¿Qué es Surqo?

Surqo es una plataforma agroclimática de precisión que conecta sensores físicos instalados en fincas con modelos de inteligencia artificial para generar recomendaciones agronómicas en tiempo real. El nombre viene de *surco* — la línea que traza el arado en la tierra — representando la fusión entre la agricultura tradicional colombiana y la tecnología de vanguardia.

**Problema que resuelve:** El 85% de los agricultores en Colombia toman decisiones de riego, fertilización y cosecha basadas en experiencia visual, sin datos objetivos. Las pérdidas por estrés hídrico, plagas y heladas ascienden a millones de pesos por cosecha que podrían evitarse con monitoreo continuo.

**Solución:** Nodos IoT de bajo costo (ESP32, ~$15 USD) conectados a una nube inteligente que analiza microclima, calcula índices agronómicos y usa IA (Groq / Llama 3.3 70B) para generar planes de acción específicos para cada cultivo en el trópico colombiano.

---

## URLs de Producción

| Recurso | URL |
|---------|-----|
| **Sitio web** | [https://surqo.online](https://surqo.online) |
| **API Backend** | [https://surqo-api.fly.dev](https://surqo-api.fly.dev) |
| **Health check** | [https://surqo-api.fly.dev/health](https://surqo-api.fly.dev/health) |

> El backend corre en **Fly.io** (Dallas — `dfw`) con `auto_stop_machines = false` y `min_machines_running = 1`. Siempre hay al menos una máquina activa — **no hay cold starts**.

> En producción el Swagger/ReDoc está deshabilitado por seguridad. Para desarrollo local: `http://localhost:8000/docs`

---

## Índice

1. [Arquitectura del Sistema](#arquitectura)
2. [Stack Tecnológico](#stack)
3. [Backend — FastAPI](#backend)
4. [Frontend — Next.js](#frontend)
5. [Firmware — ESP32](#firmware)
6. [Simulador IoT](#simulador-iot)
7. [Instalación Local](#instalación-local)
8. [API Reference](#api-reference)
9. [Autenticación y Planes](#autenticación-y-planes)
10. [CI/CD Pipeline](#cicd)
11. [Despliegue en Producción](#despliegue-en-producción)
12. [Lo que se logró construir](#lo-que-se-logró-construir)
13. [Optimizaciones y Valor de la Plataforma](#optimizaciones-y-valor-de-la-plataforma)

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                        CAMPO / FINCA                            │
│                                                                 │
│  ┌──────────────┐    TLS/MQTT (8883)    ┌──────────────────┐   │
│  │  ESP32 Node  │ ──────────────────►  │  HiveMQ Cloud    │   │
│  │  DHT22       │                       │  (Broker MQTT)   │   │
│  │  DS18B20     │                       └────────┬─────────┘   │
│  │  Capacitivo  │                                │             │
│  │  ML8511 UV   │                      subscribe │             │
│  └──────────────┘                                ▼             │
│                                        ┌──────────────────┐    │
│  ┌──────────────────┐                  │  FastAPI Backend │    │
│  │  IoT Simulator   │ ── MQTT ──────►  │  (Fly.io — dfw)  │    │
│  │  (Python)        │                  │                  │    │
│  └──────────────────┘                  │  MQTT Consumer   │    │
│                                        │  LLM Service     │    │
│                                        │  Alert Service   │    │
│                                        │  KPI Engine      │    │
│                                        │  WebSocket Mgr   │    │
│                                        └────────┬─────────┘    │
└────────────────────────────────────────────────┼──────────────┘
                                                  │
                              ┌───────────────────┼───────────────────┐
                              │                   │                   │
                     Supabase PostgreSQL    Upstash Redis      Open-Meteo API
                     (DB + Auth)            (Cache TTL)        (Clima 7 días)
                              │
                    ┌─────────┴──────────────────────┐
                    │  WebSocket (wss://)             │
                    │  REST API (/api/v1/*)           │
                    ▼                                 ▼
          ┌─────────────────────────────────────────────────┐
          │              Next.js 15 Frontend                │
          │         (Vercel — surqo.online)                 │
          │                                                 │
          │  Dashboard · Sensores · Análisis IA             │
          │  Alertas · Fincas · Upgrade                     │
          └─────────────────────────────────────────────────┘
```

### Flujo de datos completo

1. **Sensor → Nube:** El ESP32 despierta cada 15 min, lee sensores, conecta a WiFi, publica vía MQTT TLS a HiveMQ Cloud y vuelve a deep sleep (~10µA en reposo)
2. **MQTT → Backend:** El consumer en FastAPI recibe el mensaje, calcula VPD en tiempo real, persiste en PostgreSQL y evalúa umbrales de alerta
3. **Alerta → Email:** Si hay violación de umbral, verifica cooldown en Redis (30 min) y envía email HTML vía Resend
4. **Backend → Frontend:** WebSocket broadcast a todos los clientes conectados para actualización en tiempo real sin polling
5. **Análisis IA:** Fusiona datos de Open-Meteo (pronóstico 7 días), lecturas del sensor y KPIs → prompt YAML → Groq Llama 3.3 70B → JSON con recomendaciones

---

## Stack

| Capa | Tecnología | Versión | Por qué |
|------|-----------|---------|---------|
| **Hardware** | ESP32 + DHT22 + DS18B20 + ML8511 | — | Low-cost, bajo consumo, WiFi nativo |
| **Transporte IoT** | MQTT TLS (HiveMQ Cloud) | QoS 1 | Protocolo estándar IoT, bajo ancho de banda |
| **Backend** | FastAPI + Uvicorn | 0.115 | Async nativo, tipado estricto, Swagger automático |
| **ORM** | SQLAlchemy 2.0 (async) | 2.0 | Async sessions, typed queries |
| **Base de datos** | Supabase PostgreSQL | — | Managed, RLS, Auth integrado |
| **Cache** | Upstash Redis | — | Serverless, TTL para clima/análisis, cooldown alertas |
| **IA (primario)** | Groq — Llama 3.3 70B | — | 14.4K req/día gratis, latencia < 1s |
| **IA (fallback)** | Anthropic Claude Haiku | 4.x | Calidad de respuesta premium |
| **IA (dev local)** | Ollama | — | Sin costo, sin red |
| **Email** | Resend API | — | Alta deliverability, API simple |
| **Clima** | Open-Meteo | — | Pronóstico 7 días gratuito, cacheado |
| **Frontend** | Next.js 15 + React 19 | 15.0 | App Router, RSC, SSR, Middleware |
| **Auth** | Supabase Auth + SSR | — | JWT ES256, cookies HTTP-only SSR |
| **Estilos** | Tailwind CSS + dark mode | 3.4 | Utility-first, consistencia de diseño |
| **Animaciones** | Framer Motion | 11 | Transiciones fluidas, glass morphism |
| **Gráficas** | Recharts | 2.x | Declarativo, SVG, responsive |
| **Deploy Backend** | Fly.io (Dallas `dfw`) | — | Always-on, sin cold starts, flyctl |
| **Deploy Frontend** | Vercel + dominio `surqo.online` | — | Edge network, preview deployments |
| **CI/CD** | GitHub Actions | — | Lint → Test → Deploy automático |
| **Observabilidad** | Logfire (Pydantic) | — | Structured logging, tracing |
| **Rate limiting** | slowapi | — | Por IP en endpoints críticos |
| **Package manager** | uv (Astral) | — | Instalación 10-100× más rápida que pip |

---

## Backend

### Estructura

```
backend/
├── app/
│   ├── main.py              # App FastAPI, lifespan, CORS, seguridad, routers
│   ├── config.py            # Settings via pydantic-settings (.env)
│   ├── database.py          # SQLAlchemy async engine + session factory
│   ├── dependencies.py      # CurrentUser, DBSession (Depends)
│   │
│   ├── models/
│   │   ├── user.py          # UserProfile (plan, cuota análisis, tokens, supabase_id)
│   │   ├── farm.py          # Farm (nombre, cultivo, lat/lon, área, alert_email)
│   │   ├── sensor_reading.py # SensorReading (temp, humedad, suelo, UV, VPD)
│   │   ├── analysis.py      # Analysis (recomendaciones, KPIs, tokens, costo)
│   │   └── alert.py         # Alert (severidad, acción, resuelto, email_sent)
│   │
│   ├── routers/
│   │   ├── users.py         # /api/v1/users — perfil, plan, límites de cuota
│   │   ├── farms.py         # /api/v1/farms — CRUD + KPIs
│   │   ├── sensors.py       # /api/v1/sensors — lecturas + WebSocket
│   │   ├── analysis.py      # /api/v1/analysis — análisis IA + chat + historial
│   │   ├── alerts.py        # /api/v1/alerts — activas, historial, resolve, notify
│   │   └── kpis.py          # /api/v1/kpis — VPD, ETc, riesgo plagas
│   │
│   ├── services/
│   │   ├── llm_service.py   # Multi-provider LLM (Groq/Anthropic/Ollama)
│   │   ├── kpi_service.py   # VPD Magnus, ETc Penman-Monteith, GDD, déficit
│   │   ├── climate_service.py # Open-Meteo API + ET₀ + caché Redis
│   │   ├── alert_service.py # Umbrales → alertas → email con cooldown Redis
│   │   ├── mqtt_service.py  # Consumer HiveMQ (paho-mqtt async bridge)
│   │   └── cache_service.py # Redis wrapper (get/set + graceful fallback)
│   │
│   ├── schemas/             # Pydantic v2 (request/response validation)
│   ├── websocket/           # Manager broadcast en tiempo real por farm_id
│   └── prompts/             # YAML versionados: análisis, triage, resumen diario
│       ├── farm_analysis_v1.0.yaml
│       ├── alert_triage_v1.0.yaml
│       └── daily_summary_v1.0.yaml
│
├── tests/
│   ├── conftest.py          # Fixtures: SQLite in-memory + async session + mock auth
│   ├── test_api_farms.py
│   ├── test_api_sensors.py
│   ├── test_api_alerts.py
│   ├── test_api_users.py
│   ├── test_climate_service.py
│   ├── test_kpi_service.py
│   ├── test_llm_service.py
│   └── test_alert_service.py
│
├── migrations/
│   ├── 001_initial_schema.sql    # Tablas, índices, triggers
│   ├── 002_analysis_quota.sql    # analyses_used, tokens_used en user_profiles
│   ├── enable_rls.sql            # Row Level Security policies
│   └── data_retention.sql        # Auto-delete lecturas > 90 días
│
├── Dockerfile               # Python 3.11-slim + uv + Uvicorn port 8080
├── fly.toml                 # Fly.io: Dallas (dfw), 512MB, always-on
└── pyproject.toml           # uv — dependencias + ruff config
```

### Modelos de dominio

| Modelo | Tabla | Campos clave |
|--------|-------|-------------|
| `UserProfile` | `user_profiles` | `plan` (free/paid), `analyses_used`, `tokens_used`, `email_alerts_this_month` |
| `Farm` | `farms` | `name`, `crop_type`, `lat/lon`, `area_hectares`, `alert_email`, `user_id` |
| `SensorReading` | `sensor_readings` | `air_temp_c`, `air_humidity_pct`, `soil_moisture_pct`, `soil_temp_c`, `uv_index`, `vpd_kpa`, `battery_mv`, `rssi_dbm` |
| `Analysis` | `analyses` | `alert_level`, `water_stress_index`, `irrigation_needed`, `recommendations` (JSON), `input_tokens`, `output_tokens`, `cost_usd` |
| `Alert` | `alerts` | `severity`, `title`, `recommended_action`, `is_resolved`, `email_sent` |

### Cuotas del plan Free (en `UserProfile`)

```python
FREE_ANALYSES_LIMIT           = 4      # análisis IA lifetime
FREE_TOKENS_LIMIT             = 3_200  # tokens output acumulados lifetime
FREE_OUTPUT_TOKENS_PER_ANALYSIS = 800  # tokens máximos por análisis
PAID_OUTPUT_TOKENS_PER_ANALYSIS = 2_048
MAX_FARMS                     = 1      # finca por usuario free
```

### Servicio LLM — Arquitectura multi-proveedor

El `llm_service.py` soporta tres proveedores via `LLM_PROVIDER`:

```
groq      → Groq API (Llama 3.3 70B) — primario, gratis hasta 14.4K req/día
anthropic → Anthropic Claude Haiku 4.x — fallback, alta calidad
ollama    → Ollama local — desarrollo sin costo ni red
```

Los prompts están en archivos YAML versionados (`prompts/`), actualizables sin tocar código Python.

### Umbrales de alerta automática

| Condición | Umbral | Severidad |
|-----------|--------|-----------|
| Humedad suelo baja | < 25% | warning |
| Temperatura suelo alta | > 38°C | warning |
| VPD alto | > 1.6 kPa | warning |
| Batería baja | < 3400 mV | info |
| Cooldown entre alertas | 30 min (Redis) | — |

---

## Frontend

### Estructura

```
frontend/src/
├── app/
│   ├── page.tsx                # Landing page (hero, features, glass morphism)
│   ├── layout.tsx              # Root layout: AuthProvider + NavBar
│   ├── (app)/                  # Rutas protegidas por SSR middleware
│   │   ├── dashboard/page.tsx  # KPIs + gráficas + feed live
│   │   ├── farms/page.tsx      # CRUD fincas
│   │   ├── sensors/page.tsx    # Lecturas tiempo real (WebSocket)
│   │   ├── analyze/page.tsx    # Análisis IA + chat con la finca
│   │   └── alerts/page.tsx     # Centro de alertas
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── upgrade/page.tsx        # Free vs Pro con CTA de contacto
│   ├── como-funciona/
│   ├── soluciones/
│   ├── preguntas/
│   ├── privacidad/
│   └── terminos/
│
├── components/
│   ├── NavBar.tsx              # Barra fija: nav + badge plan + cuota análisis
│   ├── AuthProvider.tsx        # Contexto React: session, isPaid, planLimits
│   ├── KPICard.tsx             # Tarjeta de métrica
│   ├── SensorChart.tsx         # Gráfica temporal (Recharts)
│   ├── LiveFeed.tsx            # Feed WebSocket tiempo real
│   ├── AnalysisResult.tsx      # Resultado IA con recomendaciones
│   └── AlertBadge.tsx          # Badge severidad
│
├── lib/
│   ├── api.ts                  # Cliente HTTP con JWT injection
│   ├── auth.ts                 # getSession, getAccessToken, signOut
│   ├── supabase.ts             # createBrowserClient SSR-compatible
│   └── websocket.ts            # WebSocket manager live feed
│
├── types/index.ts              # Farm, SensorReading, Alert, Analysis, KPIs
└── middleware.ts               # Protección SSR de rutas (cookies Supabase)
```

### Páginas

| Ruta | Acceso | Descripción |
|------|--------|-------------|
| `/` | Público | Landing page con propuesta de valor |
| `/login` | Público | Inicio de sesión |
| `/register` | Público | Registro — plan Free automático |
| `/(app)/dashboard` | Autenticado | KPIs + gráficas + feed live |
| `/(app)/farms` | Autenticado | CRUD fincas (límite **1** en Free) |
| `/(app)/sensors` | Autenticado | Lecturas tiempo real, WebSocket |
| `/(app)/alerts` | Autenticado | Alertas activas e historial |
| `/(app)/analyze` | Autenticado | Análisis IA (**4 gratis**, ilimitados en Pro) |
| `/upgrade` | Autenticado | Comparativa planes, CTA contacto |

---

## Firmware

### Hardware por nodo (~$15 USD)

| Componente | Función | Precio aprox. |
|-----------|---------|--------------|
| ESP32 WROOM-32 DevKit | Microcontrolador + WiFi | $4 USD |
| **DHT22** (AM2302) | Temperatura y humedad del aire (±0.5°C) | $2 USD |
| DS18B20 waterproof | Temperatura del suelo (sonda metálica) | $2 USD |
| Sensor capacitivo suelo v2.0 | Humedad volumétrica (sin corrosión) | $1.5 USD |
| ML8511 | Índice UV solar | $2 USD |
| 2× batería 18650 Li-Ion | Autonomía ~2 semanas en deep sleep | $4 USD |
| TP4056 con protección | Cargador baterías | $1 USD |
| Caja IP65 | Protección lluvia y polvo | $2 USD |

> ⚠️ Usar **DHT22**, no DHT11. El DHT11 tiene precisión ±2°C — insuficiente para cálculo de VPD.

### Conexiones GPIO

```
ESP32 GPIO4  → DHT22 DATA
ESP32 GPIO5  → DS18B20 DATA (OneWire + resistencia 10kΩ a 3.3V)
ESP32 GPIO25 → VCC de todos los sensores (se corta en deep sleep)
ESP32 GPIO32 → Sensor suelo capacitivo AOUT (ADC1_CH4)
ESP32 GPIO34 → ML8511 UV OUT (ADC1_CH6 — solo entrada)
ESP32 GPIO35 → Divisor de voltaje batería (ADC1_CH7 — solo entrada)
```

> Los pines GPIO 34, 35, 36, 39 del ESP32 son **solo entrada** (input-only). No usar para salidas.

### Configuración `firmware/surqo_node/config.h`

```cpp
#define WIFI_SSID         "tu-red"
#define WIFI_PASSWORD     "tu-password"
#define MQTT_HOST         "cluster.s1.eu.hivemq.cloud"
#define MQTT_PORT         8883        // TLS
#define MQTT_USERNAME     "usuario"
#define MQTT_PASSWORD     "password"
#define DEVICE_ID         "surqo-esp32-001"
#define FARM_ID           "uuid-de-la-finca"
#define SLEEP_MINUTES     15
#define SOIL_DRY_ADC      3200   // Calibrar en tu suelo seco
#define SOIL_WET_ADC      1200   // Calibrar en tu suelo saturado
```

### Ciclo de operación

```
Despertar (timer RTC cada 15 min)
  → GPIO25 HIGH (enciende sensores)
  → Leer DHT22, DS18B20, capacitivo, ML8511, batería ADC
  → Conectar WiFi → Sincronizar NTP
  → Publicar JSON vía MQTT TLS a HiveMQ Cloud
      topic: surqo/farms/{FARM_ID}/sensors
  → Fallback si MQTT falla: HTTP POST a surqo-api.fly.dev
  → GPIO25 LOW (apaga sensores)
  → Deep sleep 15 min (~10µA consumo)
```

### Compilar y subir

```bash
cd firmware
pio run -t upload        # Compilar + subir al ESP32
pio device monitor       # Ver logs por serial (115200 baud)
```

---

## Simulador IoT

Para desarrollo sin hardware físico:

```bash
cd iot-simulator
pip install httpx paho-mqtt

# Por HTTP al API local
python simulator.py --mode http \
  --interval 10 \
  --api-url http://localhost:8000/api/v1/sensors/readings \
  --farm-id tu-farm-uuid

# Por MQTT a HiveMQ Cloud
python simulator.py --mode mqtt \
  --mqtt-host tu-cluster.hivemq.cloud \
  --mqtt-user surqo-user \
  --mqtt-pass tu_password \
  --farm-id tu-farm-uuid \
  --device-id ESP32-DEMO-001
```

Simula el modelo climático de Córdoba, Colombia: temperatura senoidal 22°C→34°C, humedad inversa, lluvia probabilística, UV solar.

---

## Instalación Local

### Prerrequisitos

- Python 3.11+
- [uv](https://docs.astral.sh/uv/getting-started/installation/)
- Node.js 20+
- Cuentas (tier gratuito): Supabase, Upstash Redis, HiveMQ Cloud, Resend, Groq

### Backend

```bash
git clone https://github.com/ricardomb-tech/surqo.git
cd surqo/backend

uv sync

cp .env.example .env
# Editar .env con tus credenciales

uv run fastapi dev app/main.py
# → http://localhost:8000/docs

uv run pytest tests/ -v --cov=app
uv run ruff check app/
```

### Frontend

```bash
cd surqo/frontend

npm install

# Crear .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...

npm run dev
# → http://localhost:3000
```

### Variables de Entorno — Backend completo

```env
# LLM Provider (groq | anthropic | ollama)
LLM_PROVIDER=groq
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.3-70b-versatile
LLM_MAX_TOKENS=800

# Anthropic (fallback opcional)
ANTHROPIC_API_KEY=sk-ant-...
LLM_MODEL=claude-haiku-4-5-20251001

# Ollama (solo desarrollo local)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3

# Supabase
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=sb_secret_...
SUPABASE_JWK_X=pDWflX5Eq...
SUPABASE_JWK_Y=kaePA94RA...
SUPABASE_JWK_KID=f30d561e-...
DATABASE_URL=postgresql+asyncpg://usuario:password@host:5432/postgres

# Redis (Upstash)
REDIS_URL=rediss://default:password@host.upstash.io:6379
CACHE_TTL_CLIMATE=3600
CACHE_TTL_ANALYSIS=3600

# MQTT (HiveMQ Cloud)
HIVEMQ_HOST=cluster.s1.eu.hivemq.cloud
HIVEMQ_PORT=8883
HIVEMQ_USERNAME=usuario
HIVEMQ_PASSWORD=password
MQTT_TOPIC_PREFIX=surqo

# Email (Resend)
RESEND_API_KEY=re_...
FROM_EMAIL=alertas@surqo.online

# App
APP_ENV=development
CORS_ORIGINS=["http://localhost:3000","https://surqo.online"]
LOGFIRE_TOKEN=   # Opcional
```

### Dónde obtener cada credencial

| Variable | Fuente |
|----------|--------|
| `GROQ_API_KEY` | [console.groq.com](https://console.groq.com) → API Keys |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) → API Keys |
| `SUPABASE_URL` + `SUPABASE_KEY` | Supabase Dashboard → Settings → API |
| `SUPABASE_JWK_X/Y/KID` | Supabase → Settings → API → JWT Settings → JWKS |
| `DATABASE_URL` | Supabase → Settings → Database → Session Pooler (IPv4) |
| `REDIS_URL` | [console.upstash.com](https://console.upstash.com) → Redis → Connect |
| `HIVEMQ_HOST/USER/PASS` | [console.hivemq.cloud](https://console.hivemq.cloud) → Cluster Settings |
| `RESEND_API_KEY` | [resend.com](https://resend.com) → API Keys |

---

## API Reference

> Documentación interactiva en desarrollo local: `http://localhost:8000/docs`

### Autenticación

Todos los endpoints protegidos requieren:

```http
Authorization: Bearer <jwt-token-de-supabase>
```

JWT emitido por **Supabase Auth** con algoritmo **ES256** (curva P-256). El backend valida contra JWKS. En el frontend se obtiene con `supabase.auth.getSession()`.

---

### `GET /health`

**Acceso:** Público

```json
{ "status": "ok", "db": "ok", "env": "production" }
```

---

### Fincas — `/api/v1/farms`

#### `POST /api/v1/farms/`

**Acceso:** Autenticado · Plan Free: **máximo 1 finca** (`402` al exceder)

```json
{
  "name": "Finca La Esperanza",
  "crop_type": "maíz",
  "latitude": 8.7575,
  "longitude": -75.8891,
  "area_hectares": 12.5,
  "alert_email": "agricultor@ejemplo.com"
}
```

#### `GET /api/v1/farms/`
Lista las fincas del usuario autenticado.

#### `GET /api/v1/farms/{farm_id}`
Detalle. Solo propietario (`403` si otro usuario).

#### `PATCH /api/v1/farms/{farm_id}`
Actualiza campos (todos opcionales).

#### `DELETE /api/v1/farms/{farm_id}`
Elimina finca y datos asociados. `204`.

#### `GET /api/v1/farms/{farm_id}/kpis`

KPIs agronómicos de las últimas 24h:

```json
{
  "vpd_kpa": 1.42,
  "avg_air_temp_c": 29.5,
  "avg_humidity_pct": 68.3,
  "avg_soil_moisture_pct": 44.1,
  "soil_health_score": 75,
  "pest_risk": { "risk_pct": 35, "pathogens": ["roya"] },
  "readings_count_24h": 96
}
```

---

### Sensores — `/api/v1/sensors`

#### `POST /api/v1/sensors/readings`

**Acceso:** Público (usado por ESP32 y simulador)

```json
{
  "device_id": "ESP32-CAMPO-001",
  "farm_id": "uuid-finca",
  "sensors": {
    "soil_moisture_pct": 44.5,
    "soil_temp_c": 27.8,
    "air_temp_c": 31.2,
    "air_humidity_pct": 70.1,
    "light_uv_index": 7.4
  },
  "battery_mv": 3820,
  "rssi_dbm": -62,
  "firmware_version": "1.0.0"
}
```

El `vpd_kpa` se calcula automáticamente en el backend (ecuación de Magnus).

#### `GET /api/v1/sensors/timeseries/{farm_id}`

Query params: `hours` (default 24, máx 168), `metric` (default `soil_moisture_pct`)

Métricas: `soil_moisture_pct`, `soil_temp_c`, `air_temp_c`, `air_humidity_pct`, `vpd_kpa`, `uv_index`

#### `GET /api/v1/sensors/latest/{device_id}`
Última lectura del dispositivo.

#### `GET /api/v1/sensors/stats/{farm_id}`
Estadísticas agregadas 24h.

#### `WebSocket /api/v1/sensors/ws/live/{farm_id}`

Stream tiempo real. Broadcast a todos los clientes conectados al recibir lectura MQTT.

```javascript
const ws = new WebSocket('wss://surqo-api.fly.dev/api/v1/sensors/ws/live/FARM_ID')
ws.onmessage = (e) => console.log(JSON.parse(e.data))
```

---

### Análisis IA — `/api/v1/analysis`

#### `POST /api/v1/analysis/analyze`

**Acceso:** Autenticado · Free: **4 análisis lifetime** (`402` al agotar) · Pro: ilimitado

```json
{
  "farm_id": "uuid-finca",
  "farm_name": "Finca La Esperanza",
  "lat": 8.7575,
  "lon": -75.8891,
  "crop_type": "maíz",
  "alert_email": "agricultor@ejemplo.com"
}
```

**Respuesta `201`:**
```json
{
  "id": "uuid-analisis",
  "alert_level": "warning",
  "summary_for_farmer": "Tu cultivo de maíz muestra estrés hídrico moderado...",
  "irrigation_needed": true,
  "water_stress_index": 0.67,
  "recommendations": [
    {
      "action": "Aplicar riego por goteo — 25mm en las próximas 6 horas",
      "time_window": "0-6h",
      "priority": 1,
      "category": "irrigation"
    }
  ],
  "model_used": "groq/llama-3.3-70b-versatile",
  "input_tokens": 624,
  "output_tokens": 318,
  "cost_usd": 0.0,
  "created_at": "2026-06-28T14:35:00Z"
}
```

**Niveles de alerta:** `ok` · `warning` · `critical`

**Error por cuota agotada (`402`):**
```json
{
  "code": "analysis_quota_exceeded",
  "message": "Usaste tus 4 análisis IA gratuitos. Contacta a nuestro equipo para activar el plan premium.",
  "analyses_used": 4,
  "analyses_limit": 4,
  "contact_url": "https://surqo.online/upgrade"
}
```

#### `GET /api/v1/analysis/history/{farm_id}`
Historial de análisis (más reciente primero, últimos 10).

#### `GET /api/v1/analysis/{analysis_id}`
Detalle de un análisis.

---

### Alertas — `/api/v1/alerts`

Generadas automáticamente cuando lecturas superan umbrales. Cooldown Redis 30 min.

#### `GET /api/v1/alerts/active`
Alertas activas. Query param `farm_id` opcional.

#### `GET /api/v1/alerts/history`
Todas (activas + resueltas).

#### `GET /api/v1/alerts/{alert_id}`
Detalle de una alerta.

#### `PATCH /api/v1/alerts/{alert_id}/resolve`
Marcar como resuelta.

#### `POST /api/v1/alerts/{alert_id}/notify`
Reenviar email de la alerta manualmente.

---

### Usuarios — `/api/v1/users`

#### `GET /api/v1/users/me`

```json
{
  "user_id": "uuid",
  "email": "agricultor@ejemplo.com",
  "plan": "free",
  "is_paid": false,
  "can_use_ai_analysis": true,
  "analyses_used": 2,
  "farms_count": 1,
  "created_at": "2026-06-01T00:00:00Z"
}
```

#### `PATCH /api/v1/users/me`
Actualizar perfil (nombre).

#### `GET /api/v1/users/me/plan-limits`

```json
{
  "plan": "free",
  "farms": { "used": 1, "limit": 1, "remaining": 0, "unlimited": false },
  "ai_analysis": {
    "allowed": true,
    "used": 2,
    "limit": 4,
    "remaining": 2,
    "tokens_used": 1600,
    "tokens_limit": 3200,
    "max_tokens_per_analysis": 800
  },
  "email_alerts": { "unlimited": true, "used_this_month": 3 }
}
```

#### `PATCH /api/v1/users/{user_id}/plan` *(Solo admin)*

```json
{ "plan": "paid" }
```

---

### KPIs — `/api/v1/kpis`

#### `GET /api/v1/kpis/farm/{farm_id}`

| KPI | Fórmula | Interpretación |
|-----|---------|----------------|
| **VPD** (kPa) | `es − ea` (Magnus) | < 0.8 óptimo · 0.8–1.6 aceptable · > 1.6 estrés |
| **ETc** (mm/día) | `ET₀ × Kc` | Agua consumida diaria por el cultivo |
| **GDD** (°días) | `(Tmax+Tmin)/2 − Tbase` | Calor acumulado para crecimiento |
| **Déficit hídrico** (mm) | `ETc_7d − lluvia_7d` | Agua faltante en la semana |
| **Score suelo** (0-100) | Compuesto humedad + temp | > 70 saludable · < 50 crítico |
| **Riesgo plagas** (%) | Modelo temp + HR + cultivo | > 70 = alerta |

**Coeficientes Kc:** Arroz 1.20 · Maíz 1.15 · Plátano 1.10 · Algodón 1.05 · Café 0.95 · Yuca 0.85

---

## Autenticación y Planes

### Flujo de autenticación

```
Browser          Supabase Auth          FastAPI Backend
   │                   │                      │
   │─ signInWithPassword() ─►│                │
   │◄─ JWT (ES256) ──────────│                │
   │                         │                │
   │─ GET /api/v1/farms/ ──────────────────►  │
   │  Authorization: Bearer <jwt>             │
   │                         │  validar JWKS  │
   │                         │  → sub = UUID  │
   │                         │  → get/create  │
   │                         │    UserProfile │
   │◄─ [fincas del usuario] ──────────────── │
```

- **Algoritmo:** ES256 (curva P-256) — clave pública JWKS de Supabase
- **Perfil automático:** Primera request válida crea `UserProfile` (plan `free`)
- **SSR:** `@supabase/ssr` + cookies HTTP-only protege rutas antes de renderizar

### Planes

| Feature | Free | Pro |
|---------|:----:|:---:|
| Fincas | **1** | Ilimitadas |
| Monitoreo tiempo real | ✓ | ✓ |
| KPIs agronómicos | ✓ | ✓ |
| Alertas automáticas | ✓ | ✓ |
| Emails de alerta/mes | Ilimitados | Ilimitados |
| **Análisis IA** | **4 lifetime** | **Ilimitados** |
| Tokens por análisis | 800 | 2.048 |
| Soporte prioritario | ✗ | ✓ |

**Upgrade:** El admin activa Pro con `PATCH /api/v1/users/{id}/plan {"plan": "paid"}`. Arquitectura lista para conectar Stripe — solo falta el webhook.

### Migraciones de base de datos

```bash
# Ejecutar en Supabase SQL Editor — en orden:
# 001_initial_schema.sql    → tablas base
# 002_analysis_quota.sql    → analyses_used + tokens_used en user_profiles
# enable_rls.sql            → Row Level Security
# data_retention.sql        → auto-delete lecturas > 90 días
```

---

## CI/CD

### Pipeline (`.github/workflows/ci-cd.yml`)

```
push a master / PR a master
        │
        ▼
   ┌─────────┐
   │  test   │  Ubuntu + Python 3.11
   │         │  uv sync --dev
   │         │  ruff check app/
   │         │  pytest --cov (SQLite in-memory)
   └────┬────┘
        │ success (solo en push a master)
        ▼
┌──────────────────┐
│  deploy-backend  │  flyctl deploy --remote-only
└──────────────────┘

Frontend: Vercel GitHub Integration (auto-deploy nativo)
          Preview deployments en cada PR
```

### Secrets requeridos en GitHub

```
GROQ_API_KEY          ANTHROPIC_API_KEY
SUPABASE_URL          SUPABASE_KEY
SUPABASE_JWK_X        SUPABASE_JWK_Y       SUPABASE_JWK_KID
DATABASE_URL          REDIS_URL
HIVEMQ_HOST           HIVEMQ_USERNAME      HIVEMQ_PASSWORD
RESEND_API_KEY        FLY_API_TOKEN
LOGFIRE_TOKEN         (opcional)
```

---

## Despliegue en Producción

### Backend — Fly.io

```bash
curl -L https://fly.io/install.sh | sh
flyctl auth login

cd backend
flyctl launch --name surqo-api --region dfw

flyctl secrets set \
  GROQ_API_KEY="gsk_..." \
  SUPABASE_URL="https://..." \
  SUPABASE_KEY="..." \
  DATABASE_URL="postgresql+asyncpg://..." \
  REDIS_URL="rediss://..." \
  HIVEMQ_HOST="..." HIVEMQ_USERNAME="..." HIVEMQ_PASSWORD="..." \
  RESEND_API_KEY="re_..." FROM_EMAIL="alertas@surqo.online"

flyctl deploy --remote-only   # Deploy manual
flyctl logs                   # Ver logs
flyctl status                 # Estado
```

### Frontend — Vercel + surqo.online

El deploy es automático via **Vercel GitHub Integration** en cada push a `master`.

**DNS configurado:** Nameservers de Hostinger apuntan a `ns1.vercel-dns.com` / `ns2.vercel-dns.com`.

Variables en Vercel:
```
NEXT_PUBLIC_API_URL=https://surqo-api.fly.dev
NEXT_PUBLIC_WS_URL=wss://surqo-api.fly.dev
NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
```

### Configuración Fly.io (`backend/fly.toml`)

```toml
app = "surqo-api"
primary_region = "dfw"

[http_service]
  internal_port        = 8080
  force_https          = true
  auto_stop_machines   = false   # Sin hibernación
  min_machines_running = 1

[[vm]]
  size   = "shared-cpu-1x"
  memory = "512mb"

[checks.health]
  interval = "30s"
  method   = "GET"
  path     = "/health"
  timeout  = "5s"
```

---

## Lo que se logró construir

Este proyecto fue desarrollado en **7 días** cubriendo el stack completo de una plataforma SaaS IoT + IA:

| Día | Foco | Entregable |
|-----|------|-----------|
| 1 | Fundamentos | FastAPI + SQLAlchemy async + modelos de dominio |
| 2 | Datos y Clima | Open-Meteo API, VPD, ETc Penman-Monteith, GDD, Redis |
| 3 | IA | LLM multi-proveedor, prompts YAML versionados |
| 4 | IoT + Tiempo Real | MQTT consumer, WebSocket broadcast, firmware ESP32 |
| 5 | Frontend | Next.js 15, dashboard, Recharts, glass morphism |
| 6 | Alertas Email | Cooldown Redis, emails HTML Resend, tests |
| 7 | Auth + Deploy | Supabase ES256, plan Free/Pro, freemium quota, Fly.io + CI/CD |

### Métricas del proyecto

| Métrica | Valor |
|---------|-------|
| Líneas Python (backend) | ~2.400 |
| Archivos Python | ~50 |
| Archivos TypeScript/TSX | ~30 |
| Endpoints REST | 30+ |
| WebSocket endpoints | 1 |
| Tests automatizados | 86+ |
| Modelos de base de datos | 5 |
| Migraciones SQL | 4 |
| Prompts YAML versionados | 3 |
| Dominio propio | surqo.online |
| Días de desarrollo | 7 |

---

## Optimizaciones y Valor de la Plataforma

### Optimizaciones técnicas

**Rendimiento:**
- Redis cache TTL — Open-Meteo se cachea 1h: de ~800ms a ~5ms en hit
- `@lru_cache` clave EC — clave pública ES256 se construye una vez al arrancar
- Deep sleep ESP32 — ~10µA en reposo, 2 semanas de autonomía
- WebSocket broadcast — sin polling, actualización instantánea
- Async end-to-end — FastAPI + SQLAlchemy async + asyncpg

**Seguridad:**
- JWT ES256 — imposible falsificar sin clave privada de Supabase
- Row Level Security — acceso por usuario en PostgreSQL
- Cooldown Redis — previene spam de emails (30 min entre alertas)
- MQTT TLS 8883 — tráfico IoT cifrado end-to-end
- HTTPS forzado — Fly.io `force_https = true`
- Security headers — nosniff, X-Frame-Options: DENY, HSTS
- Rate limiting — slowapi por IP en endpoints críticos
- Swagger deshabilitado en producción

**Freemium:**
- 4 análisis IA lifetime en free (800 tokens/análisis)
- HTTP 402 con CTA de contacto al agotar cuota
- Contadores `analyses_used` + `tokens_used` en DB

### Infraestructura gratuita hasta ~500 usuarios

| Servicio | Tier gratuito | Uso |
|---------|--------------|-----|
| **Fly.io** | shared-cpu-1x, 3 VMs | Backend FastAPI |
| **Vercel** | Hobby, builds ilimitados | Frontend (surqo.online) |
| **Supabase** | 500MB DB, 50K req/mes | PostgreSQL + Auth |
| **Upstash Redis** | 10.000 req/día | Cache + cooldowns |
| **HiveMQ Cloud** | 100 conexiones MQTT | Broker IoT |
| **Resend** | 3.000 emails/mes | Alertas email |
| **Groq** | 14.400 req/día | LLM primario ($0) |
| **Open-Meteo** | Ilimitado | Pronóstico clima |
| **Total** | **~$0–35/mes** | Stack producción completo |

### Propuesta de valor

| Plan | Precio | Target |
|------|--------|--------|
| Free | $0 | Validación, agricultores pequeños |
| Pro | $15–25 USD/mes | Fincas medianas, cooperativas |
| Enterprise | $200+ USD/mes | Agroindustria, grandes extensiones |

**Mercado:** Colombia tiene 4.9M unidades productivas agropecuarias. Solo el 2.3% usa tecnología de precisión.

**Diferenciadores:**
1. Nodo sensor a $15 USD (vs $200–500 USD competidores internacionales)
2. IA contextualizada para el trópico colombiano
3. Resiliencia offline — fallback HTTP si MQTT falla
4. Stack serverless — costo ~$0 hasta escala real

### Roadmap

**Corto plazo:**
- Stripe Checkout + webhook para upgrade automático
- Email proactivo cuando queda 1 análisis gratuito
- Contador visual de análisis restantes en el dashboard

**Mediano plazo:**
- Alertas por WhatsApp (Twilio API)
- Exportar CSV de datos históricos
- Pronóstico 14 días (Pro) vs 3 días (Free)
- Reporte PDF semanal automático

**Largo plazo:**
- App móvil (PWA — Next.js ya es PWA-ready)
- LoRaWAN para zonas sin WiFi
- Detección de plagas por foto (Claude Vision)
- API pública para integradores (FINAGRO, seguros agro)

---

## Contribución

```bash
git checkout -b feature/mi-feature
cd backend
uv run pytest tests/ -v        # Todos los tests deben pasar
uv run ruff check app/          # Sin errores de linting
git commit -m "feat: descripción"
# Pull Request a master
```

---

## Licencia

MIT License — libre para uso personal y comercial con atribución.

---

## Autor

**Ricardo Martínez** — Desarrollador Full Stack & AI  
Plataforma IoT + IA + SaaS para el sector agrícola colombiano.

*"Del surco al insight."*
