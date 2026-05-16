# Surqo — Del surco al insight

> Inteligencia agroclimática en tiempo real para el campo colombiano.

Plataforma IoT + IA que conecta sensores ESP32 desplegados en fincas con modelos de lenguaje (Claude Haiku) para generar recomendaciones agronómicas accionables en español colombiano.

## Stack

| Capa | Tecnología |
|------|-----------|
| Hardware | ESP32 + DHT22 + DS18B20 + sensor capacitivo |
| Transporte | MQTT TLS → HiveMQ Cloud |
| Backend | FastAPI + SQLAlchemy async + Supabase (PostgreSQL) |
| IA | Anthropic Claude Haiku (`claude-haiku-4-5`) |
| Frontend | Next.js 15 + Tailwind CSS (dark glassmorphism) |
| Tiempo real | WebSocket live feed |
| Observabilidad | Logfire |
| Deploy | Render (backend) · Vercel (frontend) |

## Estructura

```
surqo/
├── backend/          # FastAPI app
│   ├── app/
│   │   ├── routers/  # sensors, farms, analysis, alerts
│   │   ├── services/ # llm_service, kpi_service, climate_service
│   │   ├── models/   # SQLAlchemy models
│   │   └── config.py
│   ├── migrations/   # Alembic
│   └── publish_live.py  # Demo MQTT publisher
└── frontend/         # Next.js app
    └── src/
        ├── app/      # dashboard, analyze, alerts pages
        ├── components/
        └── lib/      # api, websocket clients
```

## KPIs calculados

- **VPD** (Déficit de presión de vapor) — estrés hídrico
- **ETc** — Evapotranspiración del cultivo (Kc × ET₀)
- **GDD** — Grados día de crecimiento
- **Déficit hídrico** — ETc 7d − lluvia 7d
- **Score suelo** — índice compuesto humedad + temperatura + CE
- **Riesgo plagas** — modelo probabilístico por cultivo y condiciones

## Arranque local

### Backend
```bash
cd backend
uv sync
cp .env.example .env   # completar credenciales
uv run alembic upgrade head
uv run uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

---

Hecho con amor para el agricultor colombiano 🌾
