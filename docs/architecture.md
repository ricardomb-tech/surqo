# Surqo — Arquitectura del sistema

## Flujo de datos

```
ESP32 (campo)
    │ MQTT TLS (8883)
    ▼
HiveMQ Cloud
    │ Consumer background thread
    ▼
FastAPI (Fly.io — Dallas dfw)
    ├── Supabase PostgreSQL (persistencia)
    ├── Upstash Redis (cache TTL)
    ├── Groq / Anthropic / Ollama (LLM multi-proveedor)
    ├── Open-Meteo (pronóstico clima, gratuito)
    └── WebSocket → Next.js frontend (Vercel)
```

## Decisiones de diseño

### Fly.io vs Render
El backend migró de Render (plan gratuito) a Fly.io. Motivación principal: Render hiberna
la máquina tras 15 minutos de inactividad — el primer request tarda hasta 60 segundos.
Fly.io con `auto_stop_machines = false` y `min_machines_running = 1` mantiene siempre al
menos una VM activa. No hay cold starts. Respuesta inmediata desde el primer request.

### MQTT sobre HTTP directo
El ESP32 usa deep sleep entre lecturas. MQTT con QoS 1 garantiza entrega incluso si el
backend reinicia. El fallback HTTP en el firmware asegura que nunca se pierda una lectura.

### LLM multi-proveedor
El `llm_service.py` soporta tres proveedores seleccionables via `LLM_PROVIDER`:
- **Groq** (primario): Llama 3.3 70B — gratuito hasta 14.400 req/día, latencia < 1s
- **Anthropic** (fallback): Claude 4.x — máxima calidad de respuesta
- **Ollama** (local): para desarrollo sin costo ni red

### Cache en Redis
Las llamadas a Open-Meteo y los análisis LLM se cachean 1 hora.
Reduce latencia (~800ms → ~5ms en cache hit) y evita límites de rate de APIs externas.

### Prompts en YAML versionados
Tratar prompts como código: versionados en git, testeables con LLM-judge, comparables
por A/B testing. Los tres prompts actuales son:
- `farm_analysis_v1.0.yaml` — análisis completo de finca por cultivo
- `alert_triage_v1.0.yaml` — clasificación de severidad de alertas
- `daily_summary_v1.0.yaml` — resumen diario de condiciones

### SQLAlchemy async con asyncpg
FastAPI es completamente async. SQLAlchemy 2.0 + asyncpg evita bloqueos
en operaciones de base de datos bajo carga concurrente. Un proceso puede
manejar miles de conexiones simultáneas.

### Sistema de alertas con cooldown Redis
Cuando el backend detecta una violación de umbral (VPD > 1.6 kPa, suelo < 25%,
temp > 38°C), verifica en Redis si ya se envió una alerta para esa finca en los
últimos 30 minutos. El cooldown evita spam de emails sin dejar de registrar la
alerta en la base de datos.

## Capas del backend

| Capa | Responsabilidad |
|------|----------------|
| `models/` | Definición de tablas (SQLAlchemy ORM) |
| `schemas/` | Validación de entrada y salida (Pydantic v2) |
| `services/` | Lógica de negocio (pura, desacoplada, testeable) |
| `routers/` | HTTP handlers (thin — solo orquestación, sin lógica) |
| `websocket/` | WebSocket manager (broadcast en memoria) |
| `prompts/` | Templates LLM versionados (YAML) |
| `dependencies.py` | Inyección de dependencias: CurrentUser, DBSession, PaidUser |

## Infraestructura de producción

| Servicio | Proveedor | Región | Tier |
|---------|-----------|--------|------|
| Backend (FastAPI) | Fly.io | Dallas `dfw` | shared-cpu-1x 512MB |
| Frontend (Next.js) | Vercel | Edge global | Hobby |
| Base de datos | Supabase PostgreSQL | us-east-1 | Free (500MB) |
| Cache | Upstash Redis | us-east-1 | Free (10K req/día) |
| Broker MQTT | HiveMQ Cloud | EU | Free (100 conexiones) |
| Email | Resend | — | Free (3K emails/mes) |
| LLM | Groq | — | Free (14.4K req/día) |
| Clima | Open-Meteo | — | Gratuito sin límite |

## Autenticación — Flujo JWT ES256

```
Supabase Auth emite JWT (ES256, curva P-256)
    │
    │ Authorization: Bearer <jwt>
    ▼
FastAPI dependencies.py
    → ECAlgorithm.from_jwk(X, Y, KID) — construido una vez con @lru_cache
    → jwt.decode(token, key, algorithms=["ES256"])
    → extraer sub (UUID del usuario)
    → get_or_create UserProfile en DB
    → retornar CurrentUser a la ruta
```

La clave pública no se descarga en cada request — se construye al arrancar y se
cachea en memoria para toda la vida del proceso.
