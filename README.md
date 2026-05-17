# SURQO — Inteligencia Agroclimática

> Plataforma IoT + IA para el campo colombiano. Del sensor al insight en segundos.

[![Backend CI](https://github.com/ricardomb-tech/surqo/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/ricardomb-tech/surqo/actions)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python)](https://python.org)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=nextdotjs)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)](https://fastapi.tiangolo.com)

---

## ¿Qué es Surqo?

Surqo es una plataforma agroclimática de precisión que conecta sensores físicos instalados en fincas con modelos de inteligencia artificial para generar recomendaciones agronómicas en tiempo real. El nombre viene de *surco* — la línea que traza el arado en la tierra — representando la fusión entre la agricultura tradicional colombiana y la tecnología de vanguardia.

**Problema que resuelve:** El 85% de los agricultores en Colombia toman decisiones de riego, fertilización y cosecha basadas en experiencia visual, sin datos objetivos. Las pérdidas por estrés hídrico, plagas y heladas ascienden a millones de pesos por cosecha que podrían evitarse con monitoreo continuo.

**Solución:** Nodos IoT de bajo costo (ESP32, ~$15 USD) conectados a una nube inteligente que analiza microclima, calcula índices agronómicos y usa Claude AI para generar planes de acción específicos para cada cultivo en el trópico colombiano.

---

## 🚀 API en Producción

> **Base URL:** `https://surqo.onrender.com`

| Recurso | URL |
|---------|-----|
| 📖 **Documentación interactiva (Swagger)** | [https://surqo.onrender.com/docs](https://surqo.onrender.com/docs) |
| 📘 **Documentación alternativa (ReDoc)** | [https://surqo.onrender.com/redoc](https://surqo.onrender.com/redoc) |
| ✅ **Health check** | [https://surqo.onrender.com/health](https://surqo.onrender.com/health) |

> ⏳ **Nota importante:** El backend está desplegado en el plan gratuito de Render. Si el servicio lleva más de 15 minutos inactivo, entrará en modo de suspensión automática. La **primera solicitud puede tardar entre 30 y 60 segundos** mientras el servidor vuelve a arrancar. Las solicitudes siguientes responden normalmente. Por favor espera unos instantes y recarga si el sitio no carga de inmediato.

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

git clone https://github.com/ricardomb-tech/surqo.git
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

> 📖 Documentación interactiva en vivo: **[https://surqo.onrender.com/docs](https://surqo.onrender.com/docs)**
>
> ⏳ Si es la primera carga del día, espera ~30s a que Render despierte el servidor.

---

### Autenticación

Todos los endpoints protegidos requieren el siguiente header HTTP:

```
Authorization: Bearer <jwt-token-de-supabase>
```

El token JWT es emitido por **Supabase Auth** con algoritmo **ES256** (curva elíptica P-256). El backend lo valida contra la clave pública JWKS de tu proyecto Supabase. En el frontend, el token se obtiene automáticamente con `supabase.auth.getSession()`.

---

### `GET /health`

Verifica que el servidor y la base de datos están operativos.

**Acceso:** Público — sin autenticación

**Respuesta exitosa `200`:**
```json
{
  "status": "ok",
  "db": "ok",
  "env": "production"
}
```

**Uso típico:** Health check de Render / monitoreo de uptime.

---

### Fincas — `/api/v1/farms`

Gestiona las fincas del usuario. Cada finca representa una unidad productiva con ubicación geográfica, tipo de cultivo y área.

---

#### `POST /api/v1/farms/`

Registra una nueva finca asociada al usuario autenticado.

**Acceso:** Autenticado · Plan Free: máximo 3 fincas (→ `402 Payment Required` al exceder)

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

---

#### `GET /api/v1/farms/`

Lista todas las fincas registradas por el usuario autenticado.

**Acceso:** Autenticado

**Respuesta `200`:** Array de objetos `Farm` (mismo schema que POST).

---

#### `GET /api/v1/farms/{farm_id}`

Retorna el detalle completo de una finca específica.

**Acceso:** Autenticado · Solo el propietario puede ver sus fincas (→ `403` si otro usuario intenta acceder)

**Parámetros de ruta:**
- `farm_id` — UUID de la finca

---

#### `PATCH /api/v1/farms/{farm_id}`

Actualiza uno o más campos de una finca existente.

**Acceso:** Autenticado · Solo propietario

**Body (todos los campos son opcionales):**
```json
{
  "name": "Nuevo nombre",
  "crop_type": "yuca",
  "area_hectares": 15.0,
  "alert_email": "nuevo@email.com"
}
```

---

#### `DELETE /api/v1/farms/{farm_id}`

Elimina una finca y todos sus datos asociados (lecturas, análisis, alertas).

**Acceso:** Autenticado · Solo propietario

**Respuesta `204`:** Sin cuerpo.

---

#### `GET /api/v1/farms/{farm_id}/kpis`

Calcula y retorna los KPIs agronómicos de la finca basados en las lecturas de las últimas 24 horas.

**Acceso:** Autenticado

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

**KPIs incluidos:**

| Campo | Descripción | Unidad |
|-------|-------------|--------|
| `vpd_kpa` | Déficit de presión de vapor — calculado con ecuación de Magnus. >1.6 kPa indica estrés hídrico | kPa |
| `avg_air_temp_c` | Temperatura promedio del aire en las últimas 24h | °C |
| `avg_humidity_pct` | Humedad relativa promedio del aire | % |
| `avg_soil_moisture_pct` | Humedad volumétrica promedio del suelo | % |
| `soil_health_score` | Score compuesto 0-100 basado en humedad, temperatura y conductividad del suelo | puntos |
| `pest_risk.risk_pct` | Probabilidad de infección fúngica según condiciones actuales y tipo de cultivo | % |

---

### Sensores — `/api/v1/sensors`

Gestiona las lecturas de los nodos ESP32. Soporta ingesta por HTTP (directo) y por MQTT (consumer interno), además de consultas históricas y streaming en tiempo real.

---

#### `POST /api/v1/sensors/readings`

Registra una lectura de sensor. Usada directamente por el ESP32 como fallback cuando MQTT no está disponible, o por el consumer MQTT interno al procesar mensajes de HiveMQ.

**Acceso:** Público (el ESP32 no tiene JWT — la finca se identifica por `farm_id`)

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

**Respuesta `201`:** La lectura guardada, incluyendo `vpd_kpa` calculado automáticamente en el backend.

---

#### `GET /api/v1/sensors/timeseries/{farm_id}`

Retorna la serie temporal de una métrica específica para graficar en el dashboard.

**Acceso:** Autenticado

**Parámetros de consulta:**

| Parámetro | Tipo | Defecto | Descripción |
|-----------|------|---------|-------------|
| `hours` | int | 24 | Ventana de tiempo hacia atrás (máx 168 = 7 días) |
| `metric` | string | `soil_moisture_pct` | Métrica a consultar |

**Métricas disponibles:** `soil_moisture_pct`, `soil_temp_c`, `air_temp_c`, `air_humidity_pct`, `vpd_kpa`, `uv_index`

**Respuesta `200`:**
```json
[
  { "timestamp": "2026-05-17T00:00:00Z", "value": 43.2 },
  { "timestamp": "2026-05-17T00:15:00Z", "value": 43.8 },
  ...
]
```

---

#### `WebSocket /api/v1/sensors/ws/live/{farm_id}`

Stream en tiempo real de las lecturas del sensor. Se conecta usando el protocolo WebSocket (`wss://` en producción).

**Acceso:** Sin autenticación (el `farm_id` actúa como scope)

**Protocolo:**
- El cliente se conecta y espera mensajes JSON
- Cada vez que el consumer MQTT procesa una lectura de esa finca, el backend hace broadcast a todos los clientes conectados
- El servidor envía `ping` cada 30s para mantener la conexión viva

**Mensaje recibido:**
```json
{
  "device_id": "ESP32-CAMPO-001",
  "farm_id": "310f2f64-...",
  "soil_moisture_pct": 44.5,
  "soil_temp_c": 27.8,
  "air_temp_c": 31.2,
  "air_humidity_pct": 70.1,
  "vpd_kpa": 1.24,
  "uv_index": 7.4,
  "battery_mv": 3820,
  "created_at": "2026-05-17T14:32:00Z"
}
```

**Ejemplo de conexión (JavaScript):**
```javascript
const ws = new WebSocket('wss://surqo.onrender.com/api/v1/sensors/ws/live/FARM_ID')
ws.onmessage = (event) => {
  const reading = JSON.parse(event.data)
  console.log('Humedad suelo:', reading.soil_moisture_pct)
}
```

---

### Análisis IA — `/api/v1/analysis`

Utiliza **Claude Haiku** de Anthropic para generar un análisis agronómico completo fusionando datos del sensor, pronóstico climático de 7 días (Open-Meteo) y KPIs calculados.

---

#### `POST /api/v1/analysis/analyze`

Ejecuta un análisis completo de la finca con inteligencia artificial. El proceso toma ~2-4 segundos.

**Acceso:** Autenticado · **Solo plan Pro** (→ `402 Payment Required` en plan Free)

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
    },
    {
      "action": "Revisar hojas por síntomas de trips",
      "time_window": "24-48h",
      "justification": "Humedad baja favorece infestación de trips en maíz",
      "category": "pest_control",
      "priority": 2
    }
  ],
  "model_used": "claude-haiku-4-5-20251001",
  "input_tokens": 624,
  "output_tokens": 318,
  "cost_usd": 0.00019,
  "created_at": "2026-05-17T14:35:00Z"
}
```

**Niveles de alerta (`alert_level`):**

| Valor | Significado |
|-------|-------------|
| `ok` | Condiciones óptimas — sin acción urgente |
| `warning` | Estrés detectado — acción recomendada en 24-48h |
| `critical` | Condición crítica — acción inmediata necesaria |

---

#### `GET /api/v1/analysis/history/{farm_id}`

Retorna el historial de análisis ejecutados para una finca, ordenados del más reciente al más antiguo.

**Acceso:** Autenticado · Solo propietario

**Respuesta `200`:** Array de objetos `Analysis` (misma estructura que el POST anterior).

---

#### `GET /api/v1/analysis/{analysis_id}`

Retorna el detalle completo de un análisis específico por su ID.

**Acceso:** Autenticado · Solo propietario de la finca asociada

---

### Alertas — `/api/v1/alerts`

Sistema de alertas automáticas. Las alertas son generadas por el backend cuando las lecturas de los sensores superan umbrales predefinidos (VPD > 1.6 kPa, suelo < 25%, temperatura > 38°C). Incluye cooldown de 30 minutos para evitar spam de notificaciones.

---

#### `GET /api/v1/alerts/active`

Retorna todas las alertas activas (no resueltas) de las fincas del usuario.

**Acceso:** Autenticado

**Parámetros de consulta:**

| Parámetro | Descripción |
|-----------|-------------|
| `farm_id` | (opcional) Filtrar por finca específica |

**Respuesta `200`:**
```json
[
  {
    "id": "uuid-alerta",
    "farm_id": "uuid-finca",
    "title": "VPD crítico — Estrés hídrico severo",
    "description": "El VPD alcanzó 2.1 kPa, superando el umbral crítico de 2.0 kPa para maíz en etapa de llenado de grano.",
    "severity": "critical",
    "recommended_action": "Aplicar riego inmediato — mínimo 30mm en las próximas 2 horas.",
    "is_resolved": false,
    "created_at": "2026-05-17T12:00:00Z"
  }
]
```

**Niveles de severidad:**

| `severity` | Color | Descripción |
|-----------|-------|-------------|
| `info` | 🔵 Azul | Información relevante — sin urgencia |
| `warning` | 🟡 Amarillo | Condición anómala — monitorear |
| `critical` | 🔴 Rojo | Acción inmediata requerida |

---

#### `GET /api/v1/alerts/history`

Retorna el historial completo de alertas (activas y resueltas) del usuario.

**Acceso:** Autenticado

---

#### `PATCH /api/v1/alerts/{alert_id}/resolve`

Marca una alerta como resuelta. Una alerta resuelta no genera nuevas notificaciones.

**Acceso:** Autenticado · Solo propietario de la finca

**Respuesta `200`:** La alerta actualizada con `is_resolved: true`.

---

### KPIs — `/api/v1/kpis`

Cálculo de índices agronómicos derivados usando ecuaciones científicas estándar. Los valores son recalculados en tiempo real a partir de las lecturas almacenadas.

---

#### `GET /api/v1/kpis/farm/{farm_id}`

Retorna todos los KPIs calculados para la finca basándose en las lecturas de las últimas 24 horas.

**Acceso:** Autenticado

**KPIs calculados y sus fórmulas:**

| KPI | Fórmula | Interpretación |
|-----|---------|----------------|
| **VPD** (kPa) | `es - ea` donde `es = 0.6108 × e^(17.27T / (T+237.3))` (Magnus) | < 0.8 óptimo · 0.8-1.6 aceptable · > 1.6 estrés · > 2.5 crítico |
| **ETc** (mm/día) | `ET₀ × Kc` (coeficiente por cultivo) | Agua que el cultivo consume por día |
| **GDD** (°días) | `(Tmax + Tmin)/2 − Tbase` | Acumulación de calor para desarrollo del cultivo |
| **Déficit hídrico** (mm) | `ETc_7d − lluvia_7d` (solo si > 0) | Agua que le falta al cultivo en la semana |
| **Score suelo** (0-100) | Compuesto: 40 pts humedad + 30 pts temp. + 30 pts CE | > 70 saludable · 50-70 aceptable · < 50 crítico |
| **Riesgo plagas** (%) | Modelo por temp + humedad + cultivo | < 40 bajo · 40-70 moderado · > 70 alto |

**Coeficientes Kc por cultivo:**

| Cultivo | Kc |
|---------|-----|
| Maíz | 1.15 |
| Arroz | 1.20 |
| Plátano | 1.10 |
| Café | 0.95 |
| Yuca | 0.85 |
| Algodón | 1.05 |

---

### Ejemplo completo — Flujo de integración

```bash
# 1. Crear una finca
curl -X POST https://surqo.onrender.com/api/v1/farms/ \
  -H "Authorization: Bearer TU_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mi Finca",
    "crop_type": "maíz",
    "latitude": 8.7575,
    "longitude": -75.8891,
    "area_hectares": 10,
    "alert_email": "yo@ejemplo.com"
  }'

# 2. Enviar una lectura de sensor (desde ESP32 o para pruebas)
curl -X POST https://surqo.onrender.com/api/v1/sensors/readings \
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
curl https://surqo.onrender.com/api/v1/farms/FARM_ID/kpis \
  -H "Authorization: Bearer TU_JWT"

# 4. Ver alertas activas
curl https://surqo.onrender.com/api/v1/alerts/active?farm_id=FARM_ID \
  -H "Authorization: Bearer TU_JWT"
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
