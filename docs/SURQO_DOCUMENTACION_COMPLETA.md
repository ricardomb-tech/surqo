# SURQO — Documentación Completa del Proyecto

> Versión: 2.0 | Fecha: 2026-06-28 | Autor: Ricardo Martinez

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
16. [Modelo de Negocio y Freemium](#16-modelo-de-negocio-y-freemium)
17. [Despliegue y CI/CD](#17-despliegue-y-cicd)
18. [Costos de Operación](#18-costos-de-operación)
19. [Seguridad](#19-seguridad)
20. [Métricas del Proyecto](#20-métricas-del-proyecto)
21. [Roadmap](#21-roadmap)

---

## 1. Visión General del Producto

**Surqo** es una plataforma SaaS de agricultura de precisión para pequeños y medianos agricultores colombianos. Combina sensores IoT de bajo costo (ESP32, ~$15 USD) con inteligencia artificial para transformar datos del campo en decisiones accionables — desde el celular, en español, sin conocimientos técnicos.

**Sitio web:** [surqo.online](https://surqo.online)
**API:** [surqo-api.fly.dev](https://surqo-api.fly.dev)

### Propuesta de Valor

> "Conectas tu sensor, la IA analiza tu campo, tú decides con datos."

---

## 2. El Problema

| Problema | Impacto |
|----------|---------|
| Decisiones "a ojo" (riego, cosecha, fumigación) | Pérdida del 20–40% de cosechas |
| Detección tardía de plagas | Daños irreversibles |
| Sin datos históricos | Imposible aprender entre temporadas |
| Soluciones existentes costosas ($3K–$50K USD) | Inaccesibles para el agricultor promedio |
| Conectividad limitada en campo | WiFi/celular deficiente en zonas rurales |

---

## 3. La Solución

### 3.1 Hardware — Nodo Sensor ESP32 (~$15 USD)

- ESP32 WROOM-32 con WiFi nativo
- Sensores: DHT22 (temp/humedad aire), DS18B20 waterproof (temp suelo), capacitivo v2.0 (humedad suelo), ML8511 (UV)
- Comunicación: MQTT TLS port 8883 → HiveMQ Cloud
- Autonomía: ~2 semanas con 2× 18650 (deep sleep 10µA en reposo)
- Lecturas cada 15 minutos

### 3.2 Backend — FastAPI + IA

- Recibe lecturas vía MQTT (consumer) y HTTP (fallback ESP32)
- Calcula KPIs agronómicos científicos (VPD Magnus, ETc Penman-Monteith, GDD)
- Integra pronóstico 7 días Open-Meteo (gratuito, sin key)
- Análisis IA bajo demanda (Groq Llama 3.3 70B → Anthropic Claude fallback)
- Alertas automáticas con cooldown Redis (30 min entre alertas)
- Emails HTML via Resend

### 3.3 Frontend — Next.js 15

- Dashboard tiempo real con WebSocket (sin polling)
- KPIs visuales, gráficos de series de tiempo, alertas
- Análisis IA con recomendaciones en español
- Dominio propio: surqo.online (Hostinger → Vercel DNS)

---

## 4. Usuarios Objetivo

### Perfil Principal — Agricultor Colombiano

| Atributo | Descripción |
|----------|-------------|
| Edad | 30–60 años |
| Tamaño de finca | 1–50 hectáreas |
| Cultivos | Maíz, café, plátano, yuca, arroz, algodón |
| Conectividad | WiFi básico en casa, celular en campo |
| Pain | Pérdidas por clima y plagas sin datos |

### Perfil Secundario — Agroindustria / Cooperativa

- Múltiples fincas, reportes comparativos, alertas grupales → Enterprise

### Perfil Terciario — Agrónomo / Consultor

- Herramienta de monitoreo para clientes, exportación de datos

---

## 5. Requisitos del Producto (PRD)

### 5.1 Funcionalidades por Plan

#### Plan Free (gratuito, sin tarjeta)

- [x] 1 finca activa (`MAX_FARMS = 1`)
- [x] Monitoreo tiempo real (WebSocket)
- [x] KPIs agronómicos (VPD, humedad suelo, temperatura)
- [x] Alertas automáticas + emails (sin límite de emails/mes)
- [x] **4 análisis IA lifetime** (`FREE_ANALYSES_LIMIT = 4`)
- [x] 800 tokens output por análisis (`FREE_OUTPUT_TOKENS_PER_ANALYSIS = 800`)
- [x] Al agotar análisis → HTTP 402 con CTA de contacto a surqo.online/upgrade

#### Plan Pro (contacto directo → admin activa `plan = "paid"`)

- [x] Fincas ilimitadas
- [x] Análisis IA ilimitados
- [x] 2.048 tokens por análisis (`PAID_OUTPUT_TOKENS_PER_ANALYSIS = 2_048`)
- [x] Emails ilimitados
- [x] Historial completo de análisis

#### Plan Enterprise (precio negociado)

- [ ] Multi-usuario por organización (roadmap)
- [ ] API directa con API keys
- [ ] SLA con soporte técnico

### 5.2 Requisitos No Funcionales

| Requisito | Target |
|-----------|--------|
| Latencia API (lecturas) | < 200ms |
| Latencia análisis IA | < 3s |
| Disponibilidad | 99.5% (no hibernation en Fly.io) |
| Retención datos sensores | 90 días (auto-delete) |
| Seguridad datos | RLS PostgreSQL por usuario |
| Soporte móvil | Responsive, prioridad celular |
| Idioma | Español (Colombia) |

### 5.3 Criterios de Aceptación Clave

#### Límite de análisis free

- **Dado** un usuario free con `analyses_used = 4`
- **Cuando** intenta `POST /api/v1/analysis/analyze`
- **Entonces** recibe HTTP 402 con `{"code": "analysis_quota_exceeded", "contact_url": "https://surqo.online/upgrade"}`

#### Token máximo por plan

- **Free:** LLM recibe `max_tokens = 800` → respuesta más concisa
- **Pro:** LLM recibe `max_tokens = 2048` → respuesta completa con más detalles

#### Alerta automática

- **Dado** lectura con humedad suelo < 25% o VPD > 1.6 kPa
- **Cuando** no hay alerta del mismo tipo en últimos 30 min (Redis)
- **Entonces** crea alerta en DB + email al usuario

---

## 6. Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CAMPO (IoT)                               │
│                                                                     │
│   ┌──────────────┐  MQTT TLS/8883  ┌──────────────────────────┐   │
│   │  Nodo ESP32  │ ──────────────► │     HiveMQ Cloud         │   │
│   │  + Sensores  │                 └──────────────────────────┘   │
│   └──────────────┘                            │ MQTT subscriber    │
└───────────────────────────────────────────────┼─────────────────────┘
                                                 │
                                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      BACKEND (Fly.io, Dallas dfw)                   │
│                                                                     │
│   FastAPI 0.115 · Python 3.11 · Uvicorn · slowapi (rate limit)    │
│   Security headers · CORS · HTTPS forzado                          │
│                                                                     │
│   Routers: users · farms · sensors · analysis · alerts · kpis      │
│   Services: LLM · KPI · Climate · MQTT · Alert · Cache             │
│   WebSocket Manager: broadcast por farm_id                         │
│                                                                     │
│   SQLAlchemy Async (asyncpg) → Supabase PostgreSQL                 │
│   Redis (Upstash) → Cache clima/análisis · Cooldown alertas        │
└─────────────────────────────────────────────────────────────────────┘
          │ DB           │ Cache        │ LLM          │ Email
          ▼              ▼              ▼              ▼
   ┌──────────┐  ┌──────────────┐  ┌──────────┐  ┌──────────┐
   │Supabase  │  │Upstash Redis │  │  Groq /  │  │  Resend  │
   │PostgreSQL│  │              │  │Anthropic │  │          │
   │+ Auth    │  │              │  │/ Ollama  │  │          │
   └──────────┘  └──────────────┘  └──────────┘  └──────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                FRONTEND (Vercel · surqo.online)                     │
│                                                                     │
│   Next.js 15 App Router · React 19 · TypeScript                    │
│   Tailwind CSS · Framer Motion · Recharts                          │
│   Supabase SSR Auth (HTTP-only cookies · ES256 JWT)                │
│   WebSocket nativo para tiempo real                                │
└─────────────────────────────────────────────────────────────────────┘

DNS: Hostinger → ns1/ns2.vercel-dns.com → surqo.online
```

### Flujo Principal de Datos

```
ESP32 → MQTT pub → HiveMQ → MQTT sub (backend)
                                    ├── DB insert
                                    ├── WebSocket broadcast → dashboard
                                    ├── VPD calculation
                                    └── Alert check → Redis cooldown → Resend email

Usuario → POST /analyze → cuota check → LLM (Groq/Claude)
                                       → DB save (analyses_used++)
                                       → response JSON
```

---

## 7. Stack Tecnológico

### Backend

| Tecnología | Versión | Rol |
|-----------|---------|-----|
| Python | 3.11 | Runtime |
| FastAPI | 0.115+ | Framework HTTP + WebSocket |
| uv | latest | Package manager (10-100× más rápido que pip) |
| SQLAlchemy | 2.0 async | ORM |
| asyncpg | latest | Driver PostgreSQL async |
| Pydantic v2 | latest | Validación, Settings |
| paho-mqtt | latest | Cliente MQTT HiveMQ |
| httpx | 0.27+ | HTTP async (Open-Meteo, LLMs) |
| redis | latest | Cache + cooldowns |
| resend | latest | Email SDK |
| anthropic | latest | Claude SDK |
| slowapi | latest | Rate limiting por IP |
| logfire | 0.50+ | Observabilidad estructurada |
| ruff | 0.5+ | Linter |
| pytest + pytest-asyncio | latest | 86+ tests con SQLite in-memory |

### Frontend

| Tecnología | Versión | Rol |
|-----------|---------|-----|
| Next.js | 15.0+ | Framework (App Router, SSR, Edge) |
| React | 19.0+ | UI |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 3.4+ | Estilos |
| @supabase/ssr | 0.10+ | Auth SSR (cookies HTTP-only) |
| Framer Motion | 11.0+ | Animaciones |
| Recharts | 2.x | Gráficas SVG |
| Lucide React | 0.4+ | Iconografía |

### Hardware

| Componente | Especificación | Costo |
|-----------|---------------|-------|
| ESP32 WROOM-32 | Dual-core 240MHz, WiFi | $4 USD |
| DHT22 | Temp ±0.5°C, Humedad ±2% | $2 USD |
| DS18B20 waterproof | Temp suelo -55/125°C | $2 USD |
| Capacitive soil v2.0 | Humedad 0-100%, no corrosión | $1.5 USD |
| ML8511 | UV 0-11+ | $2 USD |
| 2× 18650 Li-Ion | 2000mAh, ~2 semanas autonomía | $4 USD |
| **Total nodo** | | **~$15 USD** |

---

## 8. Estructura del Proyecto

```
surqo/
│
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI, lifespan, CORS, security headers, routers
│   │   ├── config.py            # Pydantic Settings (25+ vars de entorno)
│   │   ├── database.py          # Engine async, session factory
│   │   ├── dependencies.py      # CurrentUser, DBSession
│   │   │
│   │   ├── models/
│   │   │   ├── user.py          # UserProfile: plan, analyses_used, tokens_used
│   │   │   ├── farm.py          # Farm: name, crop_type, lat/lon, area, alert_email
│   │   │   ├── sensor_reading.py # SensorReading: 8 métricas + vpd calculado
│   │   │   ├── analysis.py      # Analysis: recomendaciones, tokens, cost_usd
│   │   │   └── alert.py         # Alert: severity, is_resolved, email_sent
│   │   │
│   │   ├── routers/
│   │   │   ├── users.py         # /me, /me/plan-limits, /{id}/plan (admin)
│   │   │   ├── farms.py         # CRUD + /kpis
│   │   │   ├── sensors.py       # /readings, /timeseries, /latest, /stats, WebSocket
│   │   │   ├── analysis.py      # /analyze, /history, /{id}, /chat, /evaluate-prompts
│   │   │   ├── alerts.py        # /active, /history, /{id}, /resolve, /notify
│   │   │   └── kpis.py          # /farm/{id}
│   │   │
│   │   ├── services/
│   │   │   ├── llm_service.py   # Groq → Anthropic → Ollama
│   │   │   ├── kpi_service.py   # VPD, ETc, GDD, soil health, pest risk
│   │   │   ├── climate_service.py # Open-Meteo + Redis cache
│   │   │   ├── mqtt_service.py  # HiveMQ subscriber
│   │   │   ├── alert_service.py # Umbrales + cooldown + email
│   │   │   └── cache_service.py # Redis wrapper graceful
│   │   │
│   │   ├── websocket/manager.py # Broadcast por farm_id
│   │   └── prompts/             # YAML versionados
│   │       ├── farm_analysis_v1.0.yaml
│   │       ├── alert_triage_v1.0.yaml
│   │       └── daily_summary_v1.0.yaml
│   │
│   ├── migrations/
│   │   ├── 001_initial_schema.sql   # Tablas base
│   │   ├── 002_analysis_quota.sql   # analyses_used + tokens_used
│   │   ├── enable_rls.sql           # Row Level Security
│   │   └── data_retention.sql       # Auto-delete > 90 días
│   │
│   ├── tests/                   # 86+ tests (SQLite in-memory)
│   ├── Dockerfile               # Python 3.11-slim + uv + Uvicorn 8080
│   ├── fly.toml                 # Dallas (dfw), 512MB, always-on
│   └── pyproject.toml
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx                   # Landing (glass morphism)
│   │   │   ├── layout.tsx                 # Root: AuthProvider + NavBar
│   │   │   ├── (app)/                     # Rutas protegidas SSR
│   │   │   │   ├── dashboard/page.tsx
│   │   │   │   ├── farms/page.tsx
│   │   │   │   ├── sensors/page.tsx
│   │   │   │   ├── analyze/page.tsx       # Análisis IA + cuota visual
│   │   │   │   └── alerts/page.tsx
│   │   │   ├── login/ · register/ · upgrade/
│   │   │   └── como-funciona/ · soluciones/ · preguntas/ · privacidad/ · terminos/
│   │   │
│   │   ├── components/          # NavBar, AuthProvider, KPICard, SensorChart, etc.
│   │   ├── lib/                 # api.ts, auth.ts, supabase.ts, websocket.ts
│   │   ├── types/index.ts       # Interfaces TypeScript
│   │   └── middleware.ts        # Protección SSR
│   │
│   ├── tailwind.config.js       # Paleta surqo-green
│   └── package.json
│
├── firmware/
│   ├── surqo_node/
│   │   ├── surqo_node.ino       # Firmware principal (DHT22, DS18B20, MQTT TLS)
│   │   └── config.h             # Credenciales WiFi/MQTT, pines, calibración
│   ├── platformio.ini           # ESP32 WROOM-32, dependencias
│   └── README.md
│
├── iot-simulator/
│   ├── simulator.py             # MQTT/HTTP publisher, modelo climático Córdoba
│   └── README.md
│
├── docs/
│   └── SURQO_DOCUMENTACION_COMPLETA.md   # Este archivo
│
├── .github/workflows/ci-cd.yml  # lint → test → deploy Fly.io
├── .env.example                 # Template 25+ variables
├── deploy-fly.sh                # Script primer deploy interactivo
└── README.md                    # Documentación principal
```

---

## 9. Base de Datos

### Esquema Completo (PostgreSQL + Supabase)

#### `user_profiles`

```sql
CREATE TABLE user_profiles (
    user_id      UUID PRIMARY KEY,        -- = auth.users.id de Supabase
    email        TEXT NOT NULL UNIQUE,
    full_name    TEXT,
    plan         TEXT NOT NULL DEFAULT 'free',  -- 'free' | 'paid'
    plan_activated_at TIMESTAMPTZ,

    -- Cuota freemium
    analyses_used              INTEGER NOT NULL DEFAULT 0,
    tokens_used                INTEGER NOT NULL DEFAULT 0,

    -- Alertas email
    email_alerts_this_month    INTEGER NOT NULL DEFAULT 0,
    alerts_reset_at            TIMESTAMPTZ,

    is_admin     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ
);
```

**Constantes del modelo (Python):**

```python
FREE_ANALYSES_LIMIT              = 4
FREE_TOKENS_LIMIT                = 3_200
FREE_OUTPUT_TOKENS_PER_ANALYSIS  = 800
PAID_OUTPUT_TOKENS_PER_ANALYSIS  = 2_048
MAX_FARMS                        = 1
```

#### `farms`

```sql
CREATE TABLE farms (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES user_profiles(user_id),
    name          TEXT NOT NULL,
    crop_type     TEXT NOT NULL,
    latitude      FLOAT,
    longitude     FLOAT,
    area_hectares FLOAT,
    alert_email   TEXT,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ
);
```

#### `sensor_readings`

```sql
CREATE TABLE sensor_readings (
    id                  SERIAL PRIMARY KEY,
    farm_id             UUID NOT NULL REFERENCES farms(id),
    device_id           TEXT NOT NULL,
    air_temp_c          FLOAT,
    air_humidity_pct    FLOAT,
    soil_moisture_pct   FLOAT,
    soil_temp_c         FLOAT,
    uv_index            FLOAT,
    vpd_kpa             FLOAT,        -- calculado en backend (Magnus)
    battery_mv          INTEGER,
    rssi_dbm            INTEGER,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sensor_device_time ON sensor_readings(device_id, created_at DESC);
CREATE INDEX idx_sensor_farm_time   ON sensor_readings(farm_id,   created_at DESC);
```

**Retención:** Auto-delete lecturas > 90 días (`data_retention.sql`).

#### `analyses`

```sql
CREATE TABLE analyses (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id             UUID REFERENCES farms(id),
    farm_name           TEXT,
    crop_type           TEXT,
    alert_level         TEXT,              -- 'ok' | 'warning' | 'critical'
    main_alert          TEXT,
    water_stress_index  FLOAT,             -- 0.0 – 1.0
    irrigation_needed   BOOLEAN,
    next_irrigation_date TEXT,
    avg_temperature_c   FLOAT,
    total_rain_7d_mm    FLOAT,
    avg_vpd_kpa         FLOAT,
    et0_7d_mm           FLOAT,
    recommendations     JSONB,
    summary_for_farmer  TEXT,
    prompt_version      TEXT,
    model_used          TEXT,
    input_tokens        INTEGER,
    output_tokens       INTEGER,
    cost_usd            FLOAT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `alerts`

```sql
CREATE TABLE alerts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id             UUID NOT NULL REFERENCES farms(id),
    severity            TEXT NOT NULL,   -- 'info' | 'warning' | 'critical'
    title               TEXT NOT NULL,
    description         TEXT,
    recommended_action  TEXT,
    is_resolved         BOOLEAN NOT NULL DEFAULT FALSE,
    email_sent          BOOLEAN NOT NULL DEFAULT FALSE,
    email_sent_at       TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Migraciones ejecutadas

| Archivo | Cuándo ejecutar |
|---------|----------------|
| `001_initial_schema.sql` | Primera vez, crea todas las tablas |
| `002_analysis_quota.sql` | Agrega `analyses_used` y `tokens_used` a `user_profiles` |
| `enable_rls.sql` | Habilita Row Level Security |
| `data_retention.sql` | Auto-delete lecturas > 90 días |

---

## 10. API Reference

**Base URL producción:** `https://surqo-api.fly.dev`

### Endpoints completos

| Método | Ruta | Auth | Plan | Descripción |
|--------|------|------|------|-------------|
| `GET` | `/health` | No | — | Estado servidor |
| `POST` | `/api/v1/sensors/readings` | No | — | Ingesta lectura sensor |
| `GET` | `/api/v1/sensors/timeseries/{farm_id}` | No | — | Serie de tiempo |
| `GET` | `/api/v1/sensors/latest/{device_id}` | No | — | Última lectura |
| `GET` | `/api/v1/sensors/stats/{farm_id}` | No | — | Estadísticas 24h |
| `WS` | `/api/v1/sensors/ws/live/{farm_id}` | No | — | Stream tiempo real |
| `POST` | `/api/v1/farms/` | Sí | Free (1) / Pro (∞) | Crear finca |
| `GET` | `/api/v1/farms/` | Sí | — | Listar fincas |
| `GET` | `/api/v1/farms/{id}` | Sí | — | Detalle finca |
| `PATCH` | `/api/v1/farms/{id}` | Sí | — | Actualizar finca |
| `DELETE` | `/api/v1/farms/{id}` | Sí | — | Eliminar finca |
| `GET` | `/api/v1/farms/{id}/kpis` | Sí | — | KPIs 24h |
| `POST` | `/api/v1/analysis/analyze` | Sí | Free (4) / Pro (∞) | Análisis IA |
| `GET` | `/api/v1/analysis/history/{farm_id}` | Sí | — | Historial análisis |
| `GET` | `/api/v1/analysis/{id}` | Sí | — | Detalle análisis |
| `GET` | `/api/v1/alerts/active` | Sí | — | Alertas activas |
| `GET` | `/api/v1/alerts/history` | Sí | — | Historial alertas |
| `GET` | `/api/v1/alerts/{id}` | Sí | — | Detalle alerta |
| `PATCH` | `/api/v1/alerts/{id}/resolve` | Sí | — | Resolver alerta |
| `POST` | `/api/v1/alerts/{id}/notify` | Sí | — | Reenviar email alerta |
| `GET` | `/api/v1/kpis/farm/{id}` | Sí | — | KPIs detallados |
| `GET` | `/api/v1/users/me` | Sí | — | Perfil usuario |
| `PATCH` | `/api/v1/users/me` | Sí | — | Actualizar perfil |
| `GET` | `/api/v1/users/me/plan-limits` | Sí | — | Cuota detallada |
| `PATCH` | `/api/v1/users/{id}/plan` | Admin | — | Cambiar plan |

### Códigos de respuesta

| Código | Significado |
|--------|-------------|
| 200 | OK |
| 201 | Creado |
| 204 | Sin contenido |
| 401 | JWT inválido o faltante |
| 402 | Límite de plan excedido (finca o análisis) |
| 403 | Recurso de otro usuario |
| 404 | No encontrado |
| 422 | Error de validación Pydantic |
| 429 | Rate limit excedido (slowapi) |

---

## 11. Autenticación y Seguridad

### Validación JWT (ES256)

```python
# dependencies.py — 3 métodos en cascada
1. JWKS endpoint: /auth/v1/.well-known/jwks.json (cacheado con @lru_cache)
2. SUPABASE_JWK_X + SUPABASE_JWK_Y (coordenadas manuales fallback)
3. SUPABASE_JWT_SECRET HS256 (legacy fallback)
```

### Flujo completo

```
1. signInWithPassword() → Supabase emite JWT ES256
2. @supabase/ssr → almacena en cookie HTTP-only
3. Next.js middleware → verifica cookie antes de renderizar rutas protegidas
4. API call → Authorization: Bearer <jwt>
5. Backend → valida firma → extrae sub (user_id UUID)
6. Si primera vez → auto-crea UserProfile con plan='free' y analyses_used=0
```

### Seguridad implementada

| Capa | Mecanismo |
|------|-----------|
| JWT ES256 | Firma criptográfica imposible de falsificar |
| RLS PostgreSQL | Usuarios aislados a nivel de DB |
| HTTP-only cookies | JWT inaccesible desde JavaScript (no XSS) |
| MQTT TLS 8883 | Tráfico IoT cifrado end-to-end |
| HTTPS forzado | `force_https = true` en fly.toml |
| Security headers | nosniff, X-Frame-Options: DENY, HSTS |
| Rate limiting | slowapi por IP (10/min análisis, 20/min chat) |
| Cooldown alertas | Redis 30 min entre misma alerta |
| Swagger deshabilitado | En producción (`APP_ENV=production`) |
| `.gitignore .env` | Secretos nunca en repositorio |

---

## 12. Hardware (IoT)

### Pinout completo

```
GPIO 4  → DHT22 DATA (temperatura/humedad aire)
GPIO 5  → DS18B20 DATA (temperatura suelo) + resistencia 10kΩ a 3.3V
GPIO 25 → VCC de todos los sensores (control energía)
GPIO 32 → Capacitive soil AOUT (ADC1_CH4)
GPIO 34 → ML8511 UV OUT (ADC1_CH6, solo entrada)
GPIO 35 → Divisor voltaje batería (ADC1_CH7, solo entrada)
```

### Ciclo operación (cada 15 minutos)

```
Wake → GPIO25 HIGH → Leer sensores → WiFi → NTP
     → MQTT TLS → HiveMQ → surqo/farms/{FARM_ID}/sensors
     → [fallback HTTP si MQTT falla]
     → GPIO25 LOW → WiFi OFF → Deep sleep 10µA
```

### Topic MQTT

```
surqo/farms/{FARM_ID}/sensors
```

### Autonomía

| Config | Ciclo activo | Autonomía 2× 18650 |
|--------|-------------|-------------------|
| 15 min sleep | ~15s activo | ~2 semanas |
| 30 min sleep | ~15s activo | ~4 semanas |

---

## 13. Inteligencia Artificial

### Multi-Provider LLM

```python
LLM_PROVIDER=groq      # Primario: gratis, Llama 3.3 70B, <1s latencia
LLM_PROVIDER=anthropic # Fallback: Claude Haiku 4.x, $0.00025/1K tokens
LLM_PROVIDER=ollama    # Dev local: sin costo, sin red
```

### Límites de tokens por plan

```python
Free:  max_output_tokens = 800   → respuesta concisa
Pro:   max_output_tokens = 2_048 → respuesta completa con más detalle
```

### KPIs Agronómicos

#### VPD (Vapor Pressure Deficit) — Ecuación de Magnus

```python
es = 0.6108 * exp(17.27 * T / (T + 237.3))  # kPa
ea = es * (RH / 100)
VPD = es - ea
# < 0.8 óptimo | 0.8-1.6 aceptable | > 1.6 estrés | > 2.5 crítico
```

#### ETc Penman-Monteith (FAO-56)

```python
ETc = ET0 * Kc
# Kc por cultivo: Maíz=1.15, Café=0.95, Plátano=1.10, Yuca=0.85, Arroz=1.20, Algodón=1.05
```

#### GDD (Grados-Día de Crecimiento)

```python
GDD = max(0, (T_max + T_min) / 2 - T_base)
# T_base: Maíz=10°C, Café=15°C, Plátano=14°C
```

### Prompts YAML versionados

```
prompts/farm_analysis_v1.0.yaml  → análisis principal (KPIs + clima + recomendaciones)
prompts/alert_triage_v1.0.yaml   → clasificar severidad de alertas
prompts/daily_summary_v1.0.yaml  → resumen diario del campo
```

### Costo real por análisis

| Proveedor | Costo | Cuándo |
|-----------|-------|--------|
| Groq (Llama 3.3 70B) | $0.00 | Primario (14.4K req/día gratis) |
| Anthropic Claude Haiku | ~$0.0003 | Fallback si Groq falla |
| Ollama | $0.00 | Solo desarrollo local |

---

## 14. Servicios Externos

| Servicio | Propósito | Tier gratuito | Variable |
|---------|-----------|---------------|----------|
| **Supabase** | PostgreSQL + Auth | 500MB, 50K req/mes | `SUPABASE_URL`, `SUPABASE_KEY` |
| **Supabase Auth** | JWT ES256 | Incluido | JWKS automático |
| **HiveMQ Cloud** | Broker MQTT IoT | 100 conexiones | `HIVEMQ_HOST`, `HIVEMQ_USERNAME`, `HIVEMQ_PASSWORD` |
| **Upstash Redis** | Cache + cooldowns | 10K req/día | `REDIS_URL` |
| **Groq API** | LLM primario | 14.4K req/día | `GROQ_API_KEY` |
| **Anthropic** | LLM fallback | Pago | `ANTHROPIC_API_KEY` |
| **Ollama** | LLM dev local | Gratis | `OLLAMA_BASE_URL` |
| **Open-Meteo** | Pronóstico 7 días | Ilimitado, sin key | — |
| **Resend** | Emails alertas | 3K emails/mes | `RESEND_API_KEY`, `FROM_EMAIL` |
| **Logfire** | Observabilidad | Tier gratuito | `LOGFIRE_TOKEN` |
| **Fly.io** | Backend hosting | 3 VMs shared | `FLY_API_TOKEN` |
| **Vercel** | Frontend hosting | Builds ilimitados | GitHub integration |
| **Hostinger** | Dominio surqo.online | Pago anual | Nameservers → Vercel DNS |

---

## 15. Frontend — Páginas y Flujos

### Páginas Públicas

| Ruta | Descripción |
|------|-------------|
| `/` | Landing: hero glass morphism, problema, solución, hardware, CTA |
| `/como-funciona` | 3 pasos: sensor → IA → decisión |
| `/soluciones` | Por cultivo (maíz, café, plátano, yuca, arroz, algodón) |
| `/preguntas` | FAQ |
| `/privacidad` | Política de privacidad |
| `/terminos` | Términos de servicio |
| `/upgrade` | Comparativa Free vs Pro + CTA contacto |
| `/login` | Autenticación Supabase |
| `/register` | Registro → perfil free automático |

### Páginas Protegidas

| Ruta | Descripción |
|------|-------------|
| `/(app)/dashboard` | KPI cards + gráfica timeseries + feed WebSocket |
| `/(app)/farms` | CRUD fincas (límite 1 en free) |
| `/(app)/sensors` | Monitor tiempo real + historial |
| `/(app)/analyze` | Análisis IA + contador "X de 4 análisis usados" |
| `/(app)/alerts` | Activas + historial + resolver |

### Flujo de usuario — primer uso

```
/register → auto plan free → /login → JWT cookie
→ /dashboard → "Crea tu primera finca"
→ /farms → POST /api/v1/farms/
→ Configura ESP32 con farm_id
→ Datos aparecen en tiempo real por WebSocket
→ /analyze → 4 análisis gratis → HTTP 402 → /upgrade
```

### Protección SSR

```typescript
// middleware.ts
// Verifica cookie Supabase antes de renderizar rutas (app)/
// Sin sesión → redirect /login
export const config = { matcher: ['/(app)/:path*'] }
```

---

## 16. Modelo de Negocio y Freemium

### Planes

| Feature | Free | Pro | Enterprise |
|---------|:----:|:---:|:----------:|
| Precio | $0 | $15–25 USD/mes | Negociado |
| Fincas | **1** | Ilimitadas | Ilimitadas |
| Análisis IA | **4 lifetime** | Ilimitados | Ilimitados |
| Tokens/análisis | 800 | 2.048 | 2.048+ |
| Emails alertas | Ilimitados | Ilimitados | Ilimitados |
| Historial análisis | Últimos 10 | Últimos 10 | Completo |
| Multi-usuario | ✗ | ✗ | ✓ |
| API directa | ✗ | ✗ | ✓ |

### Flujo de conversión actual

```
Free user → agota 4 análisis → HTTP 402
          → /upgrade → CTA contacto WhatsApp/email con Ricardo
          → Admin ejecuta: PATCH /api/v1/users/{id}/plan {"plan": "paid"}
          → Usuario tiene Pro inmediatamente
```

**Pendiente:** Integrar Stripe para automatizar cobro y upgrade.

### Métricas de seguimiento

```sql
-- Usuarios free que agotaron cuota (candidatos a convertir)
SELECT email, analyses_used, tokens_used, created_at
FROM user_profiles
WHERE plan = 'free' AND analyses_used >= 4
ORDER BY created_at DESC;

-- Cerca del límite (para email proactivo)
SELECT email FROM user_profiles
WHERE plan = 'free' AND analyses_used = 3;

-- Tasa de conversión
SELECT
    COUNT(*) FILTER (WHERE plan='free') AS free,
    COUNT(*) FILTER (WHERE plan='paid') AS paid,
    ROUND(100.0 * COUNT(*) FILTER (WHERE plan='paid') / COUNT(*), 1) AS conversion_pct
FROM user_profiles;
```

### Unit Economics (proyección)

- CAC estimado: $10–20 USD (visitas a cooperativas, redes)
- LTV a 12 meses (Pro): $180–300 USD
- Margen bruto: ~85% (stack serverless)
- Breakeven: ~15 usuarios Pro

---

## 17. Despliegue y CI/CD

### GitHub Actions (`.github/workflows/ci-cd.yml`)

```
push/PR a master
     │
     ▼
  [test]
  Ubuntu · Python 3.11 · uv sync --dev
  ruff check app/
  pytest --cov (SQLite in-memory, 86+ tests)
     │
     │ solo en push a master
     ▼
  [deploy-backend]
  flyctl deploy --remote-only
  (requiere secret FLY_API_TOKEN)

Frontend: Vercel GitHub Integration nativa (auto-deploy)
          Preview URLs en cada PR
```

### Comandos de deploy manual

```bash
# Backend
flyctl deploy --remote-only
flyctl logs -a surqo-api
flyctl status

# Frontend
# Push a master → Vercel auto-deploy a surqo.online
```

### DNS surqo.online

```
Registrador: Hostinger
Nameservers: ns1.vercel-dns.com | ns2.vercel-dns.com
SSL: automático por Vercel (Let's Encrypt)
Redirect: surqo.online → www.surqo.online (308 por Vercel)
```

### fly.toml (configuración clave)

```toml
app              = "surqo-api"
primary_region   = "dfw"        # Dallas — más cercano a Colombia

[http_service]
  internal_port        = 8080
  force_https          = true
  auto_stop_machines   = false   # Sin hibernación — siempre disponible
  min_machines_running = 1

[[vm]]
  size   = "shared-cpu-1x"
  memory = "512mb"

[checks.health]
  interval = "30s"
  path     = "/health"
  timeout  = "5s"
```

---

## 18. Costos de Operación

### Stack gratuito hasta ~500 usuarios

| Servicio | Costo/mes | Límite |
|---------|-----------|--------|
| Fly.io | $0–5 | 3 VMs shared |
| Supabase | $0 | 500MB DB |
| Upstash Redis | $0 | 10K req/día |
| Vercel | $0 | Builds ilimitados |
| Groq | $0 | 14.4K req/día |
| Open-Meteo | $0 | Ilimitado |
| Resend | $0–30 | 3K emails/mes |
| Hostinger dominio | ~$15/año | surqo.online |
| **TOTAL** | **$0–35/mes** | Stack producción real |

### Cuándo escalar

| Trigger | Acción | Costo adicional |
|---------|--------|----------------|
| DB > 400MB | Supabase Pro | $25/mes |
| > 14.4K análisis IA/día | Groq pago | $0.14/MTok |
| > 3K emails/mes | Resend Basic | $20/mes |
| Backend necesita más RAM | Fly.io dedicated | $30–50/mes |

---

## 19. Seguridad

Detallado en [sección 11](#11-autenticación-y-seguridad).

### Pendientes de auditoría

- [ ] Validar `farm_id` al ingestar lecturas por HTTP (cualquiera puede escribir en cualquier farm hoy)
- [ ] Rate limiting por `user_id` además de por IP
- [ ] Stripe Webhook signature validation (cuando se integre cobro)
- [ ] CSRF protection en mutaciones SSR

---

## 20. Métricas del Proyecto

| Métrica | Valor |
|---------|-------|
| Archivos Python (backend) | ~50 |
| Endpoints REST | 30+ |
| WebSocket | 1 |
| Páginas frontend | 17 |
| Tablas en DB | 5 |
| Migraciones SQL | 4 |
| Tests automatizados | 86+ |
| Prompts YAML versionados | 3 |
| Variables de entorno | 25+ backend / 4 frontend |
| Cultivos soportados | 6 |
| Sensores por nodo | 5 |
| Proveedores LLM | 3 (Groq, Anthropic, Ollama) |
| Dominio propio | surqo.online |
| Días de desarrollo | 7 |

---

## 21. Roadmap

### Completado ✅

- [x] Nodo sensor ESP32 con firmware PlatformIO (DHT22, DS18B20, ML8511, capacitivo)
- [x] Ingesta MQTT TLS → HiveMQ → Backend
- [x] API REST completa (30+ endpoints)
- [x] WebSocket tiempo real por farm
- [x] KPIs agronómicos (VPD Magnus, ETc Penman-Monteith, GDD, riesgo plagas)
- [x] Análisis IA multi-proveedor (Groq + Claude)
- [x] Alertas automáticas con cooldown Redis (Resend)
- [x] Autenticación Supabase ES256 JWT + SSR cookies
- [x] Freemium: 4 análisis lifetime free, 800 tokens/análisis
- [x] HTTP 402 con CTA de contacto al agotar cuota
- [x] Contadores `analyses_used` + `tokens_used` en DB
- [x] GET /me/plan-limits con cuota completa
- [x] RLS PostgreSQL (aislamiento por usuario)
- [x] Security headers + rate limiting (slowapi)
- [x] Frontend Next.js 15 (App Router, SSR, dark mode)
- [x] CI/CD GitHub Actions → Fly.io + Vercel
- [x] Dominio surqo.online (Hostinger → Vercel DNS)
- [x] 86+ tests automatizados
- [x] Documentación completa

### Próximas iteraciones 🔄

#### v1.1 — Conversión y Retención

- [ ] Email proactivo cuando queda 1 análisis gratuito
- [ ] Contador visual de análisis restantes en UI
- [ ] Stripe Checkout + webhooks para upgrade automático
- [ ] CTA dentro del resultado del análisis free

#### v1.2 — Valor diferenciado Pro

- [ ] Pronóstico 14 días (Pro) vs 3 días (Free)
- [ ] Exportar CSV de datos históricos (Pro)
- [ ] Reporte PDF semanal automático (Pro)
- [ ] Resumen diario IA por email (Pro)

#### v1.3 — Canales alternativos

- [ ] Alertas por WhatsApp (Twilio API)
- [ ] Comandos por WhatsApp ("¿debo regar hoy?")
- [ ] Detección de plagas por foto (Claude Vision)

#### v2.0 — Enterprise

- [ ] Multi-usuario por organización (cooperativas)
- [ ] API pública con API keys
- [ ] Reportes PDF automatizados
- [ ] SLA + soporte técnico
- [ ] LoRaWAN para zonas sin WiFi

#### v3.0 — IA Avanzada

- [ ] Modelo predictivo de rendimiento por cosecha
- [ ] Imágenes satelitales Sentinel-2 + NDVI
- [ ] Fine-tuning con datos de campo colombiano

---

*Documentación actualizada el 2026-06-28 basada en el estado actual del código fuente en [github.com/ricardomb-tech/surqo](https://github.com/ricardomb-tech/surqo)*
