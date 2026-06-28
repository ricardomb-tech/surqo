# SURQO — Documentación Completa del Proyecto

> Versión: 1.0 | Fecha: 2026-06-28 | Autor: Ricardo Martinez

---

## Tabla de Contenidos

1. [Visión General del Producto](#1-visión-general-del-producto)
2. [El Problema](#2-el-problema)
3. [La Solución](#3-la-solución)
4. [Usuarios Objetivo](#4-usuarios-objetivo)
5. [Requisitos del Producto (PRD)](#5-requisitos-del-producto-prd)
6. [Arquitectura del Sistema](#6-arquitectura-del-sistema)
7. [Stack Tecnológico](#7-stack-tecnológico)
8. [Estructura del Proyecto](#8-estructura-del-proyecto)
9. [Base de Datos](#9-base-de-datos)
10. [API Reference](#10-api-reference)
11. [Autenticación y Seguridad](#11-autenticación-y-seguridad)
12. [Hardware (IoT)](#12-hardware-iot)
13. [Inteligencia Artificial](#13-inteligencia-artificial)
14. [Servicios Externos](#14-servicios-externos)
15. [Frontend — Páginas y Flujos](#15-frontend--páginas-y-flujos)
16. [Modelo de Negocio](#16-modelo-de-negocio)
17. [Despliegue y CI/CD](#17-despliegue-y-cicd)
18. [Costos de Operación](#18-costos-de-operación)
19. [Seguridad](#19-seguridad)
20. [Métricas del Proyecto](#20-métricas-del-proyecto)
21. [Roadmap](#21-roadmap)

---

## 1. Visión General del Producto

**Surqo** es una plataforma SaaS de agricultura de precisión diseñada para pequeños y medianos agricultores colombianos. Combina sensores IoT de bajo costo (ESP32) con inteligencia artificial para transformar datos del campo en decisiones accionables — sin que el agricultor necesite interpretar tablas ni reportes complejos.

### Propuesta de Valor

> "Conectas tu sensor, la IA analiza tu campo, tú decides con datos."

- **Para el agricultor:** Saber cuándo regar, cuándo fumigar y cuándo cosechar — desde el celular.
- **Para el campo:** Reducción de pérdidas por estrés hídrico y plagas.
- **Para Colombia:** Una solución construida localmente para los cultivos colombianos (maíz, café, plátano, yuca, arroz, algodón).

---

## 2. El Problema

Los agricultores colombianos toman decisiones críticas de forma "a ojo": cuándo regar, cuándo fertilizar, cuándo alertar por una plaga. Esto genera:

| Problema | Impacto |
|----------|---------|
| Riego inadecuado | Pérdida del 20–40% de cosechas por estrés hídrico |
| Detección tardía de plagas | Daños irreversibles antes de actuar |
| Sin datos históricos | Imposible aprender de temporadas anteriores |
| Soluciones existentes costosas | Equipos profesionales de $3,000–$50,000 USD fuera del alcance |
| Conectividad limitada en campo | WiFi o celular deficiente en zonas rurales |

---

## 3. La Solución

Surqo resuelve esto con tres componentes:

### 3.1 Hardware — Nodo Sensor ESP32

- Microcontrolador ESP32 WROOM-32 (~$8 USD)
- Sensores: temperatura/humedad aire (DHT22), temperatura suelo (DS18B20), humedad suelo capacitiva, UV (ML8511), batería
- Comunicación: WiFi + MQTT sobre TLS (HiveMQ Cloud)
- Autonomía: ~2 semanas con batería 2000mAh (modo deep sleep: 10µA en reposo)
- Lecturas cada 15 minutos

### 3.2 Backend — API + Procesamiento

- Recibe, valida y almacena lecturas del sensor
- Calcula KPIs agronómicos científicos (VPD, ETc Penman-Monteith, GDD, riesgo de plagas)
- Integra pronóstico del clima (Open-Meteo API, 7 días)
- Genera análisis de IA bajo demanda (Groq Llama 3.3 70B + Anthropic Claude como fallback)
- Envía alertas automáticas por email cuando hay condiciones críticas

### 3.3 Frontend — Dashboard Web

- Panel en tiempo real con WebSocket (sin polling)
- KPIs visuales, gráficos de series de tiempo, alertas
- Análisis IA con recomendaciones en lenguaje natural (español)
- Acceso desde cualquier dispositivo (responsive)

---

## 4. Usuarios Objetivo

### Perfil Principal — Agricultor Colombiano

| Atributo | Descripción |
|----------|-------------|
| Edad | 30–60 años |
| Tamaño de finca | 1–50 hectáreas |
| Cultivos | Maíz, café, plátano, yuca, arroz, algodón |
| Conectividad | WiFi básico en casa, celular en campo |
| Tecnología | Usa WhatsApp, sabe tomar fotos |
| Pain principal | Pérdidas por clima inesperado y plagas |

### Perfil Secundario — Agroindustria / Cooperativa

- Múltiples fincas bajo administración centralizada
- Necesita reportes comparativos y alertas grupales
- Dispuesto a pagar más (Enterprise tier)

### Perfil Terciario — Agrónomo / Consultor

- Usa Surqo como herramienta de monitoreo para clientes
- Necesita exportación de datos y análisis histórico

---

## 5. Requisitos del Producto (PRD)

### 5.1 Funcionalidades por Tier

#### Plan Free (gratuito)

- [x] Registro con email y contraseña
- [x] 1 finca activa
- [x] Monitoreo en tiempo real (WebSocket)
- [x] KPIs básicos (VPD, humedad suelo, temperatura)
- [x] Historial de lecturas (últimas 24h en dashboard)
- [x] Alertas automáticas (máximo 10 emails/mes)
- [ ] Análisis IA — bloqueado (HTTP 402)
- [ ] Múltiples fincas — bloqueado (HTTP 402)

#### Plan Pro ($15–25 USD/mes)

- [x] Todo lo del plan Free
- [x] Fincas ilimitadas
- [x] Análisis IA completo (recomendaciones, índice de estrés hídrico, plan de riego)
- [x] Emails ilimitados
- [x] ETc Penman-Monteith (evapotranspiración real)
- [x] GDD (grados-día de crecimiento)
- [x] Predicción de riesgo de plagas

#### Plan Enterprise (precio negociado)

- [ ] Multi-usuario por organización (en roadmap)
- [ ] API directa para integración ERP
- [ ] Reportes PDF automatizados
- [ ] SLA con soporte técnico

### 5.2 Requisitos No Funcionales

| Requisito | Target |
|-----------|--------|
| Latencia API | < 200ms para lecturas, < 2s para análisis IA |
| Disponibilidad | 99.5% uptime (sin cold starts en Fly.io) |
| Retención de datos | 90 días de lecturas de sensores (auto-delete policy) |
| Seguridad datos | Row-Level Security PostgreSQL (usuarios aislados) |
| Escalabilidad | 500 usuarios con stack actual sin cambios de infraestructura |
| Soporte móvil | Diseño responsive, primera prioridad celular |
| Idioma | Español (Colombia) |

### 5.3 Criterios de Aceptación por Feature

#### Feature: Monitoreo en tiempo real

- **Dado** que el sensor publica una lectura MQTT
- **Cuando** llega al backend via HiveMQ
- **Entonces** se almacena en DB y se transmite por WebSocket a todos los clientes del farm_id en < 500ms

#### Feature: Análisis IA

- **Dado** que un usuario Pro solicita análisis
- **Cuando** el backend llama al LLM con contexto de las últimas 24h de lecturas + pronóstico del clima
- **Entonces** retorna: nivel de alerta (0-5), índice de estrés hídrico (0-1), si se requiere riego (bool), lista de recomendaciones priorizadas, y el costo en USD del llamado

#### Feature: Alertas automáticas

- **Dado** que llega una lectura con condición crítica (ej. humedad suelo < 20% o temp > 35°C)
- **Cuando** no se ha enviado alerta del mismo tipo en las últimas 30 minutos (cooldown Redis)
- **Entonces** se crea alerta en DB y se envía email al usuario (si tiene emails disponibles en su plan)

#### Feature: Control de plan

- **Dado** que un usuario Free intenta crear una segunda finca
- **Cuando** el backend detecta que ya tiene 1 finca activa
- **Entonces** retorna HTTP 402 Payment Required con mensaje descriptivo

---

## 6. Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CAMPO (IoT)                               │
│                                                                     │
│   ┌──────────────┐  MQTT/TLS    ┌──────────────────────────────┐  │
│   │  Nodo ESP32  │ ──────────►  │     HiveMQ Cloud (free)      │  │
│   │  + Sensores  │              │     puerto 8883 (TLS)        │  │
│   └──────────────┘              └──────────────────────────────┘  │
│                                           │                         │
└───────────────────────────────────────────┼─────────────────────────┘
                                            │ MQTT subscriber
                                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      BACKEND (Fly.io, Dallas)                        │
│                                                                     │
│   ┌────────────────────────────────────────────────────────────┐   │
│   │                    FastAPI (Python 3.11)                    │   │
│   │                                                            │   │
│   │  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │   │
│   │  │  Farms  │  │ Sensors  │  │ Analysis │  │  Alerts  │  │   │
│   │  │  Router │  │  Router  │  │  Router  │  │  Router  │  │   │
│   │  └─────────┘  └──────────┘  └──────────┘  └──────────┘  │   │
│   │                                                            │   │
│   │  ┌──────────────┐  ┌────────────┐  ┌──────────────────┐  │   │
│   │  │  KPI Service │  │LLM Service │  │  Alert Service   │  │   │
│   │  │ (VPD, ETc,   │  │(Groq→Claude│  │(threshold check, │  │   │
│   │  │  GDD, plagas)│  │ →Ollama)   │  │ cooldown Redis)  │  │   │
│   │  └──────────────┘  └────────────┘  └──────────────────┘  │   │
│   │                                                            │   │
│   │  ┌──────────────┐  ┌────────────┐  ┌──────────────────┐  │   │
│   │  │Climate Svc   │  │MQTT Service│  │   WebSocket Mgr  │  │   │
│   │  │(Open-Meteo + │  │(HiveMQ sub,│  │  (broadcast por  │  │   │
│   │  │ Redis cache) │  │async proc) │  │   farm_id)       │  │   │
│   │  └──────────────┘  └────────────┘  └──────────────────┘  │   │
│   └────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │            SQLAlchemy Async (asyncpg driver)                │  │
│   └─────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
          │ PostgreSQL     │ Redis         │ LLM API      │ Email
          ▼                ▼               ▼              ▼
   ┌──────────┐   ┌──────────────┐  ┌──────────┐  ┌──────────┐
   │Supabase  │   │Upstash Redis │  │  Groq /  │  │  Resend  │
   │PostgreSQL│   │(Serverless)  │  │Anthropic │  │   API    │
   │+ Auth    │   │              │  │/ Ollama  │  │          │
   └──────────┘   └──────────────┘  └──────────┘  └──────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Vercel, Edge CDN)                       │
│                                                                     │
│   ┌────────────────────────────────────────────────────────────┐   │
│   │              Next.js 15 (App Router, SSR)                   │   │
│   │                                                            │   │
│   │  Supabase SSR Auth (HTTP-only cookie, ES256 JWT)           │   │
│   │  React 19 + Tailwind + Framer Motion + Recharts            │   │
│   │  WebSocket nativo para tiempo real                         │   │
│   └────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Flujo de Datos Principal

```
ESP32 → MQTT pub → HiveMQ → MQTT sub (backend) → DB insert
                                               → WebSocket broadcast → Browser dashboard
                                               → Alert check → Redis cooldown → Email (Resend)
```

```
Usuario → POST /analyze → LLM Service → Groq API (primary)
                                      → Anthropic API (fallback si Groq falla)
                                      → DB save → response
```

---

## 7. Stack Tecnológico

### Backend

| Tecnología | Versión | Rol |
|-----------|---------|-----|
| Python | 3.11 | Runtime |
| FastAPI | 0.115+ | Framework HTTP + WebSocket |
| uv (Astral) | latest | Package manager (10-100× más rápido que pip) |
| SQLAlchemy | 2.0 (async) | ORM con soporte async nativo |
| asyncpg | latest | Driver PostgreSQL async |
| Pydantic v2 | latest | Validación de esquemas, settings |
| paho-mqtt | latest | Cliente MQTT (HiveMQ subscriber) |
| httpx | 0.27+ | HTTP client async (Open-Meteo, LLMs) |
| redis | latest | Cliente Upstash (cache + cooldowns) |
| resend | latest | SDK email |
| anthropic | latest | SDK Claude API |
| logfire | 0.50+ | Observabilidad estructurada (opcional) |
| ruff | 0.5+ | Linter Python ultrarrápido |
| pytest + pytest-asyncio | latest | Testing (SQLite in-memory) |

### Frontend

| Tecnología | Versión | Rol |
|-----------|---------|-----|
| Next.js | 15.0+ | Framework React (App Router, SSR, Edge) |
| React | 19.0+ | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 3.4+ | Estilos utility-first |
| @supabase/ssr | 0.10+ | Auth SSR compatible (cookies HTTP-only) |
| Framer Motion | 11.0+ | Animaciones (spring, exit, variants) |
| Recharts | 2.x | Gráficas SVG declarativas |
| Lucide React | 0.4+ | Iconografía (400+ íconos) |
| Google Fonts | — | Outfit (UI) + Archivo (headings) |

### Hardware

| Componente | Especificación | Costo aprox. |
|-----------|---------------|-------------|
| ESP32 WROOM-32 | Dual-core 240MHz, WiFi + BT | $3–5 USD |
| DHT22 | Temperatura (-40/80°C) + Humedad (0–100%) ±0.5°C | $2 USD |
| DS18B20 | Temperatura suelo (-55/125°C), bus 1-Wire | $1.5 USD |
| Capacitive soil sensor | Humedad suelo 0–100%, no corrosión | $1 USD |
| ML8511 | Índice UV 0–11+ | $2 USD |
| Li-Ion 2000mAh | Autonomía ~2 semanas con deep sleep | $3 USD |
| **Total nodo** | | **~$13–15 USD** |

---

## 8. Estructura del Proyecto

```
surqo/
│
├── backend/
│   ├── app/
│   │   ├── main.py              # Entrada FastAPI, lifespan, MQTT consumer startup
│   │   ├── config.py            # Pydantic Settings (20+ vars de entorno)
│   │   ├── database.py          # Engine async, session factory, auto-schema init
│   │   ├── dependencies.py      # Validación JWT (JWKS ES256), auto-create UserProfile
│   │   │
│   │   ├── models/              # SQLAlchemy ORM
│   │   │   ├── user.py          # UserProfile
│   │   │   ├── farm.py          # Farm
│   │   │   ├── sensor.py        # SensorReading
│   │   │   ├── analysis.py      # Analysis
│   │   │   └── alert.py         # Alert
│   │   │
│   │   ├── routers/             # Endpoints FastAPI
│   │   │   ├── farms.py         # CRUD fincas
│   │   │   ├── sensors.py       # Ingesta + WebSocket + timeseries
│   │   │   ├── analysis.py      # Análisis IA
│   │   │   ├── alerts.py        # Alertas activas + historial
│   │   │   ├── kpis.py          # KPIs calculados
│   │   │   └── users.py         # Perfil + cambio de plan
│   │   │
│   │   ├── schemas/             # Pydantic request/response
│   │   ├── services/            # Lógica de negocio
│   │   │   ├── llm_service.py   # Multi-provider LLM (Groq → Claude → Ollama)
│   │   │   ├── kpi_service.py   # VPD, ETc, GDD, riesgo plagas
│   │   │   ├── climate_service.py # Open-Meteo + cache Redis
│   │   │   ├── mqtt_service.py  # HiveMQ subscriber, async processing
│   │   │   ├── alert_service.py # Umbrales, cooldown Redis, email Resend
│   │   │   └── cache_service.py # Redis wrapper con fallback graceful
│   │   │
│   │   ├── websocket/
│   │   │   └── manager.py       # Broadcast por farm_id a clientes conectados
│   │   │
│   │   └── prompts/             # Prompts LLM versionados en YAML
│   │       └── farm_analysis_v1.0.yaml
│   │
│   ├── migrations/
│   │   ├── 001_initial_schema.sql  # Tablas, índices, triggers updated_at
│   │   ├── enable_rls.sql          # Row-Level Security policies
│   │   └── data_retention.sql      # Auto-delete lecturas > 90 días
│   │
│   ├── tests/                   # 52+ tests (pytest, SQLite in-memory)
│   ├── Dockerfile               # Python 3.11-slim, uv, Uvicorn port 8080
│   ├── fly.toml                 # Fly.io: Dallas (dfw), 512MB, always-on
│   └── pyproject.toml           # Dependencias + ruff config
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx                  # Root layout, AuthProvider, NavBar
│   │   │   ├── page.tsx                    # Landing page (hero + features)
│   │   │   ├── login/page.tsx              # Autenticación
│   │   │   ├── register/page.tsx           # Registro → auto-crea perfil free
│   │   │   ├── como-funciona/page.tsx      # Cómo funciona Surqo
│   │   │   ├── soluciones/page.tsx         # Por tipo de cultivo
│   │   │   ├── preguntas/page.tsx          # FAQ
│   │   │   ├── privacidad/page.tsx         # Política de privacidad
│   │   │   ├── terminos/page.tsx           # Términos de servicio
│   │   │   ├── upgrade/page.tsx            # Comparativa Free vs Pro
│   │   │   │
│   │   │   └── (app)/                      # Rutas protegidas (requieren auth)
│   │   │       ├── layout.tsx              # Layout autenticado
│   │   │       ├── dashboard/page.tsx      # Panel principal con KPIs
│   │   │       ├── farms/page.tsx          # CRUD de fincas
│   │   │       ├── sensors/page.tsx        # Monitor tiempo real
│   │   │       ├── analyze/page.tsx        # Análisis IA (solo Pro)
│   │   │       └── alerts/page.tsx         # Centro de alertas
│   │   │
│   │   ├── components/          # Componentes React reutilizables
│   │   ├── lib/
│   │   │   ├── api.ts           # HTTP client con JWT injection
│   │   │   ├── auth.ts          # Supabase session, token extraction, logout
│   │   │   ├── supabase.ts      # Browser Supabase client (SSR-compatible)
│   │   │   └── websocket.ts     # WebSocket manager para tiempo real
│   │   │
│   │   ├── types/index.ts       # Interfaces TypeScript (Farm, SensorReading, Analysis, Alert, KPIs)
│   │   └── middleware.ts        # SSR route protection via Supabase cookies
│   │
│   ├── tailwind.config.js       # Paleta personalizada (surqo-green, etc.)
│   ├── next.config.js           # Remote image patterns, env vars
│   └── package.json
│
├── iot-simulator/
│   └── simulator.py             # MQTT publisher de datos realistas (para dev/testing)
│
├── firmware/
│   ├── surqo_node/              # Código ESP32 (PlatformIO)
│   └── platformio.ini           # Board: esp32doit-devkit-v1
│
├── docs/                        # Documentación (este archivo)
├── .github/workflows/ci-cd.yml  # GitHub Actions: lint → test → deploy
├── .env.example                 # Template de todas las variables de entorno
├── deploy-fly.sh                # Script interactivo de primer deploy
└── README.md                    # Documentación principal (ES)
```

---

## 9. Base de Datos

### Esquema Completo (PostgreSQL)

#### Tabla: `user_profiles`

```sql
CREATE TABLE user_profiles (
    user_id      UUID PRIMARY KEY,  -- viene de Supabase Auth (sub del JWT)
    email        TEXT NOT NULL UNIQUE,
    plan         TEXT NOT NULL DEFAULT 'free',  -- 'free' | 'paid'
    is_admin     BOOLEAN NOT NULL DEFAULT FALSE,
    email_alerts_this_month INTEGER NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `user_id` | UUID (PK) | Sincronizado con `auth.users.id` de Supabase |
| `email` | TEXT | Email único del usuario |
| `plan` | TEXT | `'free'` o `'paid'` |
| `is_admin` | BOOL | Bypass de todos los límites de plan |
| `email_alerts_this_month` | INT | Contador mensual (límite: 10 en free) |

#### Tabla: `farms`

```sql
CREATE TABLE farms (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES user_profiles(user_id),
    name            TEXT NOT NULL,
    crop_type       TEXT NOT NULL,
    latitude        FLOAT,
    longitude       FLOAT,
    area_hectares   FLOAT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `crop_type` | TEXT | 'maíz', 'café', 'plátano', 'yuca', 'arroz', 'algodón' |
| `latitude/longitude` | FLOAT | Usados para pronóstico meteorológico Open-Meteo |
| `is_active` | BOOL | Soft delete (no se borran datos) |

#### Tabla: `sensor_readings`

```sql
CREATE TABLE sensor_readings (
    id                  SERIAL PRIMARY KEY,
    farm_id             UUID NOT NULL REFERENCES farms(id),
    device_id           TEXT NOT NULL,
    air_temp_c          FLOAT,     -- temperatura del aire (°C)
    air_humidity_pct    FLOAT,     -- humedad relativa aire (%)
    soil_moisture_pct   FLOAT,     -- humedad suelo (%)
    soil_temp_c         FLOAT,     -- temperatura suelo (°C)
    uv_index            FLOAT,     -- índice UV (0–11+)
    vpd_kpa             FLOAT,     -- VPD calculado (kPa)
    battery_mv          INTEGER,   -- voltaje batería (mV)
    rssi_dbm            INTEGER,   -- señal WiFi (dBm)
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices compuestos para queries de timeseries eficientes
CREATE INDEX idx_sensor_readings_device_time ON sensor_readings(device_id, created_at DESC);
CREATE INDEX idx_sensor_readings_farm_time ON sensor_readings(farm_id, created_at DESC);
```

**Retención:** Auto-delete de lecturas > 90 días (definida en `data_retention.sql`).

#### Tabla: `analyses`

```sql
CREATE TABLE analyses (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id             UUID NOT NULL REFERENCES farms(id),
    alert_level         INTEGER,           -- 0 (ok) a 5 (crítico)
    water_stress_index  FLOAT,             -- 0.0 (sin estrés) a 1.0 (crítico)
    irrigation_needed   BOOLEAN,           -- ¿regar ahora?
    recommendations     JSONB,             -- lista de recomendaciones priorizadas
    raw_response        TEXT,              -- respuesta completa del LLM
    model_used          TEXT,              -- 'groq/llama-3.3-70b', 'claude-3-5-sonnet', etc.
    cost_usd            FLOAT,             -- costo de la llamada al LLM
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### Tabla: `alerts`

```sql
CREATE TABLE alerts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id         UUID NOT NULL REFERENCES farms(id),
    severity        TEXT NOT NULL,  -- 'info' | 'warning' | 'critical'
    title           TEXT NOT NULL,
    message         TEXT,
    is_resolved     BOOLEAN NOT NULL DEFAULT FALSE,
    email_sent      BOOLEAN NOT NULL DEFAULT FALSE,
    email_sent_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Row-Level Security (RLS)

Cada tabla tiene políticas RLS que garantizan que los usuarios solo ven sus propios datos:

```sql
-- Ejemplo: un usuario solo puede leer sus propias fincas
CREATE POLICY "users_see_own_farms" ON farms
    FOR SELECT USING (user_id = auth.uid());
```

---

## 10. API Reference

**Base URL:** `https://surqo-api.fly.dev`

### Endpoints Públicos

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/health` | Estado del servidor, DB, MQTT, WebSocket connections |
| `POST` | `/api/v1/sensors/readings` | Ingesta de lectura sensor (ESP32 o simulador) |
| `GET` | `/api/v1/sensors/timeseries/{farm_id}` | Serie de tiempo configurable |
| `GET` | `/api/v1/sensors/latest/{device_id}` | Última lectura por device |
| `GET` | `/api/v1/sensors/stats/{farm_id}` | Estadísticas agregadas |
| `WS` | `/api/v1/sensors/ws/live/{farm_id}` | Stream tiempo real de lecturas |

### Endpoints Autenticados (JWT requerido)

#### Fincas

| Método | Ruta | Plan | Descripción |
|--------|------|------|-------------|
| `POST` | `/api/v1/farms/` | Free (1) / Pro (∞) | Crear finca |
| `GET` | `/api/v1/farms/` | Todos | Listar mis fincas |
| `GET` | `/api/v1/farms/{id}` | Todos | Detalle de finca |
| `PATCH` | `/api/v1/farms/{id}` | Todos | Actualizar finca |
| `DELETE` | `/api/v1/farms/{id}` | Todos | Eliminar finca |
| `GET` | `/api/v1/farms/{id}/kpis` | Todos | KPIs últimas 24h |

#### Análisis IA

| Método | Ruta | Plan | Descripción |
|--------|------|------|-------------|
| `POST` | `/api/v1/analysis/analyze` | **Pro only** | Ejecutar análisis IA |
| `GET` | `/api/v1/analysis/history/{farm_id}` | Todos | Historial análisis |
| `GET` | `/api/v1/analysis/{id}` | Todos | Detalle análisis |

#### Alertas

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/v1/alerts/active` | Alertas activas (filtrar por farm_id) |
| `GET` | `/api/v1/alerts/history` | Todas las alertas |
| `PATCH` | `/api/v1/alerts/{id}/resolve` | Marcar como resuelta |

#### Usuarios

| Método | Ruta | Plan | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/v1/users/me` | Todos | Perfil del usuario autenticado |
| `PATCH` | `/api/v1/users/{id}/plan` | **Admin only** | Cambiar plan del usuario |

### Códigos de Respuesta

| Código | Significado |
|--------|-------------|
| `200` | OK |
| `201` | Creado |
| `204` | Sin contenido (delete exitoso) |
| `401` | No autenticado (JWT faltante o inválido) |
| `402` | Plan insuficiente (límite de fincas o análisis IA) |
| `403` | Prohibido (recurso de otro usuario) |
| `404` | No encontrado |
| `422` | Error de validación (Pydantic) |

### Ejemplo: Ingesta de Sensor

```http
POST /api/v1/sensors/readings
Content-Type: application/json

{
  "farm_id": "uuid-de-la-finca",
  "device_id": "surqo-esp32-001",
  "air_temp_c": 24.5,
  "air_humidity_pct": 68.0,
  "soil_moisture_pct": 45.2,
  "soil_temp_c": 21.0,
  "uv_index": 3.2,
  "battery_mv": 3800,
  "rssi_dbm": -62
}
```

### Ejemplo: Análisis IA (Pro)

```http
POST /api/v1/analysis/analyze
Authorization: Bearer <supabase_jwt>
Content-Type: application/json

{
  "farm_id": "uuid-de-la-finca"
}
```

```json
{
  "id": "uuid-del-analisis",
  "alert_level": 2,
  "water_stress_index": 0.35,
  "irrigation_needed": false,
  "recommendations": [
    "Monitorear humedad del suelo en las próximas 6 horas",
    "El VPD (1.8 kPa) indica demanda evapotranspirativa moderada",
    "Pronóstico de lluvia en 2 días — posponer riego"
  ],
  "model_used": "groq/llama-3.3-70b-versatile",
  "cost_usd": 0.000012,
  "created_at": "2026-06-28T14:30:00Z"
}
```

---

## 11. Autenticación y Seguridad

### Flujo de Autenticación Completo

```
1. Usuario → POST supabase.auth.signInWithPassword(email, password)
2. Supabase → JWT ES256 firmado (payload: {sub, email, aud:"authenticated"})
3. @supabase/ssr → almacena JWT en cookie HTTP-only
4. Frontend SSR Middleware → verifica cookie en cada request protegido
5. Frontend → GET /api/v1/users/me con header Authorization: Bearer <jwt>
6. Backend dependencies.py → valida JWT contra JWKS endpoint de Supabase
7. Si válido → extrae sub (user_id) y busca o crea UserProfile
8. Si primera vez → auto-crea perfil con plan='free'
```

### Validación JWT Multi-Fallback

```python
# dependencies.py — 3 métodos de validación en cascada
1. JWKS endpoint: GET /auth/v1/.well-known/jwks.json (cacheado 1 hora)
2. HS256 legacy: SUPABASE_JWT_SECRET (si configurado)
3. ES256 manual: SUPABASE_JWK_X + SUPABASE_JWK_Y (coordenadas de la clave pública)
```

### Control de Acceso por Roles

```python
# 3 niveles de acceso
Free user:  1 farm, 10 emails/mes, KPIs básicos
Pro user:   Fincas ilimitadas, emails ilimitados, análisis IA completo
Admin:      Bypass total de límites, puede cambiar planes de otros usuarios
```

---

## 12. Hardware (IoT)

### Nodo Sensor ESP32

**Firmware:** PlatformIO (Arduino framework) — `/firmware/surqo_node/`

**Ciclo de operación:**

```
1. Despertar del deep sleep (cada 15 min)
2. Leer sensores (DHT22, DS18B20, capacitivo, ML8511, ADC batería)
3. Conectar WiFi
4. Conectar HiveMQ Cloud (TLS 8883, user/pass)
5. Publicar JSON en topic: surqo/{device_id}/readings
6. Desconectar y entrar en deep sleep (~10µA)
```

**Topic MQTT:**

```
Publish:  surqo/{device_id}/readings
Subscribe: surqo/+/readings  (backend)
```

**Payload MQTT:**

```json
{
  "farm_id": "uuid",
  "device_id": "surqo-esp32-001",
  "air_temp_c": 24.5,
  "air_humidity_pct": 68.0,
  "soil_moisture_pct": 45.2,
  "soil_temp_c": 21.0,
  "uv_index": 3.2,
  "battery_mv": 3800,
  "rssi_dbm": -62,
  "timestamp": 1719580200
}
```

**Configuración del firmware (hardcoded o SPIFFS):**

```cpp
const char* WIFI_SSID = "nombre_red";
const char* WIFI_PASS = "clave_wifi";
const char* MQTT_HOST = "xxxxxxxxx.s1.eu.hivemq.cloud";
const int   MQTT_PORT = 8883;  // TLS
const char* MQTT_USER = "surqo_device";
const char* MQTT_PASS = "token_seguro";
const char* FARM_ID   = "uuid-de-la-finca";
const char* DEVICE_ID = "surqo-esp32-001";
const int   SLEEP_MIN = 15;
```

---

## 13. Inteligencia Artificial

### Multi-Provider LLM

El servicio LLM abstrae múltiples proveedores en cascada:

```
1. Groq (Llama 3.3 70B)  → Primario: gratis, <1s latencia, 14.4K req/día
2. Anthropic Claude       → Fallback pagado: calidad superior, $3/MTok input
3. Ollama (local)         → Desarrollo: sin costo, latencia variable
```

### KPIs Agronómicos Calculados

El `kpi_service.py` implementa fórmulas científicas estándar:

#### VPD (Vapor Pressure Deficit)

```python
# Ecuación de Magnus
es = 0.6108 * exp(17.27 * T / (T + 237.3))  # kPa (presión vapor saturación)
ea = es * (RH / 100)                          # kPa (presión vapor actual)
VPD = es - ea                                 # kPa
# VPD < 0.4: exceso humedad (hongos)
# VPD 0.4–1.6: óptimo
# VPD > 1.6: estrés hídrico
```

#### ETc (Evapotranspiración del cultivo) — Penman-Monteith

```python
ETc = Kc * ET0  # mm/día
# ET0: evapotranspiración de referencia (Penman-Monteith FAO-56)
# Kc: coeficiente de cultivo según fase fenológica
# Kc por cultivo: maíz=1.2, café=1.0, plátano=1.1, yuca=0.75, arroz=1.3, algodón=1.15
```

#### GDD (Grados-Día de Crecimiento)

```python
GDD = max(0, (T_max + T_min) / 2 - T_base)
# T_base por cultivo: maíz=10°C, café=15°C, plátano=14°C
```

#### Riesgo de Plagas

```python
# Score 0–100 basado en condiciones favorables para hongos y trips
# Alta humedad + temperatura moderada → riesgo fúngico alto
# VPD bajo sostenido → botrytis risk
# Alertas automáticas si score > 70
```

### Prompt de Análisis IA (YAML versionado)

```yaml
# farm_analysis_v1.0.yaml
version: "1.0"
system: |
  Eres un agrónomo experto en cultivos colombianos. Analiza los datos
  del campo y entrega recomendaciones claras, en español simple, para
  un agricultor colombiano.

user_template: |
  Finca: {farm_name} | Cultivo: {crop_type}
  Últimas 24h de datos:
  - Temperatura promedio: {avg_temp}°C
  - Humedad suelo promedio: {avg_soil_moisture}%
  - VPD promedio: {avg_vpd} kPa
  - ETc calculada: {etc} mm/día
  Pronóstico próximos 3 días: {weather_forecast}

  Responde con:
  1. alert_level (0-5)
  2. water_stress_index (0.0-1.0)
  3. irrigation_needed (true/false)
  4. recommendations (lista de 3-5 acciones concretas)
```

---

## 14. Servicios Externos

| Servicio | Propósito | Tier gratuito | Variable de entorno |
|---------|-----------|---------------|---------------------|
| **Supabase** | PostgreSQL + Auth | 500MB DB, 50K req/mes | `SUPABASE_URL`, `SUPABASE_KEY` |
| **HiveMQ Cloud** | Broker MQTT (IoT) | 100 conexiones simultáneas | `HIVEMQ_HOST`, `HIVEMQ_USER`, `HIVEMQ_PASS` |
| **Upstash Redis** | Cache + cooldowns alertas | 10K req/día | `REDIS_URL` |
| **Groq API** | LLM primario (Llama 3.3 70B) | 14.4K req/día | `GROQ_API_KEY` |
| **Anthropic** | LLM fallback (Claude) | Pago | `ANTHROPIC_API_KEY` |
| **Open-Meteo** | Pronóstico meteorológico | Ilimitado (sin key) | Ninguna |
| **Resend** | Emails de alertas | 3K emails/mes | `RESEND_API_KEY`, `FROM_EMAIL` |
| **Logfire** | Observabilidad + trazas | Tier gratuito | `LOGFIRE_TOKEN` |
| **Fly.io** | Hosting backend | $0–5/mes | `FLY_API_TOKEN` (CI/CD) |
| **Vercel** | Hosting frontend | Ilimitado builds | GitHub integration |

---

## 15. Frontend — Páginas y Flujos

### Páginas Públicas

| Ruta | Propósito |
|------|-----------|
| `/` | Landing page: hero, problema, solución, hardware, CTA |
| `/como-funciona` | Explicación en 3 pasos del funcionamiento |
| `/soluciones` | Fichas por cultivo (maíz, café, plátano, yuca, arroz, algodón) |
| `/preguntas` | FAQ con 10+ preguntas comunes |
| `/privacidad` | Política de privacidad |
| `/terminos` | Términos de servicio |
| `/upgrade` | Comparativa Free vs Pro con CTA de contacto |
| `/login` | Formulario autenticación |
| `/register` | Formulario registro → crea perfil free automático |

### Páginas Protegidas (requieren JWT)

| Ruta | Propósito |
|------|-----------|
| `/(app)/dashboard` | KPI cards + live feed + gráfica timeseries |
| `/(app)/farms` | CRUD de fincas (crear, editar, eliminar) |
| `/(app)/sensors` | Monitor tiempo real con WebSocket |
| `/(app)/analyze` | Disparar análisis IA + ver resultados (Pro only) |
| `/(app)/alerts` | Centro de alertas: activas, historial, resolver |

### Flujo de Registro → Primer Dato

```
/register → supabase.signUp() → email verificado
→ /login → supabase.signIn() → JWT en cookie
→ /(app)/dashboard → middleware verifica session
→ "Crea tu primera finca" → POST /api/v1/farms/
→ Conecta sensor con farm_id → datos en tiempo real
```

### Protección SSR (Middleware)

```typescript
// middleware.ts
// Verifica sesión Supabase en cada request protegido
// Si no autenticado → redirect a /login
// Si autenticado → pasa el request (SSR puede leer datos)
export const config = {
  matcher: ['/(app)/:path*']
}
```

---

## 16. Modelo de Negocio

### Planes

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| Precio | $0 | $15–25 USD/mes | Negociado |
| Fincas | 1 | Ilimitadas | Ilimitadas |
| Emails alertas/mes | 10 | Ilimitados | Ilimitados |
| KPIs básicos | ✅ | ✅ | ✅ |
| Análisis IA | ❌ | ✅ | ✅ |
| ETc Penman-Monteith | ❌ | ✅ | ✅ |
| Historial completo | ❌ | ✅ | ✅ |
| Multi-usuario | ❌ | ❌ | ✅ |
| API directa | ❌ | ❌ | ✅ |
| SLA + soporte | ❌ | ❌ | ✅ |

### Flujo de Upgrades (arquitectura lista, Stripe pendiente)

```
Usuario Free → intenta análisis IA → HTTP 402
→ redirigido a /upgrade
→ contacto por WhatsApp/email con Ricardo
→ Admin llama: PATCH /api/v1/users/{id}/plan {"plan": "paid"}
→ Usuario tiene acceso Pro inmediatamente
```

**Pendiente:** Integración Stripe Webhooks para cobro automático y auto-upgrade.

### Métricas de Unit Economics (proyección)

- CAC estimado: $10–20 USD (marketing directo en cooperativas)
- LTV a 12 meses: $180–300 USD (Pro)
- Margen bruto: ~85% (stack serverless, costos fijos mínimos)
- Breakeven: ~15 usuarios Pro

---

## 17. Despliegue y CI/CD

### Pipeline GitHub Actions

```yaml
# .github/workflows/ci-cd.yml
Trigger: push a master | PR a master

Job 1 — lint:
  - ruff check app/

Job 2 — test (depende de lint):
  - pytest tests/ --cov=app
  - SQLite in-memory (sin Supabase, sin Redis, sin MQTT)

Job 3 — deploy-backend (depende de test, solo en push a master):
  - flyctl deploy --remote-only
  - Requiere secret: FLY_API_TOKEN

Job 4 — deploy-frontend:
  - Auto por Vercel GitHub Integration
  - Preview deployments en PRs automáticos
```

### Comandos de Despliegue Manual

```bash
# Backend — primer deploy
bash deploy-fly.sh

# Backend — actualizar
flyctl deploy --remote-only

# Frontend — Vercel auto-deploy en push a master
# También: vercel --prod (si tienes vercel CLI)
```

### Variables de Entorno — Backend (Fly.io secrets)

```bash
flyctl secrets set \
  SUPABASE_URL="https://xxx.supabase.co" \
  SUPABASE_KEY="eyJ..." \
  SUPABASE_JWT_SECRET="tu-jwt-secret" \
  HIVEMQ_HOST="xxx.s1.eu.hivemq.cloud" \
  HIVEMQ_USERNAME="usuario" \
  HIVEMQ_PASSWORD="clave" \
  REDIS_URL="redis://default:token@xxx.upstash.io:6379" \
  GROQ_API_KEY="gsk_..." \
  ANTHROPIC_API_KEY="sk-ant-..." \
  RESEND_API_KEY="re_..." \
  FROM_EMAIL="alertas@surqo.co"
```

### Variables de Entorno — Frontend (Vercel)

```bash
NEXT_PUBLIC_API_URL=https://surqo-api.fly.dev
NEXT_PUBLIC_WS_URL=wss://surqo-api.fly.dev
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### Fly.io Config Key

```toml
# fly.toml
[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = false   # crítico: sin cold starts
  min_machines_running = 1

[[vm]]
  memory = "512mb"
  cpu_kind = "shared"
  cpus = 1

[checks]
  [checks.health]
    path = "/health"
    interval = "30s"
    timeout = "5s"
```

---

## 18. Costos de Operación

### Stack Gratuito (hasta ~500 usuarios)

| Servicio | Costo/mes | Límite free | Notas |
|---------|-----------|-------------|-------|
| Fly.io | $0–5 | 3 VMs shared | Solo almacenamiento extra |
| Supabase | $0 | 500MB DB, 50K req | Más que suficiente para 500 users |
| Upstash Redis | $0 | 10K req/día | Cache de clima + cooldowns |
| Vercel | $0 | Builds ilimitados | CDN global incluido |
| Groq | $0 | 14.4K req/día | ~400 análisis/día (Pro users) |
| Open-Meteo | $0 | Ilimitado | No requiere API key |
| Resend | $0–30 | 3K emails/mes | Pagar si > 3K alertas |
| **TOTAL** | **$0–35** | | Stack de producción real |

### Cuando Escalar

| Trigger | Acción | Costo adicional |
|---------|--------|----------------|
| DB > 400MB | Supabase Pro | $25/mes |
| > 14.4K análisis IA/día | Groq pago o Claude | $0.14/MTok |
| > 3K emails/mes | Resend Basic | $20/mes |
| Backend necesita más RAM | Fly.io dedicated-cpu | $30–50/mes |

---

## 19. Seguridad

### Capas de Seguridad

| Capa | Mecanismo | Protege contra |
|------|-----------|----------------|
| JWT ES256 | Firmado con clave privada Supabase | Tokens falsos, impersonation |
| RLS PostgreSQL | Políticas por `auth.uid()` | Acceso cruzado entre usuarios |
| MQTT TLS 8883 | Certificado SSL, user/pass | MITM en campo, sensores falsos |
| HTTPS forzado | `force_https = true` en Fly.io | MITM en API |
| HTTP-only cookies | `@supabase/ssr` | XSS (no accesible desde JS) |
| `.gitignore` de `.env` | `.env` excluido | Secretos en repositorio |
| Redis cooldown | 30 min entre alertas iguales | Spam de emails / alertas |
| Plan enforcement | HTTP 402 en endpoints restringidos | Abuso de features de pago |

### Auditoría de Seguridad Pendiente

- [ ] Rate limiting en `/api/v1/sensors/readings` (actualmente público sin límite)
- [ ] Validación de `farm_id` al ingestar lecturas (cualquiera puede escribir en cualquier farm)
- [ ] CSRF protection en rutas de mutación
- [ ] Stripe Webhook signature validation (cuando se integre cobro)

---

## 20. Métricas del Proyecto

| Métrica | Valor |
|---------|-------|
| Archivos Python (backend) | ~50 |
| Endpoints REST | 28 |
| WebSocket | 1 |
| Páginas frontend | 17 |
| Tablas en DB | 5 |
| Tests | 52+ |
| Variables de entorno | 25+ backend / 4 frontend |
| Cultivos soportados | 6 |
| Sensores por nodo | 5 |
| Proveedores LLM | 3 (Groq, Anthropic, Ollama) |
| Regiones de deploy | 2 (Dallas backend, CDN global frontend) |
| Tiempo de build estimado | 7 días (sprint full-stack) |
| Líneas de código Python | ~2,400 |
| Líneas de TypeScript/TSX | ~3,000+ |

---

## 21. Roadmap

### Completado ✅

- [x] Nodo sensor ESP32 con firmware PlatformIO
- [x] Ingesta MQTT → HiveMQ → Backend
- [x] API REST completa (28 endpoints)
- [x] WebSocket tiempo real por farm
- [x] KPIs agronómicos (VPD, ETc, GDD, riesgo plagas)
- [x] Análisis IA multi-proveedor (Groq + Claude)
- [x] Alertas automáticas con cooldown (Resend)
- [x] Autenticación Supabase (ES256 JWT + SSR)
- [x] Control de plan (free vs pro, HTTP 402)
- [x] RLS PostgreSQL (aislamiento por usuario)
- [x] Frontend Next.js 15 (App Router, SSR)
- [x] Dashboard con KPIs + gráficas + alertas
- [x] Landing page con marketing (ES)
- [x] CI/CD GitHub Actions → Fly.io + Vercel
- [x] Simulador IoT para testing
- [x] 52+ tests automatizados

### Próximas Iteraciones 🔄

#### v1.1 — Monetización Automática

- [ ] Integración Stripe (checkout + webhooks)
- [ ] Auto-upgrade de plan al pagar
- [ ] Portal de facturación self-service
- [ ] Trial de 14 días para Pro

#### v1.2 — Multi-Nodo

- [ ] Múltiples sensores por finca (mapa de calor)
- [ ] Comparación entre zonas de la misma finca
- [ ] Dashboard de flota de nodos

#### v1.3 — WhatsApp Integration

- [ ] Alertas críticas por WhatsApp (Twilio API)
- [ ] Comandos por WhatsApp ("¿debo regar hoy?")
- [ ] Fotos de síntomas por WhatsApp → análisis con Claude Vision

#### v2.0 — Enterprise

- [ ] Multi-usuario por organización (cooperativas)
- [ ] API directa con autenticación de aplicación
- [ ] Reportes PDF automatizados (semanales/mensuales)
- [ ] Integración ERP agrícola (SAP Agri, etc.)
- [ ] SLA con soporte técnico dedicado

#### v3.0 — IA Avanzada

- [ ] Modelos predictivos de rendimiento por cosecha
- [ ] Recomendaciones de fertilización basadas en datos históricos
- [ ] Detección de plagas por foto (Claude Vision)
- [ ] Modelo propio fine-tuned con datos colombianos

---

## Apéndice A — Variables de Entorno Completas

```bash
# Supabase (Base de datos + Auth)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJ...  # anon key o service role key
SUPABASE_JWT_SECRET=tu-jwt-secret  # encontrar en Supabase Dashboard > Settings > API
SUPABASE_JWK_X=...  # Coordenada X de la clave pública ES256 (fallback)
SUPABASE_JWK_Y=...  # Coordenada Y de la clave pública ES256 (fallback)

# HiveMQ Cloud (MQTT Broker para IoT)
HIVEMQ_HOST=xxxxxxxx.s1.eu.hivemq.cloud
HIVEMQ_USERNAME=surqo_device
HIVEMQ_PASSWORD=clave-segura
HIVEMQ_PORT=8883  # TLS

# Redis (Upstash — Cache + Cooldowns)
REDIS_URL=redis://default:token@xxx.upstash.io:6379

# LLM APIs
GROQ_API_KEY=gsk_...  # Primario (Llama 3.3 70B)
ANTHROPIC_API_KEY=sk-ant-...  # Fallback (Claude)
OLLAMA_BASE_URL=http://localhost:11434  # Solo desarrollo local

# Email (Resend)
RESEND_API_KEY=re_...
FROM_EMAIL=alertas@surqo.co

# Observabilidad (opcional)
LOGFIRE_TOKEN=tu-logfire-token

# Aplicación
ENVIRONMENT=production  # development | staging | production
SECRET_KEY=una-clave-random-segura-de-32-chars

# Frontend (Vercel — variables NEXT_PUBLIC)
NEXT_PUBLIC_API_URL=https://surqo-api.fly.dev
NEXT_PUBLIC_WS_URL=wss://surqo-api.fly.dev
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

---

## Apéndice B — Comandos de Desarrollo

```bash
# Backend — setup inicial
cd backend
uv sync
cp ../.env.example .env
# Editar .env con tus credenciales

# Backend — correr local
uv run uvicorn app.main:app --reload --port 8080

# Backend — tests
uv run pytest tests/ -v --cov=app

# Backend — linting
uv run ruff check app/

# Frontend — setup inicial
cd frontend
npm install
cp .env.local.example .env.local
# Editar .env.local con tus credenciales

# Frontend — correr local
npm run dev  # http://localhost:3000

# Frontend — build
npm run build

# Simulador IoT — probar sin sensor real
cd iot-simulator
python simulator.py --farm-id "tu-farm-id" --device-id "test-device-001"

# Deploy backend
flyctl deploy --remote-only

# Ver logs de producción
flyctl logs -a surqo-api
```

---

*Documentación generada el 2026-06-28 basada en el estado actual del código fuente.*
