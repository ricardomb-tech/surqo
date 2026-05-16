# Surqo — Arquitectura del sistema

## Flujo de datos

```
ESP32 (campo)
    │ MQTT TLS (8883)
    ▼
HiveMQ Cloud
    │ Consumer background thread
    ▼
FastAPI (Render)
    ├── Supabase PostgreSQL (persist)
    ├── Upstash Redis (cache)
    ├── Anthropic Claude Haiku (LLM)
    ├── Open-Meteo (clima gratis)
    └── WebSocket → Next.js frontend
```

## Decisiones de diseño

### MQTT sobre HTTP directo
El ESP32 usa deep sleep entre lecturas. MQTT con QoS 1 garantiza entrega
incluso si el backend reinicia (Render tiene cold starts). El fallback HTTP
asegura que nunca se pierda una lectura.

### Cache en Redis
Las llamadas a Open-Meteo y los análisis LLM se cachean 1 hora.
Esto reduce latencia (~300ms → ~5ms) y costos de API.

### Prompts en YAML versionados
Tratar prompts como código: versionados, testeados con LLM-judge, comparables
por A/B testing. El endpoint `/evaluate-prompts` ejecuta comparaciones en vivo.

### SQLAlchemy async con asyncpg
FastAPI es completamente async. SQLAlchemy 2.0 + asyncpg evita bloqueos
en operaciones de base de datos bajo carga concurrente.

## Capas

| Capa | Responsabilidad |
|------|----------------|
| `models/` | Definición de tablas (SQLAlchemy) |
| `schemas/` | Validación I/O (Pydantic v2) |
| `services/` | Lógica de negocio (pura, testeable) |
| `routers/` | HTTP handlers (thin, solo orquestación) |
| `websocket/` | WebSocket manager (broadcast en memoria) |
| `prompts/` | Templates LLM versionados (YAML) |
