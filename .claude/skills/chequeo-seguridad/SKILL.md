---
name: chequeo-seguridad
description: >-
  Chequeo de seguridad del proyecto Surqo (backend FastAPI + frontend Next.js +
  firmware ESP32). Úsala cuando el usuario pida "revisa la seguridad", "chequeo
  de seguridad", "audita esto", "hay algún hueco/vulnerabilidad", "es seguro
  esto", "revisa antes de desplegar/mergear", o toque autenticación, endpoints,
  formularios, manejo de datos de usuario, secretos/llaves de API, o firmware.
  Enseña a auditar ESTE código en un orden fijo, con la regla de que cada
  hallazgo lleva archivo:línea, severidad y cómo se explota en una frase.
---

# Chequeo de seguridad — Surqo

Guía para auditar la seguridad de **este** repositorio como lo haría un revisor
que ya conoce el código. No es teoría genérica: son los archivos, comandos y
patrones reales de Surqo.

## Qué es este proyecto (contexto mínimo)

- **backend/** — FastAPI (Python 3.11, `uv`). Auth por JWT de Supabase
  verificado contra JWKS (`app/dependencies.py`). Datos multi-tenant en Postgres
  vía SQLAlchemy async. Rate limiting con `slowapi`. Ingesta IoT por MQTT
  (HiveMQ) + fallback HTTP. LLM vía Groq (`app/services/llm_service.py`).
- **frontend/** — Next.js 15 (`frontend/src/`). El token de Supabase se manda
  como `Authorization: Bearer` desde `src/lib/api.ts`. Todas las
  `NEXT_PUBLIC_*` son públicas por diseño (van al browser).
- **firmware/surqo_node/** — ESP32 (C++/PlatformIO). Portal cautivo WiFi +
  identidad por MAC. **Ojo: `config.h` está trackeado en git.**
- **iot-simulator/** — simulador Python de nodos.

El modelo de autorización es la clave del sistema: casi todo dato pertenece a un
usuario a través de una **finca** (`Farm.user_id`). El patrón correcto que se
repite es:

```python
farm = await db.get(Farm, farm_id)
if not farm or farm.user_id != current_user.user_id:
    raise HTTPException(status_code=403, detail="Sin acceso a esta finca")
```

Cualquier endpoint que toque datos de finca/dispositivo/análisis/alerta y **no**
haga esa comprobación (o su equivalente con `is_admin`) es sospechoso.

## Orden de revisión (siempre en este orden)

Sigue estos seis pasos en secuencia. No saltes al paso siguiente sin cerrar el
anterior.

### 1. Secretos expuestos o committeados

Lo más barato de explotar y lo primero que revisa un atacante con el repo.

```bash
# ¿Qué archivos sensibles están trackeados? (.env NO debe salir aquí)
git ls-files | grep -iE '\.env$|config\.h$|secret|credential'

# Secretos reales en el árbol trackeado (Groq, Anthropic, Resend, MQTT, DB)
git grep -nE 'gsk_[A-Za-z0-9_]{10,}|sk-ant-[A-Za-z0-9_-]{10,}|re_[A-Za-z0-9]{10,}|postgresql(\+asyncpg)?://[^ ]*:[^ @]+@|hivemq\.cloud'

# En el histórico (un secreto borrado sigue vivo en git)
git log --all -p -- '**/.env' 'firmware/surqo_node/config.h' | grep -iE 'password|key|token|secret'
```

Puntos fijos que hay que mirar a ojo:
- `firmware/surqo_node/config.h` — está trackeado y contiene `MQTT_USERNAME`,
  `MQTT_PASSWORD` y `AP_PASSWORD` en claro, **compartidos por todos los nodos**.
  Confirma si son las credenciales de producción del broker.
- `.gitignore` — verifica que `.env`, `backend/.env`, `frontend/.env.local`
  siguen ignorados. `frontend/.env.production` SÍ se sube a propósito (solo
  `NEXT_PUBLIC_*`); no lo reportes como fuga salvo que contenga algo que no sea
  `NEXT_PUBLIC_*`.
- `README.md` y `docs/` — deben usar placeholders (`<password>`,
  `tu-cluster.hivemq.cloud`), no valores reales.
- `SUPABASE_KEY` es la **service-role key** (bypassa RLS). Solo puede vivir en el
  backend. Si aparece en `frontend/` o en cualquier `NEXT_PUBLIC_*`, es crítico.

### 2. Validación de lo que entra por cada formulario o endpoint

Recorre `backend/app/routers/*.py`. Para cada `@router.<verbo>`:
- ¿El body es un esquema Pydantic de `app/schemas/` (validado) o un `dict`
  crudo? Los `dict` crudos son sospechosos — ej. `ingest_device_reading(... body: dict ...)`
  en `routers/devices.py` y el consumidor MQTT en `services/ingest_service.py`.
- ¿Los `Query`/`Path` numéricos tienen cotas (`ge=`, `le=`)? Compara con el
  patrón bueno de `routers/sensors.py::get_timeseries` (`hours: int = Query(ge=1, le=8760)`).
- ¿Hay whitelist donde un string escoge comportamiento? Ej. el set
  `allowed_metrics` en `get_timeseries` y el guard de path traversal en
  `routers/analysis.py::evaluate_prompts` (`_PROMPTS_DIR`, `is_relative_to`).
- ¿Los endpoints públicos (sin `CurrentUser`) validan tamaño/forma de entrada?
  Los públicos hoy son: `devices.py::register_device`,
  `devices.py::ingest_device_reading`, el WebSocket `sensors.py::websocket_live`
  (autentica por `token` query param) y el consumidor MQTT.

### 3. Quién puede tocar qué dato (autorización, no solo autenticación)

Este es el paso que más bugs encuentra en Surqo. Autenticado ≠ autorizado.
Para **cada** endpoint que reciba un `id`/`farm_id`/`device_id`/`analysis_id`,
verifica que compara la propiedad contra `current_user`, no solo que hay sesión.

```bash
# Todos los handlers que reciben un recurso por id — cada uno debe checar dueño
git grep -nE 'farm_id|device_id|analysis_id|alert_id' backend/app/routers/
# El chequeo de propiedad correcto
git grep -n 'user_id != current_user.user_id' backend/app/routers/
```

Trampas concretas a revisar:
- **Análisis huérfanos**: en `routers/analysis.py`, `get_analysis`, `chat_with_analysis`
  y `_verify_analysis_access` solo comprueban el dueño **si `analysis.farm_id`
  no es None**. Un análisis sin finca (finca borrada — ver `farms.py::delete_farm`
  que hace `Analysis.farm_id = None`) queda accesible a cualquier usuario
  autenticado que adivine/conozca el UUID. Verifica si sigue así.
- **`admin_update_plan`** (`routers/users.py`) y `evaluate_prompts`
  (`routers/analysis.py`) deben exigir `current_user.is_admin`. Confirma que el
  guard está y que `is_admin` no es escribible por el usuario (revisa
  `models/user.py` y `schemas/user.py`: `UserProfileUpdate` no debe incluir
  `is_admin` ni `plan`).
- **Ingesta sin identidad de dispositivo**: `ingest_device_reading` resuelve la
  finca desde la MAC sin autenticar al emisor. Cualquiera que sepa/adivine una
  MAC puede inyectar lecturas → alertas y correos falsos. Evalúa el impacto real.
- **`claim_code`** = últimos 6 hex de la MAC (`models/device.py::code_from_mac`).
  Baja entropía. Revisa si `claim_device` permite enumerar/reclamar nodos ajenos.

### 4. Inyección

- **SQL**: el proyecto usa SQLAlchemy con expresiones (`select().where(...)`),
  no SQL crudo — seguro por defecto. Busca cualquier excepción:
  ```bash
  git grep -nE 'text\(|execute\(f"|execute\(".*%|\.raw\(|f".*SELECT|f".*WHERE' backend/app/
  ```
- **Prompt injection (LLM)**: datos del usuario (nombre de finca, mensajes de
  chat, imágenes) llegan a Groq en `services/llm_service.py`. Revisa que la
  entrada del usuario no pueda sobrescribir el system prompt ni exfiltrar el
  contexto de otra finca. El contenido del `/chat` se guarda y se re-inyecta como
  `history` — verifica que el `history` que manda el cliente no se confíe como
  autoridad.
- **Path traversal**: patrón ya presente en `evaluate_prompts`. Si aparece otra
  lectura de archivo por nombre controlado por el usuario, exige el mismo
  `resolve()` + `is_relative_to()`.

### 5. Datos sensibles en logs o respuestas

```bash
# ¿Se loguea el token, el body completo, PII, o secretos?
git grep -nE 'logfire\.(info|error|warning)|logger\.(info|error|warning)|print\(' backend/app/ | grep -iE 'token|password|email|payload|body|secret|authorization'
```

- `dependencies.py` loguea errores de verificación JWT — confirma que **no**
  imprime el token en sí.
- `services/ingest_service.py` guarda `raw_payload` completo en la BD
  (`SensorReading.raw_payload`). Verifica que un nodo no pueda meter datos
  sensibles ahí que luego se sirvan a otro usuario.
- Respuestas de error: en prod, `/health` y los `HTTPException(detail=...)` no
  deben filtrar estado interno. `main.py` ya apaga `/docs`, `/redoc`,
  `/openapi.json` en producción (`_is_production`) y recorta `/health` — confirma
  que sigue así.
- CORS: `main.py` usa `settings.CORS_ORIGINS` (lista blanca) con
  `allow_credentials=True`. Verifica que NO haya `"*"` en la lista (con
  credenciales, `*` es una fuga).

### 6. Dependencias con hoyos conocidos

```bash
# Backend (Python) — usa el lockfile real del proyecto
cd backend && uv sync --dev
uv pip list                      # versiones instaladas
# Si hay pip-audit disponible:
uvx pip-audit || echo "pip-audit no instalado — revisa manualmente pyjwt, cryptography, starlette, fastapi"

# Frontend (Node)
cd frontend && npm audit --production
```

Presta atención a `pyjwt`, `cryptography`, `starlette`/`fastapi` (superficie de
auth) y `next` (SSRF/headers). Reporta solo CVEs con ruta de explotación real en
cómo Surqo usa la librería, no todo el ruido de `npm audit`.

## La regla de oro

**Cada hallazgo lleva tres cosas o no es un hallazgo:**

1. **Archivo y línea** exactos (`backend/app/routers/analysis.py:308`).
2. **Severidad** (Crítica / Alta / Media / Baja), justificada por impacto ×
   facilidad de explotación.
3. **Cómo se explota, en una sola frase concreta** — con el actor y el efecto.
   Ejemplo: *"Un usuario autenticado hace `POST /api/v1/analysis/chat` con el
   `analysis_id` de un análisis huérfano y lee el resumen agronómico de otra
   finca."*

Si no puedes escribir la frase de explotación, **no es un hallazgo, es una
opinión.** Va en "Observaciones", no en la lista de hallazgos.

## Antes de reportar: intenta tumbar cada hallazgo

Por cada hallazgo candidato, busca activamente por qué **no** es explotable.
Solo sobreviven los que resisten. Preguntas que lo matan:

- ¿Hay un guard antes en la cadena de `Depends` (`CurrentUser`, `PaidUser`,
  `get_current_user`) que ya lo bloquea?
- ¿El endpoint es realmente alcanzable? (¿está incluido el router en `main.py`?
  ¿el método HTTP existe?)
- ¿Pydantic ya rechaza esa entrada por tipo/validador antes de llegar al código?
- ¿El "secreto" es en realidad público por diseño? (`NEXT_PUBLIC_*`, la anon key
  de Supabase, que está protegida por RLS).
- ¿Existe rate limiting (`@limiter.limit`) que baja la severidad de
  fuerza bruta/enumeración?
- ¿Puedes escribir el request `curl`/paso exacto que lo dispara? Si no, no
  sobrevive.

Deja constancia mental de este paso: si un hallazgo se cae aquí, no lo reportes.

## Formato de salida

```markdown
# Chequeo de seguridad — Surqo (<fecha>, rama <rama>)

## Resumen
<1-2 frases: cuántos hallazgos por severidad y el titular más grave.>

## Hallazgos

### 🔴 Críticos
1. **<Título>** — `archivo:línea`
   - **Explotación:** <una frase: quién hace qué y qué obtiene>
   - **Arreglo:** <cambio concreto, con el código o el comando exacto>

### 🟠 Altos
...

### 🟡 Medios
...

### ⚪ Bajos
...

## Observaciones (no son hallazgos)
<Cosas que huelen mal pero sin ruta de explotación demostrable. Sé honesto:
esto es opinión, no vulnerabilidad.>

## Lo que NO se revisó
<Lista honesta y explícita. Ej.: configuración de RLS en el panel de Supabase
(fuera del repo); reglas de HiveMQ/Fly.io; el bucket de storage; secretos en
GitHub Actions; el simulador; dependencias transitivas sin lockfile auditado;
lógica de negocio de cuotas más allá de la autorización.>
```

Reglas del reporte:
- Ordena por severidad, lo más grave primero.
- Cada hallazgo con su arreglo concreto — no "validar mejor", sino *qué* línea
  cambiar.
- La sección "Lo que NO se revisó" es obligatoria. Un chequeo que dice "todo
  bien" sin decir qué quedó fuera de alcance no es honesto.
