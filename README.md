# SURQO — Inteligencia Agroclimática

> Plataforma IoT + IA para el campo colombiano. Del sensor al insight en segundos.

[![Backend CI](https://github.com/your-org/surqo/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/your-org/surqo/actions)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python)](https://python.org)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=nextdotjs)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)](https://fastapi.tiangolo.com)

---

## ¿Qué es Surqo?

Surqo es una plataforma agroclimática de precisión que conecta sensores físicos instalados en fincas con modelos de inteligencia artificial para generar recomendaciones agronómicas en tiempo real. El nombre viene de *surco* — la línea que traza el arado en la tierra — representando la fusión entre la agricultura tradicional colombiana y la tecnología de vanguardia.

**Problema que resuelve:** El 85% de los agricultores en Colombia toman decisiones de riego, fertilización y cosecha basadas en experiencia visual, sin datos objetivos. Las pérdidas por estrés hídrico, plagas y heladas ascienden a millones de pesos por cosecha que podrían evitarse con monitoreo continuo.

**Solución:** Nodos IoT de bajo costo (ESP32, ~$15 USD) conectados a una nube inteligente que analiza microclima, calcula índices agronómicos y usa Claude AI para generar planes de acción específicos para cada cultivo en el trópico colombiano.

---

## Índice

1. [Arquitectura del Sistema](#arquitectura)
2. [Stack Tecnológico](#stack)
3. [Backend — FastAPI](#backend)
4. [Frontend — Next.js](#frontend)
5. [Firmware — ESP32](#firmware)
6. [Instalación y Configuración](#instalación-y-configuración)
7. [API Reference](#api-reference)
8. [Autenticación y Planes](#autenticación-y-planes)
9. [CI/CD Pipeline](#cicd)
10. [Lo que se logró construir](#lo-que-se-logró-construir)
11. [Optimizaciones y Valor de la Plataforma](#optimizaciones-y-valor-de-la-plataforma)

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                        CAMPO / FINCA                            │
│                                                                 │
│  ┌──────────────┐     TLS/MQTT     ┌─────────────────────┐     │
│  │   ESP32 Node  │ ─────────────► │   HiveMQ Cloud      │     │
│  │  DHT22        │                 │   (Broker MQTT)     │     │
│  │  DS18B20      │                 └──────────┬──────────┘     │
│  │  Capacitivo   │                            │                │
│  │  ML8511 UV    │                            ▼                │
│  └──────────────┘                 ┌─────────────────────┐     │
└──────────────────────────────────►│   FastAPI Backend   │     │
                                    │   (Render.com)      │     │
                    ┌───────────────┤                     │     │
                    │               │  MQTT Consumer      │     │
                    │               │  LLM Service        │     │
                    │               │  Alert Service      │     │
                    │               │  KPI Engine         │     │
                    │               └──────────┬──────────┘     │
                    │                          │                 │
               WebSocket                 Supabase PostgreSQL     │
               (tiempo real)             + Upstash Redis         │
                    │                          │                 │
                    ▼                          ▼                 │
          ┌─────────────────────────────────────────┐           │
          │          Next.js 15 Frontend            │           │
          │          (Vercel)                        │           │
          │                                         │           │
          │  Dashboard · Sensores · Análisis IA      │           │
          │  Alertas · Fincas · Upgrade              │           │
          └─────────────────────────────────────────┘           │
```

### Flujo de datos completo

1. **Sensor → Nube:** El ESP32 despierta cada 15 min, lee sensores, conecta a WiFi, publica vía MQTT TLS a HiveMQ Cloud y vuelve a deep sleep (consumo ~10µA en reposo)
2. **MQTT → Backend:** El consumer en FastAPI recibe el mensaje, calcula VPD/ETc en tiempo real, persiste en PostgreSQL y evalúa umbrales de alerta
3. **Alerta → Email:** Si hay violación de umbral, verifica cooldown en Redis (30 min) y envía email HTML vía Resend con la acción recomendada
4. **Backend → Frontend:** WebSocket broadcast a todos los clientes conectados para actualización en tiempo real sin polling
5. **Análisis IA:** Fusiona datos de Open-Meteo (pronóstico 7 días), lecturas del sensor y KPIs calculados → prompt estructurado → Claude Haiku → JSON con recomendaciones, plan de riego y nivel de alerta

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
| **IA** | Anthropic Claude Haiku | 4.5 | Costo-eficiente, respuesta rápida, JSON estructurado |
| **Email** | Resend API | — | Alta deliverability, API simple |
| **Frontend** | Next.js 15 + React 19 | 15.0 | App Router, RSC, SSR, Middleware |
| **Auth** | Supabase Auth + SSR | — | JWT ES256, cookies SSR |
| **Estilos** | Tailwind CSS + dark mode | 3.4 | Utility-first, consistencia de diseño |
| **Gráficas** | Recharts | 2.x | Declarativo, SVG, responsive |
| **Deploy Backend** | Render.com | — | Auto-deploy desde GitHub |
| **Deploy Frontend** | Vercel | — | Edge network, preview deployments |
| **CI/CD** | GitHub Actions | — | Lint → Test → Deploy |
| **Observabilidad** | Logfire (Pydantic) | — | Structured logging, tracing |

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
│   │   ├── farm.py          # Finca (id, user_id, nombre, cultivo, área)
│   │   ├── sensor_reading.py # Lecturas (temp, humedad, suelo, UV, VPD)
│   │   ├── analysis.py      # Análisis IA (recomendaciones, KPIs, tokens)
│   │   ├── alert.py         # Alertas (severidad, acción, cooldown)
│   │   └── user.py          # UserProfile (plan, límites mensuales)
│   │
│   ├── routers/
│   │   ├── users.py         # /api/v1/users — perfil, plan, límites
│   │   ├── farms.py         # /api/v1/farms — CRUD + KPIs
│   │   ├── sensors.py       # /api/v1/sensors — lecturas + WebSocket
│   │   ├── analysis.py      # /api/v1/analysis — análisis IA + historial
│   │   ├── alerts.py        # /api/v1/alerts — activas, historial, notify
│   │   └── kpis.py          # /api/v1/kpis — VPD, ETc, riesgo plagas
│   │
│   ├── services/
│   │   ├── llm_service.py   # Claude: farm_analysis, alert_triage, summary
│   │   ├── kpi_service.py   # VPD Magnus, ETc Penman-Monteith, GDD, déficit
│   │   ├── climate_service.py # Open-Meteo API + ET₀ + caché Redis
│   │   ├── alert_service.py # Umbrales → alertas → email con cooldown
│   │   ├── mqtt_service.py  # Consumer HiveMQ (paho-mqtt async bridge)
│   │   └── cache_service.py # Redis wrapper (get/set + graceful fail)
│   │
│   ├── schemas/             # Pydantic v2 (request/response validation)
│   ├── websocket/           # Manager broadcast en tiempo real
│   └── prompts/             # YAML versionados: análisis, triage, summary
│
├── tests/
│   ├── conftest.py          # Fixtures: SQLite in-memory + async session
│   ├── test_api_farms.py
│   ├── test_climate_service.py
│   ├── test_kpi_service.py
│   ├── test_llm_service.py
│   └── test_alert_service.py  # 21 tests con mocks Redis/email
│
└── pyproject.toml           # uv — dependencias + dev tools
```

### Instalación del Backend

```bash
# Prerrequisito: instalar uv
# https://docs.astral.sh/uv/getting-started/installation/

git clone https://github.com/your-org/surqo.git
cd surqo/backend

# Instalar dependencias
uv sync

# Copiar y configurar variables de entorno
cp .env.example .env
# Edita .env con tus credenciales

# Arrancar servidor de desarrollo
uv run fastapi dev app/main.py

# Correr tests
uv run pytest tests/ -v --cov=app

# Linter
uv run ruff check app/
```

### Variables de Entorno — Backend

```env
# Anthropic / LLM
ANTHROPIC_API_KEY=sk-ant-...
LLM_MODEL=claude-haiku-4-5-20251001
LLM_MAX_TOKENS=1024

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

| Variable | Dónde encontrarla |
|----------|------------------|
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) → API Keys |
| `SUPABASE_URL` + `SUPABASE_KEY` | Supabase Dashboard → Settings → API |
| `SUPABASE_JWK_X/Y/KID` | Supabase Dashboard → Settings → API → JWT Settings → JWKS |
| `DATABASE_URL` | Supabase Dashboard → Settings → Database → Session Pooler (IPv4) |
| `REDIS_URL` | [console.upstash.com](https://console.upstash.com) → Redis → Connect |
| `HIVEMQ_HOST/USER/PASS` | [console.hivemq.cloud](https://console.hivemq.cloud) → Cluster Settings |
| `RESEND_API_KEY` | [resend.com](https://resend.com) → API Keys |

### Documentación Automática

Con el backend corriendo:

- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`
- **Health check:** `http://localhost:8000/health`

---

## Frontend

### Estructura

```
frontend/src/
├── app/
│   ├── page.tsx            # Landing page (hero, features, stats)
│   ├── layout.tsx          # Root layout: AuthProvider + NavBar + Footer
│   ├── dashboard/          # Dashboard principal con KPIs y gráficas
│   ├── farms/              # Gestión de fincas (crear, listar, eliminar)
│   ├── sensors/            # Lecturas en tiempo real (WebSocket)
│   ├── analyze/            # Análisis IA (solo plan Pro)
│   ├── alerts/             # Centro de alertas activas e historial
│   ├── login/              # Inicio de sesión con email/contraseña
│   ├── register/           # Registro de nueva cuenta
│   └── upgrade/            # Comparativa de planes Free vs Pro
│
├── components/
│   ├── NavBar.tsx          # Barra fija: navegación + usuario + badge plan
│   ├── AuthProvider.tsx    # Contexto React: session, isPaid, planLimits
│   ├── KPICard.tsx         # Tarjeta de métrica (VPD, ETc, humedad)
│   ├── SensorChart.tsx     # Gráfica temporal (Recharts)
│   ├── LiveFeed.tsx        # Feed WebSocket en tiempo real
│   ├── AnalysisResult.tsx  # Resultado análisis IA con recomendaciones
│   ├── AlertBadge.tsx      # Badge de severidad (ok / warning / critical)
│   ├── ThemeProvider.tsx   # Dark/light mode (next-themes)
│   └── ui/Primitives.tsx   # Button, Card — sistema de diseño base
│
├── lib/
│   ├── api.ts              # Cliente HTTP: todos los endpoints con auth JWT
│   ├── auth.ts             # Helpers: getSession, getAccessToken, signOut
│   ├── supabase.ts         # createBrowserClient (SSR-compatible con cookies)
│   ├── websocket.ts        # WebSocket manager (live feed)
│   └── utils.ts            # cn(), formatters
│
├── types/index.ts          # Farm, SensorReading, Alert, Analysis, KPIs
└── middleware.ts           # Protección SSR de rutas (cookies Supabase)
```

### Instalación del Frontend

```bash
cd surqo/frontend

npm install

# Variables de entorno
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
NEXT_PUBLIC_DEMO_FARM_ID=uuid-de-tu-finca
EOF

# Desarrollo
npm run dev

# Build producción
npm run build && npm start
```

### Páginas y funcionalidades

| Ruta | Acceso | Descripción |
|------|--------|-------------|
| `/` | Público | Landing page con propuesta de valor |
| `/login` | Solo no-auth | Inicio de sesión (redirige a `/dashboard`) |
| `/register` | Solo no-auth | Registro gratuito — plan Free automático |
| `/dashboard` | Autenticado | KPIs en tiempo real, gráficas, feed live |
| `/farms` | Autenticado | Gestión de fincas (límite 3 en Free, ilimitadas en Pro) |
| `/sensors` | Autenticado | Lecturas de sensores, timeseries, WebSocket |
| `/alerts` | Autenticado | Alertas activas e historial |
| `/analyze` | **Solo Pro** | Análisis IA completo con Claude — plan de acción |
| `/upgrade` | Autenticado | Comparativa Free vs Pro, CTA de contacto |

---

## Firmware

### Hardware por nodo (~$15 USD)

| Componente | Función | Precio |
|-----------|---------|--------|
| ESP32 WROOM-32 | Microcontrolador + WiFi | $4 USD |
| DHT22 | Temperatura y humedad del aire | $2 USD |
| DS18B20 (impermeable) | Temperatura del suelo | $2 USD |
| Sensor capacitivo suelo | Humedad volumétrica del suelo | $1.5 USD |
| ML8511 | Índice UV | $2 USD |
| Batería LiPo 2000mAh | Autonomía ~2 semanas | $4 USD |

### Conexiones GPIO

```
ESP32 GPIO4  → DHT22 DATA
ESP32 GPIO5  → DS18B20 DATA (OneWire + resistencia 4.7kΩ a 3.3V)
ESP32 GPIO32 → Sensor suelo capacitivo AOUT
ESP32 GPIO34 → ML8511 UV OUT
ESP32 GPIO35 → Divisor de voltaje batería
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
Despertar (timer RTC) → Inicializar sensores → Conectar WiFi
  → Sincronizar NTP → Leer DHT22 + DS18B20 + suelo + UV + batería
  → Calcular VPD local → Publicar JSON MQTT TLS
  → Deep sleep 15 min (10µA consumo)

Fallback: si MQTT falla → HTTP POST al backend → deep sleep
```

---

## API Reference

### Autenticación

Todos los endpoints protegidos requieren header:
```
Authorization: Bearer <jwt-token-de-supabase>
```

El token se obtiene automáticamente desde `supabase.auth.getSession()` en el cliente.

### Endpoints

#### Usuarios
```
GET    /api/v1/users/me                 → Perfil del usuario autenticado
PATCH  /api/v1/users/me                 → Actualizar perfil (nombre, email)
GET    /api/v1/users/me/plan-limits     → Límites y uso del plan actual
PATCH  /api/v1/users/{id}/plan          → Cambiar plan (solo admin is_admin=true)
```

#### Fincas
```
POST   /api/v1/farms/                   → Crear finca (→ 402 si Free y ya tiene 3)
GET    /api/v1/farms/                   → Listar fincas del usuario autenticado
GET    /api/v1/farms/{id}               → Detalle de finca (solo owner)
PATCH  /api/v1/farms/{id}               → Actualizar finca
DELETE /api/v1/farms/{id}               → Eliminar finca
GET    /api/v1/farms/{id}/kpis          → KPIs calculados de la finca
```

#### Sensores
```
POST   /api/v1/sensors/reading              → Ingresar lectura (ESP32 / MQTT)
GET    /api/v1/sensors/latest/{device_id}   → Última lectura del dispositivo
GET    /api/v1/sensors/timeseries/{farm_id}?hours=24&metric=soil_moisture_pct
GET    /api/v1/sensors/stats/{farm_id}      → Min, max, promedio por métrica
WS     /api/v1/sensors/ws/live/{farm_id}    → Stream WebSocket tiempo real
```

#### Análisis IA
```
POST   /api/v1/analysis/analyze              → Ejecutar análisis (→ 402 si Free)
GET    /api/v1/analysis/history/{farm_id}    → Historial de análisis
GET    /api/v1/analysis/{id}                 → Detalle de análisis
POST   /api/v1/analysis/evaluate-prompts     → A/B test de prompts (LLM-as-judge)
```

#### Alertas
```
GET    /api/v1/alerts/active                 → Alertas activas (filtrar por farm_id)
GET    /api/v1/alerts/history                → Historial completo
PATCH  /api/v1/alerts/{id}/resolve           → Marcar como resuelta
POST   /api/v1/alerts/{id}/notify            → Reenviar notificación email
```

#### KPIs
```
GET    /api/v1/kpis/farm/{id}                → VPD, ETc, GDD, déficit hídrico
GET    /api/v1/kpis/farm/{id}/vpd-history    → Serie histórica de VPD
GET    /api/v1/kpis/farm/{id}/water-balance  → Balance hídrico 7 días
GET    /api/v1/kpis/farm/{id}/pest-risk      → Índice de riesgo de plagas
```

### Ejemplo — Análisis IA

**Request:**
```json
POST /api/v1/analysis/analyze
Authorization: Bearer eyJ...

{
  "farm_name": "Finca La Esperanza",
  "lat": 8.7575,
  "lon": -75.8891,
  "crop_type": "maíz",
  "farm_id": "uuid-finca",
  "alert_email": "agricultor@ejemplo.com"
}
```

**Response:**
```json
{
  "id": "uuid",
  "alert_level": "warning",
  "water_stress_index": 0.67,
  "irrigation_needed": true,
  "irrigation_amount_mm": 25.0,
  "next_irrigation_date": "2026-05-17",
  "recommendations": [
    "Aplicar riego por goteo en las próximas 24h",
    "VPD alto (1.8 kPa): monitorear turgor foliar",
    "Riesgo moderado de trips por baja humedad relativa"
  ],
  "summary_for_farmer": "Tu cultivo de maíz muestra estrés hídrico moderado. El pronóstico indica sin lluvia por 5 días...",
  "tokens_used": 847,
  "cost_usd": 0.00021
}
```

---

## Autenticación y Planes

### Flujo de autenticación

```
Browser                 Supabase Auth           FastAPI Backend
   │                         │                        │
   │─ signInWithPassword() ─►│                        │
   │◄─ JWT (ES256) ──────────│                        │
   │                         │                        │
   │─ GET /api/v1/farms/ ─────────────────────────►  │
   │  Authorization: Bearer <jwt>                     │
   │                         │     ECAlgorithm.from_jwk()
   │                         │     → decode ES256     │
   │                         │     → get/create       │
   │                         │       UserProfile      │
   │◄─ [fincas del usuario] ──────────────────────── │
```

- **Algoritmo JWT:** ES256 (curva elíptica P-256) — clave pública de la JWKS de Supabase
- **Perfil automático:** El primer request con JWT válido crea el `UserProfile` en la DB — sin registro separado en el backend
- **SSR:** El middleware de Next.js usa `@supabase/ssr` + cookies para proteger rutas en el servidor antes de renderizar
- **Sincronización:** `createBrowserClient` (no `createClient`) garantiza que la sesión se guarde en cookies Y localStorage

### Planes

| Feature | Free | Pro |
|---------|:----:|:---:|
| Fincas registradas | 3 máximo | Ilimitadas |
| Sensores tiempo real | ✓ | ✓ |
| Historial de datos | ✓ | ✓ |
| Alertas básicas | ✓ | ✓ |
| Email alertas / mes | 10 | Ilimitadas |
| Análisis IA con Claude | ✗ | ✓ |
| Soporte prioritario | ✗ | ✓ |

**Gestión de plan actual:** El admin cambia el plan via `PATCH /api/v1/users/{id}/plan` con `{"plan": "paid"}`. Arquitectura lista para Stripe Checkout — solo se necesita conectar el webhook al mismo endpoint.

### Row Level Security

Todas las tablas tienen RLS activado. El backend usa `service_role` (bypasea RLS). Los usuarios con `anon key` solo pueden ver sus propios datos:

```sql
-- Políticas aplicadas en Supabase SQL Editor
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "farms: owner only" ON public.farms
  FOR ALL USING (user_id = auth.uid());

-- Igual para: user_profiles, sensor_readings, analyses, alerts
```

---

## CI/CD

### Pipeline GitHub Actions (`.github/workflows/ci-cd.yml`)

```
push a main / PR a main
        │
        ▼
   ┌─────────┐
   │  test   │  Python 3.11, Ubuntu
   │         │  → uv sync
   │         │  → ruff check (linting)
   │         │  → pytest --cov (SQLite in-memory)
   └────┬────┘
        │ success
   ┌────┴──────────────────┐
   │                       │
   ▼                       ▼
┌──────────────┐    ┌───────────────┐
│deploy-backend│    │deploy-frontend│
│ Render hook  │    │ Vercel --prod  │
└──────────────┘    └───────────────┘
        │                  │
        └────────┬──────────┘
                 ▼
         ┌──────────────┐
         │notify-deploy │  Step summary con resultado
         └──────────────┘
```

### Secrets requeridos en GitHub

```
ANTHROPIC_API_KEY      SUPABASE_URL          SUPABASE_KEY
SUPABASE_JWK_X         SUPABASE_JWK_Y        SUPABASE_JWK_KID
RESEND_API_KEY         LOGFIRE_TOKEN
RENDER_DEPLOY_HOOK     VERCEL_TOKEN          VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

---

## Lo que se logró construir

Este proyecto fue desarrollado en **7 días** cubriendo el stack completo de una plataforma SaaS IoT + IA:

### Resumen por día

| Día | Foco | Entregable |
|-----|------|-----------|
| 1 | Fundamentos | FastAPI + SQLAlchemy async + modelos de dominio (Farm, Sensor, Analysis, Alert) |
| 2 | Datos y Clima | Open-Meteo API, VPD (Magnus), ETc (Penman-Monteith), GDD, cache Redis |
| 3 | IA | Claude Haiku, prompts YAML versionados, A/B testing con LLM-as-judge |
| 4 | IoT + Tiempo Real | Consumer MQTT asíncrono, WebSocket broadcast, firmware ESP32 deep sleep |
| 5 | Frontend | Next.js 15, dashboard, gráficas Recharts, diseño dark mode custom |
| 6 | Alertas Email | Sistema de alertas con cooldown Redis, emails HTML vía Resend, 21 tests |
| 7 | Auth + Planes | Supabase Auth ES256, plan Free/Pro, login/register/paywall, RLS |

### Métricas del proyecto

| Métrica | Valor |
|---------|-------|
| Archivos Python (backend) | ~50 |
| Archivos TypeScript/TSX (frontend) | ~30 |
| Endpoints API REST | 28 |
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

**Seguridad:**
- **JWT ES256** — clave pública EC, imposible falsificar sin la clave privada de Supabase
- **Row Level Security** — acceso directo a PostgREST bloqueado por usuario en Postgres
- **Cooldown de alertas** — Redis previene spam de emails (30 min entre alertas por finca)
- **MQTT TLS puerto 8883** — tráfico del campo a la nube cifrado end-to-end

**Calidad de código:**
- **Prompts YAML versionados** — se actualizan sin tocar el código, trazables en git
- **Pydantic v2 estricto** — validación de entrada/salida en todos los endpoints
- **ruff linting** — cero warnings en CI antes de cada deploy

### Roadmap de optimizaciones

**Corto plazo (1-2 semanas):**
- Integrar Stripe Checkout — la API de admin ya está lista, solo falta el webhook
- Alembic migrations formales en lugar de `create_all` en startup
- Tests de integración con `httpx.AsyncClient` para endpoints autenticados
- Rate limiting por usuario en análisis IA (evitar abuso del plan Pro)

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

### Valor de la plataforma

**Para el agricultor:**
- Reducción estimada 20-35% en consumo de agua con riego basado en VPD/ETc real
- Detección temprana de estrés hídrico y plagas antes de que sean visibles
- Recomendaciones en lenguaje natural — sin conocimientos técnicos requeridos
- Monitoreo 24/7 desde cualquier dispositivo

**Como producto SaaS:**

| Plan | Precio estimado | Mercado |
|------|----------------|---------|
| Free | $0 | Agricultores pequeños, validación de mercado |
| Pro | $15–25 USD/mes | Fincas medianas, cooperativas |
| Enterprise | $200+ USD/mes | Agroindustria, grandes extensiones |

**Infraestructura gratuita hasta ~1.000 usuarios activos:**
- Render.com Free tier — backend
- Vercel Hobby — frontend
- Supabase Free — PostgreSQL + Auth (500MB)
- Upstash Redis — 10.000 req/día gratis
- HiveMQ Cloud Free — 100 conexiones MQTT
- Resend Free — 3.000 emails/mes

**Mercado objetivo:**
- Colombia tiene **4.9 millones** de unidades productivas agropecuarias (DANE 2022)
- Solo el **2.3%** usa tecnología de precisión — mercado prácticamente virgen
- Financiamiento disponible: MinAgricultura, FINAGRO, programas de digitalización rural

**Diferenciadores competitivos:**
1. **Precio del nodo** — $15 USD vs $200–500 USD de competidores internacionales (John Deere, Trimble)
2. **IA contextualizada** — prompts entrenados para el trópico colombiano, no genéricos
3. **Resiliencia offline** — ESP32 con deep sleep y fallback HTTP, funciona sin red estable
4. **Stack serverless** — costo de infraestructura casi $0 hasta escala real
5. **Open source** — comunidad puede adaptar el firmware a cultivos específicos

---

## Contribución

```bash
# 1. Fork y clona
git checkout -b feature/mi-feature

# 2. Desarrolla
uv run pytest tests/ -v          # Todos los tests deben pasar
uv run ruff check app/            # Sin errores de linting

# 3. Commit semántico
git commit -m "feat: descripción de la feature"

# 4. Pull Request a main
```

---

## Licencia

MIT License — libre para uso personal y comercial con atribución.

---

## Autor

**Ricardo Martínez** — Junior Developer & AI Analyst  
Proyecto desarrollado como plataforma completa IoT + IA + SaaS para el sector agrícola colombiano.

*"Del surco al insight."*
