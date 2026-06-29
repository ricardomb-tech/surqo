# SURQO — Inteligencia Agroclimática

> Plataforma IoT + IA para el campo colombiano. Del sensor al insight en segundos.

[![CI/CD](https://github.com/ricardomb-tech/surqo/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/ricardomb-tech/surqo/actions)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python)](https://python.org)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=nextdotjs)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![Fly.io](https://img.shields.io/badge/Backend-Fly.io-8B5CF6?logo=fly.io)](https://fly.io)
[![Vercel](https://img.shields.io/badge/Frontend-Vercel-000000?logo=vercel)](https://vercel.com)

---

## ¿Qué es Surqo?

Surqo es una plataforma agroclimática de precisión que conecta sensores físicos instalados en fincas con modelos de inteligencia artificial para generar recomendaciones agronómicas en tiempo real. El nombre viene de *surco* — la línea que traza el arado en la tierra — representando la fusión entre la agricultura tradicional colombiana y la tecnología de vanguardia.

**Problema que resuelve:** El 85% de los agricultores en Colombia toman decisiones de riego, fertilización y cosecha basadas en experiencia visual, sin datos objetivos. Las pérdidas por estrés hídrico, plagas y heladas ascienden a millones de pesos por cosecha que podrían evitarse con monitoreo continuo.

**Solución:** Nodos IoT de bajo costo (ESP32, ~$15 USD) conectados a una nube inteligente que analiza microclima, calcula índices agronómicos y usa IA (Groq / Llama 3.3 70B) para generar planes de acción específicos para cada cultivo en el trópico colombiano.

---

## API en Producción

> **Base URL:** `https://surqo-api.fly.dev`

| Recurso | URL |
|---------|-----|
| **Documentación interactiva (Swagger)** | [https://surqo-api.fly.dev/docs](https://surqo-api.fly.dev/docs) |
| **Documentación alternativa (ReDoc)** | [https://surqo-api.fly.dev/redoc](https://surqo-api.fly.dev/redoc) |
| **Health check** | [https://surqo-api.fly.dev/health](https://surqo-api.fly.dev/health) |
| **Frontend** | [https://www.surqo.online](https://www.surqo.online)|

> El backend corre en **Fly.io** (Dallas — `dfw`) con `auto_stop_machines = false` y `min_machines_running = 1`. Siempre hay al menos una máquina activa; **no hay cold starts**. Las respuestas son inmediatas desde el primer request.

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
          │              (Vercel — Edge Network)            │
          │                                                 │
          │  Dashboard · Sensores · Análisis IA             │
          │  Alertas · Fincas · Upgrade                     │
          └─────────────────────────────────────────────────┘
```

### Flujo de datos completo

1. **Sensor → Nube:** El ESP32 despierta cada 15 min, lee sensores, conecta a WiFi, publica vía MQTT TLS a HiveMQ Cloud y vuelve a deep sleep (consumo ~10µA en reposo)
2. **MQTT → Backend:** El consumer en FastAPI recibe el mensaje, calcula VPD/ETc en tiempo real, persiste en PostgreSQL y evalúa umbrales de alerta
3. **Alerta → Email:** Si hay violación de umbral, verifica cooldown en Redis (30 min) y envía email HTML vía Resend con la acción recomendada
4. **Backend → Frontend:** WebSocket broadcast a todos los clientes conectados para actualización en tiempo real sin polling
5. **Análisis IA:** Fusiona datos de Open-Meteo (pronóstico 7 días), lecturas del sensor y KPIs calculados → prompt estructurado → Groq (Llama 3.3 70B) → JSON con recomendaciones, plan de riego y nivel de alerta

---

## Stack

| Capa | Tecnología | Versión | Por qué |
|------|-----------|---------|---------|
| **Hardware** | ESP32 + DHT22 + DS18B20 + ML8511 | — | Low-cost, bajo consumo, WiFi nativo |
| **Transporte IoT** | MQTT TLS (HiveMQ Cloud) | QoS 1 | Protocolo estándar IoT, bajo ancho de banda |
| **Backend** | FastAPI + Uvicorn | 0.115 | Async nativo, tipado estricto, Swagger automático |
| **ORM** | SQLAlchemy 2.0 (async) | 2.0 | Async sessions, typed queries |
| **Base de datos** | Supabase PostgreSQL | — | Managed, RLS, Auth integrado |
| **Cache** | Upstash Redis | — | Serverless, TTL para clima/análisis |
| **IA (primario)** | Groq — Llama 3.3 70B | — | 14.4K req/día gratis, latencia < 1s |
| **IA (fallback)** | Anthropic Claude | 4.x | Calidad de respuesta premium |
| **IA (dev local)** | Ollama | — | Sin costo, sin red |
| **Email** | Resend API | — | Alta deliverability, API simple |
| **Clima** | Open-Meteo | — | Pronóstico 7 días gratuito, cacheado |
| **Frontend** | Next.js 15 + React 19 | 15.0 | App Router, RSC, SSR, Middleware |
| **Auth** | Supabase Auth + SSR | — | JWT ES256, cookies SSR |
| **Estilos** | Tailwind CSS + dark mode | 3.4 | Utility-first, consistencia de diseño |
| **Animaciones** | Framer Motion | 11 | Transiciones fluidas, glass morphism |
| **Gráficas** | Recharts | 2.x | Declarativo, SVG, responsive |
| **Deploy Backend** | Fly.io (Dallas `dfw`) | — | Always-on, sin cold starts, flyctl |
| **Deploy Frontend** | Vercel | — | Edge network, preview deployments |
| **CI/CD** | GitHub Actions | — | Lint → Test → Deploy automático |
| **Observabilidad** | Logfire (Pydantic) | — | Structured logging, tracing |
| **Package manager** | uv (Astral) | — | Instalación 10-100× más rápida que pip |

---

## Backend

### Estructura

```
backend/
├── app/
│   ├── main.py              # App FastAPI, lifespan, CORS, routers
│   ├── config.py            # Settings via pydantic-settings (.env)
│   ├── database.py          # SQLAlchemy async engine + session factory
│   ├── dependencies.py      # CurrentUser, DBSession, PaidUser (Depends)
│   │
│   ├── models/
│   │   ├── user.py          # UserProfile (plan, email_count, supabase_id)
│   │   ├── farm.py          # Farm (nombre, cultivo, lat/lon, área)
│   │   ├── sensor_reading.py # SensorReading (temp, humedad, suelo, UV, VPD)
│   │   ├── analysis.py      # Analysis (recomendaciones, KPIs, tokens, costo)
│   │   └── alert.py         # Alert (severidad, acción, resuelto, email_sent)
│   │
│   ├── routers/
│   │   ├── users.py         # /api/v1/users — perfil, plan, límites
│   │   ├── farms.py         # /api/v1/farms — CRUD + KPIs
│   │   ├── sensors.py       # /api/v1/sensors — lecturas + WebSocket
│   │   ├── analysis.py      # /api/v1/analysis — análisis IA + historial
│   │   ├── alerts.py        # /api/v1/alerts — activas, historial, resolve
│   │   └── kpis.py          # /api/v1/kpis — VPD, ETc, riesgo plagas
│   │
│   ├── services/
│   │   ├── llm_service.py   # Multi-provider LLM (Groq/Anthropic/Ollama)
│   │   ├── kpi_service.py   # VPD Magnus, ETc Penman-Monteith, GDD, déficit
│   │   ├── climate_service.py # Open-Meteo API + ET₀ + caché Redis
│   │   ├── alert_service.py # Umbrales → alertas → email con cooldown
│   │   ├── mqtt_service.py  # Consumer HiveMQ (paho-mqtt async bridge)
│   │   └── cache_service.py # Redis wrapper (get/set + graceful fail)
│   │
│   ├── schemas/             # Pydantic v2 (request/response validation)
│   ├── websocket/           # Manager broadcast en tiempo real
│   └── prompts/             # YAML versionados: análisis, triage, summary
│       ├── farm_analysis_v1.0.yaml
│       ├── alert_triage_v1.0.yaml
│       └── daily_summary_v1.0.yaml
│
├── tests/
│   ├── conftest.py          # Fixtures: SQLite in-memory + async session + mock auth
│   ├── test_api_farms.py    # CRUD de fincas, autorización por propietario
│   ├── test_api_sensors.py  # Timeseries, estadísticas
│   ├── test_api_alerts.py   # Alertas activas, historial, resolución
│   ├── test_api_users.py    # Creación de perfil, plan
│   ├── test_climate_service.py # Fetching de pronóstico, caché
│   ├── test_kpi_service.py  # VPD, ETc, riesgo de plagas
│   ├── test_llm_service.py  # Selección de proveedor, parseo de respuesta
│   └── test_alert_service.py # Cooldown Redis, envío de email, resolución
│
├── migrations/              # Scripts SQL para Supabase
├── Dockerfile               # Python 3.11-slim + uv
├── fly.toml                 # Configuración Fly.io (Dallas, 512MB)
└── pyproject.toml           # uv — dependencias + dev tools
```

### Modelos de dominio

| Modelo | Tabla | Descripción |
|--------|-------|-------------|
| `UserProfile` | `user_profiles` | Extiende Supabase Auth. Guarda plan (`free`/`paid`), `email_count_month` y FK al UUID de Supabase |
| `Farm` | `farms` | Unidad productiva. Campos: nombre, cultivo, lat/lon, área, email de alertas, `user_id` |
| `SensorReading` | `sensor_readings` | Lectura temporal. Campos: temp. aire/suelo, humedad aire/suelo, UV, VPD calculado, batería, RSSI |
| `Analysis` | `analyses` | Resultado IA. Incluye recomendaciones JSON, tokens usados, costo USD, modelo usado |
| `Alert` | `alerts` | Alerta con severidad (`info`/`warning`/`critical`), acción recomendada, flag `is_resolved`, `email_sent` |

### Servicio LLM — Arquitectura multi-proveedor

El `llm_service.py` soporta tres proveedores seleccionables via variable de entorno `LLM_PROVIDER`:

```
LLM_PROVIDER=groq       → Groq API (Llama 3.3 70B) — primario, gratis hasta 14.4K req/día
LLM_PROVIDER=anthropic  → Anthropic Claude 4.x — fallback, máxima calidad
LLM_PROVIDER=ollama     → Ollama local — desarrollo sin costo ni red
```

Los prompts están en archivos YAML versionados (`prompts/`), lo que permite actualizarlos sin modificar código Python y hacerlos trazables en git.

---

## Frontend

### Estructura

```
frontend/src/
├── app/                        # Next.js 15 App Router
│   ├── page.tsx                # Landing page (hero, features, stats)
│   ├── layout.tsx              # Root layout: AuthProvider + NavBar + Footer
│   ├── dashboard/page.tsx      # Dashboard principal con KPIs y gráficas
│   ├── farms/page.tsx          # Gestión de fincas (crear, listar, eliminar)
│   ├── sensors/page.tsx        # Lecturas en tiempo real (WebSocket)
│   ├── analyze/page.tsx        # Análisis IA (solo plan Pro)
│   ├── alerts/page.tsx         # Centro de alertas activas e historial
│   ├── login/page.tsx          # Inicio de sesión con email/contraseña
│   ├── register/page.tsx       # Registro de nueva cuenta
│   ├── upgrade/page.tsx        # Comparativa de planes Free vs Pro
│   ├── como-funciona/          # Página estática — cómo funciona Surqo
│   ├── soluciones/             # Soluciones por tipo de cultivo
│   ├── preguntas/              # Preguntas frecuentes
│   ├── privacidad/             # Política de privacidad
│   └── terminos/               # Términos de uso
│
├── components/
│   ├── NavBar.tsx              # Barra fija: nav + usuario + badge plan
│   ├── AuthProvider.tsx        # Contexto React: session, isPaid, planLimits
│   ├── RequireAuth.tsx         # HOC protección de rutas cliente
│   ├── KPICard.tsx             # Tarjeta de métrica (VPD, ETc, humedad)
│   ├── SensorChart.tsx         # Gráfica temporal (Recharts)
│   ├── LiveFeed.tsx            # Feed WebSocket en tiempo real
│   ├── AnalysisResult.tsx      # Resultado análisis IA con recomendaciones
│   ├── AlertBadge.tsx          # Badge de severidad (ok / warning / critical)
│   ├── ThemeProvider.tsx       # Dark/light mode (next-themes)
│   ├── ThemeToggle.tsx         # Botón toggle dark/light
│   └── ui/                     # Primitivas de diseño (Button, Card)
│
├── lib/
│   ├── api.ts                  # Cliente HTTP: todos los endpoints con auth JWT
│   ├── auth.ts                 # Helpers: getSession, getAccessToken, signOut
│   ├── supabase.ts             # createBrowserClient (SSR-compatible con cookies)
│   ├── websocket.ts            # WebSocket manager (live feed)
│   └── utils.ts                # cn(), formatters de fecha y unidades
│
├── types/index.ts              # Farm, SensorReading, Alert, Analysis, KPIs
└── middleware.ts               # Protección SSR de rutas (cookies Supabase)
```

### Páginas y funcionalidades

| Ruta | Acceso | Descripción |
|------|--------|-------------|
| `/` | Público | Landing page con propuesta de valor y glass morphism |
| `/login` | Solo no-auth | Inicio de sesión (redirige a `/dashboard`) |
| `/register` | Solo no-auth | Registro gratuito — plan Free automático |
| `/dashboard` | Autenticado | KPIs en tiempo real, gráficas, feed live |
| `/farms` | Autenticado | Gestión de fincas (límite 3 en Free, ilimitadas en Pro) |
| `/sensors` | Autenticado | Lecturas de sensores, timeseries, WebSocket |
| `/alerts` | Autenticado | Alertas activas e historial |
| `/analyze` | **Solo Pro** | Análisis IA completo con Groq/Claude — plan de acción |
| `/upgrade` | Autenticado | Comparativa Free vs Pro, CTA de contacto |

---

## Firmware

### Hardware por nodo (~$15 USD)

| Componente | Función | Precio aprox. |
|-----------|---------|--------------|
| ESP32 WROOM-32 | Microcontrolador + WiFi nativo | $4 USD |
| DHT22 | Temperatura y humedad del aire | $2 USD |
| DS18B20 (impermeable) | Temperatura del suelo | $2 USD |
| Sensor capacitivo suelo | Humedad volumétrica del suelo | $1.5 USD |
| ML8511 | Índice UV solar | $2 USD |
| Batería LiPo 2000mAh | Autonomía ~2 semanas en deep sleep | $4 USD |

### Conexiones GPIO

```
ESP32 GPIO4  → DHT22 DATA
ESP32 GPIO5  → DS18B20 DATA (OneWire + resistencia 4.7kΩ a 3.3V)
ESP32 GPIO32 → Sensor suelo capacitivo AOUT
ESP32 GPIO34 → ML8511 UV OUT
ESP32 GPIO35 → Divisor de voltaje batería (para medir mV)
```

### Configuración `firmware/surqo_node/config.h`

```cpp
#define WIFI_SSID       "tu-red"
#define WIFI_PASSWORD   "tu-password"
#define HIVEMQ_HOST     "cluster.s1.eu.hivemq.cloud"
#define HIVEMQ_PORT     8883
#define HIVEMQ_USER     "usuario"
#define HIVEMQ_PASS     "password"
#define DEVICE_ID       "esp32-nodo-01"
#define FARM_ID         "uuid-de-la-finca"
#define SLEEP_SECONDS   900   // 15 minutos
```

### Ciclo de operación

```
Despertar (timer RTC)
  → Inicializar sensores (DHT22, DS18B20, capacitivo, ML8511)
  → Conectar WiFi
  → Sincronizar NTP
  → Leer sensores (temp, humedad, suelo, UV, batería mV)
  → Calcular VPD local
  → Publicar JSON vía MQTT TLS (puerto 8883) a HiveMQ Cloud
  → Deep sleep 15 min (~10µA consumo)

Fallback si MQTT falla:
  → HTTP POST a https://surqo-api.fly.dev/api/v1/sensors/readings
  → Deep sleep
```

---

## Simulador IoT

Para desarrollo sin hardware físico, el proyecto incluye un simulador MQTT:

```bash
cd iot-simulator
python simulator.py
```

El simulador publica mensajes MQTT con valores aleatorios realistas para temperatura, humedad, suelo, UV y batería, usando el mismo schema JSON que el firmware ESP32. Útil para probar el consumer MQTT del backend y el WebSocket del frontend sin necesitar sensores físicos.

---

## Instalación Local

### Prerrequisitos

- Python 3.11+
- [uv](https://docs.astral.sh/uv/getting-started/installation/) (gestor de paquetes)
- Node.js 20+
- Cuentas en: Supabase, Upstash Redis, HiveMQ Cloud, Resend, Groq (todas con tier gratuito)

### Backend

```bash
git clone https://github.com/ricardomb-tech/surqo.git
cd surqo/backend

# Instalar dependencias
uv sync

# Configurar variables de entorno
cp .env.example .env
# Edita .env con tus credenciales (ver tabla más abajo)

# Arrancar servidor de desarrollo
uv run fastapi dev app/main.py
# → http://localhost:8000/docs

# Correr tests
uv run pytest tests/ -v --cov=app

# Linter
uv run ruff check app/
```

### Frontend

```bash
cd surqo/frontend

npm install

# Variables de entorno
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
EOF

# Desarrollo
npm run dev
# → http://localhost:3000

# Build producción
npm run build && npm start
```

### Variables de Entorno — Backend

```env
# LLM Provider (groq | anthropic | ollama)
LLM_PROVIDER=groq
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.3-70b-versatile

# Anthropic (fallback opcional)
ANTHROPIC_API_KEY=sk-ant-...

# Ollama (solo desarrollo local)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3

# Supabase
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=sb_secret_...             # Service Role Key (bypasea RLS)
SUPABASE_JWK_X=pDWflX5Eq...           # Coordenada X del JWK público (ES256)
SUPABASE_JWK_Y=kaePA94RA...           # Coordenada Y del JWK público
SUPABASE_JWK_KID=f30d561e-...         # Key ID del JWK
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
FROM_EMAIL=alertas@surqo.io

# App
APP_ENV=development
CORS_ORIGINS=["http://localhost:3000","https://surqo.vercel.app"]
LOGFIRE_TOKEN=                         # Opcional — vacío para deshabilitar
```

### Dónde obtener cada credencial

| Variable | Fuente |
|----------|--------|
| `GROQ_API_KEY` | [console.groq.com](https://console.groq.com) → API Keys |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) → API Keys |
| `SUPABASE_URL` + `SUPABASE_KEY` | Supabase Dashboard → Settings → API |
| `SUPABASE_JWK_X/Y/KID` | Supabase Dashboard → Settings → API → JWT Settings → JWKS |
| `DATABASE_URL` | Supabase Dashboard → Settings → Database → Session Pooler (IPv4) |
| `REDIS_URL` | [console.upstash.com](https://console.upstash.com) → Redis → Connect |
| `HIVEMQ_HOST/USER/PASS` | [console.hivemq.cloud](https://console.hivemq.cloud) → Cluster Settings |
| `RESEND_API_KEY` | [resend.com](https://resend.com) → API Keys |

### Documentación local

Con el backend corriendo en `http://localhost:8000`:

- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`
- **Health check:** `http://localhost:8000/health`

---

## API Reference

> Documentación interactiva en vivo: **[https://surqo-api.fly.dev/docs](https://surqo-api.fly.dev/docs)**

### Autenticación

Todos los endpoints protegidos requieren el header:

```http
Authorization: Bearer <jwt-token-de-supabase>
```

El token JWT es emitido por **Supabase Auth** con algoritmo **ES256** (curva elíptica P-256). El backend lo valida contra la clave pública JWKS del proyecto Supabase. En el frontend, el token se obtiene automáticamente con `supabase.auth.getSession()`.

---

### `GET /health`

Verifica que el servidor y la base de datos están operativos.

**Acceso:** Público

**Respuesta `200`:**
```json
{
  "status": "ok",
  "db": "ok",
  "env": "production"
}
```

---

### Fincas — `/api/v1/farms`

#### `POST /api/v1/farms/`

Registra una nueva finca asociada al usuario autenticado.

**Acceso:** Autenticado · Plan Free: máximo 3 fincas (`402` al exceder)

**Body:**
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

**Respuesta `201`:**
```json
{
  "id": "310f2f64-4faf-4552-bc13-e9964e1cfccb",
  "name": "Finca La Esperanza",
  "crop_type": "maíz",
  "latitude": 8.7575,
  "longitude": -75.8891,
  "area_hectares": 12.5,
  "alert_email": "agricultor@ejemplo.com",
  "user_id": "uuid-usuario",
  "created_at": "2026-05-17T10:00:00Z"
}
```

#### `GET /api/v1/farms/`

Lista todas las fincas del usuario autenticado.

#### `GET /api/v1/farms/{farm_id}`

Detalle de una finca. Solo el propietario puede acceder (`403` si otro usuario intenta).

#### `PATCH /api/v1/farms/{farm_id}`

Actualiza campos de la finca (todos opcionales). Solo propietario.

#### `DELETE /api/v1/farms/{farm_id}`

Elimina la finca y todos sus datos (lecturas, análisis, alertas). Respuesta `204`.

#### `GET /api/v1/farms/{farm_id}/kpis`

KPIs agronómicos basados en lecturas de las últimas 24 horas.

**Respuesta `200`:**
```json
{
  "vpd_kpa": 1.42,
  "avg_air_temp_c": 29.5,
  "avg_humidity_pct": 68.3,
  "avg_soil_moisture_pct": 44.1,
  "soil_health_score": 75,
  "pest_risk": {
    "risk_pct": 35,
    "pathogens": ["roya", "fusarium"],
    "conditions": "Condiciones moderadas de riesgo"
  },
  "readings_count_24h": 96,
  "latest_reading_at": "2026-05-17T14:30:00Z"
}
```

---

### Sensores — `/api/v1/sensors`

#### `POST /api/v1/sensors/readings`

Registra una lectura. Usada por el ESP32 como fallback HTTP o por el consumer MQTT interno.

**Acceso:** Público (el `farm_id` actúa como scope)

**Body:**
```json
{
  "device_id": "ESP32-CAMPO-001",
  "farm_id": "310f2f64-4faf-4552-bc13-e9964e1cfccb",
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

El `vpd_kpa` se calcula automáticamente en el backend usando la ecuación de Magnus.

#### `GET /api/v1/sensors/timeseries/{farm_id}`

Serie temporal para graficar.

**Query params:**
- `hours` (int, default 24, máx 168): ventana de tiempo
- `metric` (string, default `soil_moisture_pct`): métrica a consultar

**Métricas disponibles:** `soil_moisture_pct`, `soil_temp_c`, `air_temp_c`, `air_humidity_pct`, `vpd_kpa`, `uv_index`

**Respuesta `200`:**
```json
[
  { "timestamp": "2026-05-17T00:00:00Z", "value": 43.2 },
  { "timestamp": "2026-05-17T00:15:00Z", "value": 43.8 }
]
```

#### `WebSocket /api/v1/sensors/ws/live/{farm_id}`

Stream en tiempo real. El backend hace broadcast a todos los clientes conectados cada vez que llega una lectura MQTT de esa finca.

**Acceso:** Sin autenticación (el `farm_id` actúa como scope)

**Ejemplo de conexión:**
```javascript
const ws = new WebSocket('wss://surqo-api.fly.dev/api/v1/sensors/ws/live/FARM_ID')
ws.onmessage = (event) => {
  const reading = JSON.parse(event.data)
  console.log('Humedad suelo:', reading.soil_moisture_pct)
}
```

---

### Análisis IA — `/api/v1/analysis`

#### `POST /api/v1/analysis/analyze`

Ejecuta análisis agronómico completo. Fusiona lecturas del sensor + pronóstico Open-Meteo (7 días) + KPIs → Groq (Llama 3.3 70B) → JSON estructurado. Tarda ~1-3 segundos.

**Acceso:** Autenticado · **Solo plan Pro** (`402` en plan Free)

**Body:**
```json
{
  "farm_id": "310f2f64-4faf-4552-bc13-e9964e1cfccb",
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
  "farm_id": "uuid-finca",
  "farm_name": "Finca La Esperanza",
  "crop_type": "maíz",
  "alert_level": "warning",
  "summary_for_farmer": "Tu cultivo de maíz muestra estrés hídrico moderado. El pronóstico indica ausencia de lluvia por 5 días. Se recomienda aplicar riego en las próximas 24 horas para evitar pérdidas en la etapa de llenado de grano.",
  "irrigation_needed": true,
  "water_stress_index": 0.67,
  "avg_temperature_c": 29.5,
  "total_rain_7d_mm": 8.2,
  "avg_vpd_kpa": 1.62,
  "recommendations": [
    {
      "action": "Aplicar riego por goteo — 25mm en las próximas 6 horas",
      "time_window": "0-6h",
      "justification": "VPD > 1.6 kPa y suelo al 38% de capacidad de campo",
      "category": "irrigation",
      "priority": 1
    }
  ],
  "model_used": "llama-3.3-70b-versatile",
  "input_tokens": 624,
  "output_tokens": 318,
  "cost_usd": 0.0,
  "created_at": "2026-05-17T14:35:00Z"
}
```

**Niveles de alerta:**

| `alert_level` | Descripción |
|--------------|-------------|
| `ok` | Condiciones óptimas — sin acción urgente |
| `warning` | Estrés detectado — acción recomendada en 24-48h |
| `critical` | Condición crítica — acción inmediata necesaria |

#### `GET /api/v1/analysis/history/{farm_id}`

Historial de análisis, del más reciente al más antiguo.

#### `GET /api/v1/analysis/{analysis_id}`

Detalle de un análisis específico. Solo propietario de la finca.

---

### Alertas — `/api/v1/alerts`

Alertas automáticas generadas cuando las lecturas superan umbrales: VPD > 1.6 kPa, suelo < 25%, temperatura > 38°C. Cooldown de 30 minutos en Redis para evitar spam.

#### `GET /api/v1/alerts/active`

Alertas activas del usuario. Query param `farm_id` opcional para filtrar.

**Respuesta `200`:**
```json
[
  {
    "id": "uuid-alerta",
    "farm_id": "uuid-finca",
    "title": "VPD crítico — Estrés hídrico severo",
    "description": "El VPD alcanzó 2.1 kPa, superando el umbral crítico de 2.0 kPa.",
    "severity": "critical",
    "recommended_action": "Aplicar riego inmediato — mínimo 30mm en las próximas 2 horas.",
    "is_resolved": false,
    "created_at": "2026-05-17T12:00:00Z"
  }
]
```

**Niveles de severidad:**

| `severity` | Descripción |
|-----------|-------------|
| `info` | Información relevante — sin urgencia |
| `warning` | Condición anómala — monitorear |
| `critical` | Acción inmediata requerida |

#### `GET /api/v1/alerts/history`

Historial completo (activas y resueltas).

#### `PATCH /api/v1/alerts/{alert_id}/resolve`

Marca una alerta como resuelta. Solo propietario.

---

### KPIs — `/api/v1/kpis`

#### `GET /api/v1/kpis/farm/{farm_id}`

KPIs calculados con ecuaciones científicas estándar.

| KPI | Fórmula | Interpretación |
|-----|---------|----------------|
| **VPD** (kPa) | `es − ea` donde `es = 0.6108 × e^(17.27T/(T+237.3))` (Magnus) | < 0.8 óptimo · 0.8–1.6 aceptable · > 1.6 estrés · > 2.5 crítico |
| **ETc** (mm/día) | `ET₀ × Kc` (coeficiente por cultivo) | Agua consumida por el cultivo por día |
| **GDD** (°días) | `(Tmax + Tmin)/2 − Tbase` | Calor acumulado para desarrollo del cultivo |
| **Déficit hídrico** (mm) | `ETc_7d − lluvia_7d` (solo si > 0) | Agua faltante en la semana |
| **Score suelo** (0-100) | 40 pts humedad + 30 pts temp. + 30 pts CE | > 70 saludable · 50-70 aceptable · < 50 crítico |
| **Riesgo plagas** (%) | Modelo por temp + humedad + cultivo | < 40 bajo · 40-70 moderado · > 70 alto |

**Coeficientes Kc por cultivo:**

| Cultivo | Kc |
|---------|-----|
| Arroz | 1.20 |
| Maíz | 1.15 |
| Plátano | 1.10 |
| Algodón | 1.05 |
| Café | 0.95 |
| Yuca | 0.85 |

---

### Ejemplo de integración completa

```bash
BASE="https://surqo-api.fly.dev"
JWT="TU_JWT_DE_SUPABASE"

# 1. Crear una finca
curl -X POST $BASE/api/v1/farms/ \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mi Finca",
    "crop_type": "maíz",
    "latitude": 8.7575,
    "longitude": -75.8891,
    "area_hectares": 10,
    "alert_email": "yo@ejemplo.com"
  }'

# 2. Enviar lectura de sensor (desde ESP32 o simulador)
curl -X POST $BASE/api/v1/sensors/readings \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "ESP32-TEST-001",
    "farm_id": "FARM_ID_DEL_PASO_1",
    "sensors": {
      "soil_moisture_pct": 42.0,
      "soil_temp_c": 28.0,
      "air_temp_c": 31.0,
      "air_humidity_pct": 68.0,
      "light_uv_index": 7.2
    },
    "battery_mv": 3820,
    "rssi_dbm": -62
  }'

# 3. Consultar KPIs
curl $BASE/api/v1/farms/FARM_ID/kpis \
  -H "Authorization: Bearer $JWT"

# 4. Ver alertas activas
curl "$BASE/api/v1/alerts/active?farm_id=FARM_ID" \
  -H "Authorization: Bearer $JWT"
```

---

## Autenticación y Planes

### Flujo de autenticación

```
Browser                  Supabase Auth            FastAPI Backend
   │                          │                         │
   │── signInWithPassword() ──►│                         │
   │◄── JWT (ES256) ───────────│                         │
   │                          │                         │
   │── GET /api/v1/farms/ ─────────────────────────────►│
   │   Authorization: Bearer <jwt>                       │
   │                          │    ECAlgorithm.from_jwk()│
   │                          │    → decode ES256        │
   │                          │    → get/create          │
   │                          │      UserProfile         │
   │◄── [fincas del usuario] ──────────────────────────  │
```

- **Algoritmo:** ES256 (curva elíptica P-256) — clave pública de la JWKS de Supabase
- **Perfil automático:** El primer request con JWT válido crea el `UserProfile` en la DB (sin registro separado en el backend)
- **SSR:** El middleware de Next.js usa `@supabase/ssr` + cookies para proteger rutas en el servidor antes de renderizar
- **Caché de clave pública:** La clave EC se construye una sola vez con `@lru_cache` al arrancar, no en cada request

### Planes

| Feature | Free | Pro |
|---------|:----:|:---:|
| Fincas registradas | 3 máximo | Ilimitadas |
| Sensores tiempo real | ✓ | ✓ |
| Historial de datos | ✓ | ✓ |
| Alertas automáticas | ✓ | ✓ |
| Emails de alerta / mes | 10 | Ilimitados |
| Análisis IA (Groq / Claude) | ✗ | ✓ |
| Soporte prioritario | ✗ | ✓ |

**Gestión de plan:** El admin cambia el plan via `PATCH /api/v1/users/{id}/plan` con `{"plan": "paid"}`. La arquitectura está lista para conectar Stripe Checkout — solo se necesita el webhook al mismo endpoint.

### Row Level Security

```sql
-- Aplicar en Supabase SQL Editor
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "farms: owner only" ON public.farms
  FOR ALL USING (user_id = auth.uid());

-- Repetir para: user_profiles, sensor_readings, analyses, alerts
```

El backend usa `service_role` (bypasea RLS). Los usuarios con `anon key` solo ven sus propios datos.

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
        │ success
   ┌────┴──────────────────────────┐
   │                               │
   ▼                               ▼
┌──────────────────┐      ┌────────────────────┐
│  deploy-backend  │      │  deploy-frontend   │
│  flyctl deploy   │      │  vercel-action     │
│  --remote-only   │      │  --prod            │
└────────┬─────────┘      └──────────┬─────────┘
         │                           │
         └────────────┬──────────────┘
                      ▼
              ┌──────────────┐
              │notify-deploy │  Step summary con resultado
              └──────────────┘
```

### Secrets requeridos en GitHub

```
# LLM
GROQ_API_KEY              ANTHROPIC_API_KEY

# Supabase
SUPABASE_URL              SUPABASE_KEY
SUPABASE_JWK_X            SUPABASE_JWK_Y            SUPABASE_JWK_KID

# Infraestructura
FLY_API_TOKEN             VERCEL_TOKEN
VERCEL_ORG_ID             VERCEL_PROJECT_ID

# Servicios opcionales
RESEND_API_KEY            LOGFIRE_TOKEN
```

---

## Despliegue en Producción

### Backend — Fly.io

```bash
# Instalar flyctl
curl -L https://fly.io/install.sh | sh

# Login
flyctl auth login

# Primera vez: crear la app
cd backend
flyctl launch --name surqo-api --region dfw

# Configurar secrets (una sola vez)
flyctl secrets set \
  GROQ_API_KEY="gsk_..." \
  ANTHROPIC_API_KEY="sk-ant-..." \
  SUPABASE_URL="https://..." \
  SUPABASE_KEY="..." \
  SUPABASE_JWK_X="..." \
  SUPABASE_JWK_Y="..." \
  SUPABASE_JWK_KID="..." \
  DATABASE_URL="postgresql+asyncpg://..." \
  REDIS_URL="rediss://..." \
  HIVEMQ_HOST="..." \
  HIVEMQ_USERNAME="..." \
  HIVEMQ_PASSWORD="..." \
  RESEND_API_KEY="re_..."

# Deploy manual
flyctl deploy --remote-only

# Ver logs
flyctl logs

# Estado de la app
flyctl status
```

El CI/CD hace deploy automático en cada push a `master` usando `FLY_API_TOKEN`.

### Frontend — Vercel

El CI/CD hace deploy automático vía `amondnet/vercel-action`. Para deploy manual:

```bash
cd frontend
npx vercel --prod
```

Variables de entorno requeridas en Vercel:
```
NEXT_PUBLIC_API_URL=https://surqo-api.fly.dev
NEXT_PUBLIC_WS_URL=wss://surqo-api.fly.dev
NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
```

### Configuración Fly.io (`backend/fly.toml`)

```toml
app = "surqo-api"
primary_region = "dfw"   # Dallas — más cercano a Colombia

[http_service]
  internal_port      = 8080
  force_https        = true
  auto_stop_machines = false   # Sin hibernación — siempre disponible
  min_machines_running = 1

[[vm]]
  size   = "shared-cpu-1x"
  memory = "512mb"

[checks.health]
  interval = "30s"
  method   = "GET"
  path     = "/health"
  timeout  = "5s"
  type     = "http"
```

---

## Lo que se logró construir

Este proyecto fue desarrollado en **7 días** cubriendo el stack completo de una plataforma SaaS IoT + IA:

| Día | Foco | Entregable |
|-----|------|-----------|
| 1 | Fundamentos | FastAPI + SQLAlchemy async + modelos de dominio (Farm, Sensor, Analysis, Alert) |
| 2 | Datos y Clima | Open-Meteo API, VPD (Magnus), ETc (Penman-Monteith), GDD, cache Redis |
| 3 | IA | LLM multi-proveedor (Groq/Anthropic/Ollama), prompts YAML versionados |
| 4 | IoT + Tiempo Real | Consumer MQTT asíncrono, WebSocket broadcast, firmware ESP32 deep sleep |
| 5 | Frontend | Next.js 15, dashboard, gráficas Recharts, diseño dark mode + glass morphism |
| 6 | Alertas Email | Sistema de alertas con cooldown Redis, emails HTML vía Resend, 21 tests |
| 7 | Auth + Deploy | Supabase Auth ES256, plan Free/Pro, login/register/paywall, Fly.io + CI/CD |

### Métricas del proyecto

| Métrica | Valor |
|---------|-------|
| Líneas Python (backend) | ~2.400 |
| Archivos Python | ~50 |
| Archivos TypeScript/TSX | ~30 |
| Endpoints REST | 28 |
| WebSocket endpoints | 1 |
| Tests automatizados | 52+ |
| Modelos de base de datos | 5 |
| Servicios de negocio | 6 |
| Prompts YAML versionados | 3 |
| Días de desarrollo | 7 |

---

## Optimizaciones y Valor de la Plataforma

### Optimizaciones técnicas implementadas

**Rendimiento:**
- **Redis cache TTL** — llamadas a Open-Meteo se cachean 1 hora: de ~800ms a ~5ms en cache hit
- **`@lru_cache` clave EC** — la clave pública ES256 de Supabase se construye una vez al arrancar, no en cada request
- **Deep sleep ESP32** — consumo de ~10µA en reposo, autonomía 2 semanas con batería 2000mAh
- **WebSocket broadcast en memoria** — sin polling, actualización instantánea sin carga HTTP adicional
- **Async end-to-end** — FastAPI + SQLAlchemy async + asyncpg: un proceso maneja miles de conexiones
- **uv package manager** — instalación 10-100× más rápida que pip en CI/CD

**Seguridad:**
- **JWT ES256** — clave pública EC, imposible falsificar sin la clave privada de Supabase
- **Row Level Security** — acceso directo a PostgREST bloqueado por usuario en Postgres
- **Cooldown de alertas** — Redis previene spam de emails (30 min entre alertas por finca)
- **MQTT TLS puerto 8883** — tráfico del campo a la nube cifrado end-to-end
- **HTTPS forzado** — configurado en Fly.io `force_https = true`

**Calidad de código:**
- **Prompts YAML versionados** — se actualizan sin tocar el código, trazables en git
- **Pydantic v2 estricto** — validación de entrada/salida en todos los endpoints
- **Ruff linting** — cero warnings en CI antes de cada deploy
- **52+ tests** — SQLite in-memory para tests rápidos sin DB real

**Infraestructura:**
- **Fly.io vs Render:** Fly.io tiene `auto_stop_machines = false` — sin cold starts, siempre disponible. Render Free hiberna a los 15 min de inactividad (hasta 60s de arranque).

### Roadmap

**Corto plazo (1-2 semanas):**
- Integrar Stripe Checkout — la API de admin ya está lista, solo falta el webhook
- Alembic migrations formales en lugar de `create_all` en startup
- Rate limiting por usuario en análisis IA (evitar abuso del plan Pro)
- Tests de integración con `httpx.AsyncClient` para endpoints autenticados

**Mediano plazo (1-3 meses):**
- Dashboard móvil con React Native / Expo
- LoRaWAN como transporte alternativo a WiFi para zonas sin señal
- Modelo ONNX lite en el ESP32 para alertas offline sin conexión
- Soporte multi-idioma (español / inglés) con i18n en Next.js

**Largo plazo (6-12 meses):**
- Imágenes satelitales Sentinel-2 para correlacionar NDVI con lecturas de suelo
- API pública para integradores (certificadoras orgánicas, seguros agro, crédito FINAGRO)
- Marketplace de sensores certificados Surqo con configuración plug-and-play
- Modelo predictivo de cosecha basado en historial de KPIs + clima + variedad

### Infraestructura gratuita hasta ~500 usuarios activos

| Servicio | Tier gratuito | Uso |
|---------|--------------|-----|
| **Fly.io** | shared-cpu-1x, 3 VMs gratis | Backend FastAPI |
| **Vercel** | Hobby — builds ilimitados | Frontend Next.js |
| **Supabase** | 500MB DB, 50K req/mes | PostgreSQL + Auth |
| **Upstash Redis** | 10.000 req/día | Cache clima/análisis |
| **HiveMQ Cloud** | 100 conexiones MQTT | Broker IoT |
| **Resend** | 3.000 emails/mes | Alertas email |
| **Groq** | 14.400 req/día | LLM primario (gratis) |
| **Open-Meteo** | Ilimitado | Pronóstico clima |

### Propuesta de valor

**Para el agricultor:**
- Reducción estimada 20-35% en consumo de agua con riego basado en VPD/ETc real
- Detección temprana de estrés hídrico y plagas antes de que sean visibles
- Recomendaciones en lenguaje natural — sin conocimientos técnicos requeridos
- Monitoreo 24/7 desde cualquier dispositivo con internet

**Como producto SaaS:**

| Plan | Precio estimado | Mercado |
|------|----------------|---------|
| Free | $0 | Agricultores pequeños, validación de mercado |
| Pro | $15–25 USD/mes | Fincas medianas, cooperativas |
| Enterprise | $200+ USD/mes | Agroindustria, grandes extensiones |

**Mercado objetivo:**
- Colombia tiene **4.9 millones** de unidades productivas agropecuarias (DANE 2022)
- Solo el **2.3%** usa tecnología de precisión — mercado prácticamente virgen
- Financiamiento disponible: MinAgricultura, FINAGRO, programas de digitalización rural

**Diferenciadores competitivos:**
1. **Precio del nodo** — $15 USD vs $200–500 USD de competidores internacionales (John Deere, Trimble)
2. **IA contextualizada** — prompts entrenados para el trópico colombiano, no genéricos
3. **Resiliencia offline** — ESP32 con deep sleep y fallback HTTP, funciona con red inestable
4. **Stack serverless** — costo de infraestructura ~$0 hasta escala real
5. **Open source** — comunidad puede adaptar el firmware a cultivos específicos

---

## Contribución

```bash
# 1. Fork y clona el repositorio
git checkout -b feature/mi-feature

# 2. Desarrolla en el backend
cd backend
uv run pytest tests/ -v          # Todos los tests deben pasar
uv run ruff check app/            # Sin errores de linting

# 3. Commit semántico
git commit -m "feat: descripción de la feature"

# 4. Pull Request a master
```

---

## Licencia

MIT License — libre para uso personal y comercial con atribución.

---

## Autor

**Ricardo Martínez** — Junior Developer & AI Analyst  
Plataforma completa IoT + IA + SaaS para el sector agrícola colombiano.

*"Del surco al insight."*
