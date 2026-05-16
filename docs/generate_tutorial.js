const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  VerticalAlign, LevelFormat, PageNumber, Header, Footer, ExternalHyperlink,
  PageBreak, TableOfContents,
} = require("docx");
const fs = require("fs");

// ── Helpers ──────────────────────────────────────────────────────────────────

const CONTENT_WIDTH = 9360; // US Letter - 1" margins each side
const GREEN   = "1B5E20";
const LGREEN  = "4CAF50";
const DGREEN  = "2E7D32";
const BLUE    = "1565C0";
const LBLUE   = "E3F2FD";
const LGRAY   = "F5F5F5";
const MGRAY   = "E0E0E0";
const DGRAY   = "424242";
const AMBER   = "E65100";
const WHITE   = "FFFFFF";

const border = (color = "CCCCCC") => ({ style: BorderStyle.SINGLE, size: 1, color });
const borders = (color = "CCCCCC") => ({ top: border(color), bottom: border(color), left: border(color), right: border(color) });
const noBorders = () => {
  const nb = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  return { top: nb, bottom: nb, left: nb, right: nb };
};

function h1(text, anchor) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    pageBreakBefore: true,
    spacing: { before: 0, after: 240 },
    children: [new TextRun({ text, font: "Arial", size: 36, bold: true, color: DGREEN })],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 320, after: 160 },
    children: [new TextRun({ text, font: "Arial", size: 28, bold: true, color: BLUE })],
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, font: "Arial", size: 24, bold: true, color: DGRAY })],
  });
}

function h4(text) {
  return new Paragraph({
    spacing: { before: 180, after: 80 },
    children: [new TextRun({ text, font: "Arial", size: 22, bold: true, color: AMBER })],
  });
}

function p(text, opts = {}) {
  return new Paragraph({
    spacing: { before: 60, after: 120 },
    children: [new TextRun({ text, font: "Arial", size: 22, color: "212121", ...opts })],
  });
}

function pRich(runs) {
  return new Paragraph({
    spacing: { before: 60, after: 120 },
    children: runs.map(([text, opts = {}]) =>
      new TextRun({ text, font: "Arial", size: 22, color: "212121", ...opts })
    ),
  });
}

function bullet(text, level = 0) {
  return new Paragraph({
    numbering: { reference: "bullets", level },
    spacing: { before: 40, after: 40 },
    children: [new TextRun({ text, font: "Arial", size: 22, color: "212121" })],
  });
}

function bulletRich(runs, level = 0) {
  return new Paragraph({
    numbering: { reference: "bullets", level },
    spacing: { before: 40, after: 40 },
    children: runs.map(([text, opts = {}]) =>
      new TextRun({ text, font: "Arial", size: 22, color: "212121", ...opts })
    ),
  });
}

function numbered(text, level = 0) {
  return new Paragraph({
    numbering: { reference: "numbers", level },
    spacing: { before: 40, after: 40 },
    children: [new TextRun({ text, font: "Arial", size: 22, color: "212121" })],
  });
}

function code(text) {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    indent: { left: 360 },
    children: [new TextRun({ text, font: "Courier New", size: 18, color: "1B5E20" })],
  });
}

function codeBlock(lines) {
  return lines.map(line => code(line));
}

function divider() {
  return new Paragraph({
    spacing: { before: 120, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: MGRAY, space: 1 } },
    children: [],
  });
}

function spacer() {
  return new Paragraph({ spacing: { before: 0, after: 80 }, children: [] });
}

function note(text) {
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [200, CONTENT_WIDTH - 200],
    rows: [new TableRow({
      children: [
        new TableCell({
          borders: noBorders(),
          width: { size: 200, type: WidthType.DXA },
          shading: { fill: "FFF9C4", type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 120, right: 80 },
          children: [new Paragraph({ children: [new TextRun({ text: "💡", size: 22 })] })],
        }),
        new TableCell({
          borders: noBorders(),
          width: { size: CONTENT_WIDTH - 200, type: WidthType.DXA },
          shading: { fill: "FFF9C4", type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 80, right: 120 },
          children: [new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text, font: "Arial", size: 22, italics: true, color: "5D4037" })] })],
        }),
      ],
    })],
  });
}

function infoBox(title, content, bg = LBLUE, titleColor = BLUE) {
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [CONTENT_WIDTH],
    rows: [
      new TableRow({
        children: [new TableCell({
          borders: borders("1565C0"),
          width: { size: CONTENT_WIDTH, type: WidthType.DXA },
          shading: { fill: bg, type: ShadingType.CLEAR },
          margins: { top: 120, bottom: 120, left: 180, right: 180 },
          children: [
            new Paragraph({ spacing: { before: 0, after: 80 }, children: [new TextRun({ text: title, font: "Arial", size: 22, bold: true, color: titleColor })] }),
            ...content.map(line => new Paragraph({ spacing: { before: 0, after: 40 }, children: [new TextRun({ text: line, font: "Arial", size: 20, color: "212121" })] })),
          ],
        })],
      }),
    ],
  });
}

function twoColTable(col1Header, col2Header, rows, widths = [4000, 5360]) {
  const headerRow = new TableRow({
    children: [
      new TableCell({
        borders: borders(DGREEN),
        width: { size: widths[0], type: WidthType.DXA },
        shading: { fill: DGREEN, type: ShadingType.CLEAR },
        margins: { top: 100, bottom: 100, left: 140, right: 140 },
        children: [new Paragraph({ children: [new TextRun({ text: col1Header, font: "Arial", size: 20, bold: true, color: WHITE })] })],
      }),
      new TableCell({
        borders: borders(DGREEN),
        width: { size: widths[1], type: WidthType.DXA },
        shading: { fill: DGREEN, type: ShadingType.CLEAR },
        margins: { top: 100, bottom: 100, left: 140, right: 140 },
        children: [new Paragraph({ children: [new TextRun({ text: col2Header, font: "Arial", size: 20, bold: true, color: WHITE })] })],
      }),
    ],
  });
  const dataRows = rows.map(([c1, c2], i) =>
    new TableRow({
      children: [
        new TableCell({
          borders: borders("BBDEFB"),
          width: { size: widths[0], type: WidthType.DXA },
          shading: { fill: i % 2 === 0 ? LGRAY : WHITE, type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 140, right: 80 },
          children: [new Paragraph({ children: [new TextRun({ text: c1, font: "Courier New", size: 18, bold: true, color: DGREEN })] })],
        }),
        new TableCell({
          borders: borders("BBDEFB"),
          width: { size: widths[1], type: WidthType.DXA },
          shading: { fill: i % 2 === 0 ? LGRAY : WHITE, type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 80, right: 140 },
          children: [new Paragraph({ children: [new TextRun({ text: c2, font: "Arial", size: 20, color: "212121" })] })],
        }),
      ],
    })
  );
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: widths,
    rows: [headerRow, ...dataRows],
  });
}

function interviewBox(question, answer) {
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [CONTENT_WIDTH],
    rows: [new TableRow({
      children: [new TableCell({
        borders: borders(AMBER),
        width: { size: CONTENT_WIDTH, type: WidthType.DXA },
        shading: { fill: "FFF3E0", type: ShadingType.CLEAR },
        margins: { top: 120, bottom: 120, left: 180, right: 180 },
        children: [
          new Paragraph({ spacing: { before: 0, after: 80 }, children: [new TextRun({ text: "🎤 Pregunta de entrevista: " + question, font: "Arial", size: 21, bold: true, color: AMBER })] }),
          new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: "✅ Respuesta: " + answer, font: "Arial", size: 20, italics: true, color: DGRAY })] }),
        ],
      })],
    })],
  });
}

// ── Document ─────────────────────────────────────────────────────────────────

const doc = new Document({
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [
          { level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 540, hanging: 360 } } } },
          { level: 1, format: LevelFormat.BULLET, text: "◦", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 900, hanging: 360 } } } },
        ],
      },
      {
        reference: "numbers",
        levels: [
          { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 540, hanging: 360 } } } },
          { level: 1, format: LevelFormat.LOWER_LETTER, text: "%2.", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 900, hanging: 360 } } } },
        ],
      },
    ],
  },
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, font: "Arial", color: DGREEN },
        paragraph: { spacing: { before: 480, after: 240 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Arial", color: BLUE },
        paragraph: { spacing: { before: 320, after: 160 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: DGRAY },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 2 } },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1260, bottom: 1440, left: 1260 },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: LGREEN, space: 1 } },
            spacing: { before: 0, after: 120 },
            children: [
              new TextRun({ text: "🌾 Surqo — Tutorial Técnico Completo ", font: "Arial", size: 18, color: "616161" }),
              new TextRun({ text: "| ", font: "Arial", size: 18, color: LGREEN }),
              new TextRun({ text: "Ricardo Martínez", font: "Arial", size: 18, bold: true, color: DGREEN }),
            ],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            border: { top: { style: BorderStyle.SINGLE, size: 4, color: MGRAY, space: 1 } },
            spacing: { before: 120, after: 0 },
            children: [
              new TextRun({ text: "Del surco al insight  ·  Página ", font: "Arial", size: 18, color: "9E9E9E" }),
              new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 18, color: "9E9E9E" }),
              new TextRun({ text: " de ", font: "Arial", size: 18, color: "9E9E9E" }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], font: "Arial", size: 18, color: "9E9E9E" }),
            ],
          })],
        }),
      },
      children: [
        // ═══════════════════════════════════════════════════════════════════
        // PORTADA
        // ═══════════════════════════════════════════════════════════════════
        new Paragraph({ spacing: { before: 0, after: 600 }, children: [] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 100 },
          children: [new TextRun({ text: "🌾", size: 80 })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 160 },
          children: [new TextRun({ text: "SURQO", font: "Arial", size: 72, bold: true, color: DGREEN })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 80 },
          children: [new TextRun({ text: "Tutorial Técnico Completo", font: "Arial", size: 36, bold: true, color: BLUE })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 80 },
          children: [new TextRun({ text: "Del surco al insight — Inteligencia agroclimática para el campo colombiano", font: "Arial", size: 24, italics: true, color: "546E7A" })],
        }),
        spacer(),
        new Table({
          width: { size: 7000, type: WidthType.DXA },
          columnWidths: [7000],
          rows: [new TableRow({ children: [new TableCell({
            borders: borders(LGREEN),
            width: { size: 7000, type: WidthType.DXA },
            shading: { fill: "E8F5E9", type: ShadingType.CLEAR },
            margins: { top: 180, bottom: 180, left: 360, right: 360 },
            children: [
              new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 60 }, children: [new TextRun({ text: "Proyecto full-stack IoT + IA para Colombia", font: "Arial", size: 22, bold: true, color: DGREEN })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 40 }, children: [new TextRun({ text: "ESP32  ·  MQTT  ·  FastAPI  ·  PostgreSQL  ·  Redis", font: "Arial", size: 20, color: DGRAY })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 40 }, children: [new TextRun({ text: "Claude Haiku (IA)  ·  Next.js  ·  Render  ·  Vercel", font: "Arial", size: 20, color: DGRAY })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 40, after: 0 }, children: [new TextRun({ text: "Ricardo Martínez — Junior Developer / Analista IA  ·  2026", font: "Arial", size: 20, bold: true, color: BLUE })] }),
            ],
          })] })],
        }),
        new Paragraph({ spacing: { before: 0, after: 0 }, children: [new PageBreak()] }),

        // ═══════════════════════════════════════════════════════════════════
        // ÍNDICE
        // ═══════════════════════════════════════════════════════════════════
        new TableOfContents("Tabla de Contenidos", { hyperlink: true, headingStyleRange: "1-3" }),
        new Paragraph({ spacing: { before: 0, after: 0 }, children: [new PageBreak()] }),

        // ═══════════════════════════════════════════════════════════════════
        // 1. QUÉ ES SURQO
        // ═══════════════════════════════════════════════════════════════════
        h1("1. ¿Qué es Surqo?"),
        p("Surqo es una plataforma IoT + IA para agricultores colombianos de pequeña escala, especialmente en la región Caribe (Montería, Córdoba). Su nombre viene de la palabra surco — la línea que traza el arado en la tierra — y su promesa es \"del surco al insight\": convertir datos del campo en decisiones inteligentes."),
        spacer(),
        h2("1.1 El problema que resuelve"),
        p("Los agricultores del campo colombiano enfrentan tres problemas simultáneos:"),
        bullet("Falta de información en tiempo real sobre el estado de sus cultivos (humedad, temperatura, plagas)"),
        bullet("Acceso limitado a asesoría agronómica calificada y costosa"),
        bullet("Pérdidas por irrigación ineficiente o reacción tardía a condiciones climáticas extremas"),
        spacer(),
        p("Surqo resuelve esto colocando sensores baratos (ESP32 < $5 USD) en el campo, procesando los datos con IA (Claude Haiku de Anthropic) y entregando recomendaciones precisas en lenguaje colombiano coloquial, como si fuera un amigo agrónomo hablando por WhatsApp."),
        spacer(),
        h2("1.2 Flujo de datos de punta a punta"),
        infoBox("Flujo completo del sistema", [
          "1. Sensor ESP32 en campo  →  Lee temperatura aire/suelo, humedad, UV, batería cada 15 min",
          "2. MQTT TLS (HiveMQ Cloud)  →  Publica JSON en topic surqo/farms/{id}/sensors",
          "3. FastAPI Backend (Render)  →  Recibe mensaje, guarda en PostgreSQL, verifica umbrales",
          "4. Redis (Upstash)  →  Cachea análisis LLM y cooldown de emails (30 min/finca)",
          "5. Claude Haiku (Anthropic)  →  Analiza clima + sensor, genera recomendaciones en español",
          "6. WebSocket  →  Transmite lecturas en tiempo real al dashboard",
          "7. Next.js Dashboard (Vercel)  →  Muestra gráficas, alertas, KPIs al agricultor",
          "8. Resend  →  Envía email de alerta si hay condición crítica",
        ], LBLUE, BLUE),
        spacer(),
        h2("1.3 Tecnologías y por qué se eligieron"),
        twoColTable("Tecnología", "Por qué se eligió", [
          ["ESP32 DevKit v1", "Microcontrolador con WiFi/Bluetooth integrado, bajo costo (~$4), perfecto para IoT agrícola"],
          ["FastAPI (Python)", "Framework moderno async, auto-genera documentación OpenAPI, tipado con Pydantic"],
          ["PostgreSQL (Supabase)", "Base de datos robusta con UUID nativos, timezone support, hosted gratuito para MVPs"],
          ["Redis (Upstash)", "Cache in-memory para reducir llamadas LLM caras, cooldown de alertas. Gratis hasta 10k ops/día"],
          ["MQTT (HiveMQ)", "Protocolo ligero para IoT, funciona con paquetes de bytes, TLS para seguridad. HiveMQ tiene tier gratuito"],
          ["Claude Haiku (Anthropic)", "LLM rápido y barato (~$0.00025/1k tokens input), contexto de agronomía colombiana"],
          ["Open-Meteo API", "API meteorológica gratuita, sin clave, cubre toda Colombia con datos en tiempo real"],
          ["Next.js 14 App Router", "SSR/SSG para SEO, componentes React modernos, Vercel deployment con un clic"],
          ["Recharts", "Librería de gráficas React, declarativa, responsive, sin costo"],
          ["Resend", "API de email transaccional, entrega confiable, tier gratuito 3000 emails/mes"],
          ["Logfire (Pydantic)", "Observabilidad nativa para FastAPI + Pydantic, traces automáticos, gratis hasta 100MB/mes"],
          ["GitHub Actions", "CI/CD gratuito hasta 2000 min/mes, integración nativa con el repositorio"],
          ["Render", "Deploy de backend Python con Dockerfile, SSL automático, tier gratuito disponible"],
          ["Vercel", "Deploy de Next.js optimizado, CDN global, integración con GitHub en un clic"],
        ]),

        // ═══════════════════════════════════════════════════════════════════
        // 2. ARQUITECTURA
        // ═══════════════════════════════════════════════════════════════════
        h1("2. Arquitectura del Sistema"),
        h2("2.1 Arquitectura general"),
        p("Surqo sigue una arquitectura de microservicios livianos con tres capas principales:"),
        numbered("Capa de recolección (Edge): Sensores ESP32 + firmware C++"),
        numbered("Capa de procesamiento (Backend): FastAPI + SQLAlchemy + servicios especializados"),
        numbered("Capa de presentación (Frontend): Next.js + WebSocket + REST API"),
        spacer(),
        h2("2.2 Estructura de carpetas del proyecto"),
        ...codeBlock([
          "surqo/",
          "├── backend/                    # FastAPI API REST + WebSocket + MQTT",
          "│   ├── app/",
          "│   │   ├── main.py             # Entrypoint FastAPI + lifespan",
          "│   │   ├── config.py           # Settings con Pydantic BaseSettings",
          "│   │   ├── database.py         # SQLAlchemy async engine + sesiones",
          "│   │   ├── dependencies.py     # Inyección de dependencias FastAPI",
          "│   │   ├── models/             # Modelos ORM (SQLAlchemy)",
          "│   │   │   ├── farm.py         # Tabla farms",
          "│   │   │   ├── sensor_reading.py  # Tabla sensor_readings",
          "│   │   │   ├── alert.py        # Tabla alerts",
          "│   │   │   └── analysis.py     # Tabla analyses",
          "│   │   ├── schemas/            # Esquemas Pydantic (request/response)",
          "│   │   ├── routers/            # Endpoints FastAPI",
          "│   │   │   ├── farms.py        # CRUD fincas",
          "│   │   │   ├── sensors.py      # Lecturas + WebSocket",
          "│   │   │   ├── analysis.py     # Análisis LLM",
          "│   │   │   ├── alerts.py       # Alertas + email",
          "│   │   │   └── kpis.py         # KPIs agrícolas",
          "│   │   ├── services/           # Lógica de negocio",
          "│   │   │   ├── llm_service.py  # Claude Haiku + PromptEvaluator",
          "│   │   │   ├── climate_service.py  # Open-Meteo + cálculos",
          "│   │   │   ├── mqtt_service.py # Consumer MQTT + proceso de lecturas",
          "│   │   │   ├── alert_service.py # Umbrales + email + cooldown",
          "│   │   │   ├── kpi_service.py  # VPD, ETc, estrés hídrico, plagas",
          "│   │   │   └── cache_service.py # Redis async wrapper",
          "│   │   ├── prompts/            # Prompts YAML versionados",
          "│   │   │   ├── farm_analysis_v1.0.yaml",
          "│   │   │   ├── alert_triage_v1.0.yaml",
          "│   │   │   └── daily_summary_v1.0.yaml",
          "│   │   └── websocket/",
          "│   │       └── manager.py      # WebSocketManager (conexiones por finca)",
          "│   ├── tests/                  # 52 tests con pytest + SQLite in-memory",
          "│   ├── Dockerfile              # Imagen Python 3.11-slim + uv",
          "│   ├── pyproject.toml          # Dependencias + configuración",
          "│   └── render.yaml             # Deploy declarativo en Render",
          "├── frontend/                   # Next.js 14 App Router",
          "│   └── src/",
          "│       ├── app/                # Páginas (App Router)",
          "│       ├── components/         # Componentes React",
          "│       └── lib/                # API client + WebSocket hook",
          "├── firmware/                   # Código ESP32 (C++ / Arduino)",
          "│   └── surqo_node/",
          "│       ├── surqo_node.ino      # Firmware principal",
          "│       └── config.h            # Credenciales y pines",
          "├── iot-simulator/              # Simulador Python del sensor",
          "│   └── simulator.py",
          "├── .github/workflows/          # CI/CD GitHub Actions",
          "│   └── ci-cd.yml",
          "└── .env.example                # Template de variables de entorno",
        ]),

        // ═══════════════════════════════════════════════════════════════════
        // 3. BACKEND — FastAPI
        // ═══════════════════════════════════════════════════════════════════
        h1("3. Backend — FastAPI"),
        h2("3.1 ¿Qué es FastAPI y por qué es moderno?"),
        p("FastAPI es un framework Python para APIs REST construido sobre Starlette (ASGI) y Pydantic. Sus características principales que lo hacen superior a Flask o Django REST:"),
        bullet("Async nativo: usa async/await, no bloquea el event loop mientras espera BD o APIs externas"),
        bullet("Tipado: cada endpoint tiene tipos Python → FastAPI valida automáticamente los datos de entrada"),
        bullet("Auto-documentación: genera Swagger UI en /docs y ReDoc en /redoc sin configuración extra"),
        bullet("Inyección de dependencias: sistema nativo para compartir DB sessions, servicios, etc."),
        spacer(),
        h2("3.2 Arranque de la aplicación — lifespan"),
        p("El archivo main.py usa el patrón lifespan de FastAPI para inicializar y destruir recursos al arrancar/detener el servidor:"),
        ...codeBlock([
          "# main.py",
          "@asynccontextmanager",
          "async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:",
          "    await init_db()          # Crea tablas si no existen",
          "    if settings.HIVEMQ_HOST and settings.HIVEMQ_USERNAME:",
          "        _mqtt_service.start_background()  # Inicia consumer MQTT",
          "    yield                    # La app está corriendo",
          "    _mqtt_service.stop()     # Limpieza al apagar",
        ]),
        spacer(),
        interviewBox(
          "¿Qué diferencia hay entre WSGI y ASGI?",
          "WSGI (Flask, Django clásico) es síncrono: un hilo por request, bloqueante. ASGI (FastAPI, Starlette) es asíncrono: un solo proceso maneja miles de requests concurrentes con async/await. Crítico para IoT donde recibimos muchos mensajes MQTT simultáneos."
        ),
        spacer(),
        h2("3.3 Configuración con Pydantic Settings"),
        p("El archivo config.py usa pydantic-settings para leer variables de entorno y el archivo .env de forma tipada:"),
        ...codeBlock([
          "# config.py",
          "class Settings(BaseSettings):",
          "    model_config = SettingsConfigDict(env_file='.env', extra='ignore')",
          "    ANTHROPIC_API_KEY: str = ''",
          "    DATABASE_URL: str = 'postgresql+asyncpg://...'",
          "    REDIS_URL: str = 'redis://localhost:6379'",
          "    HIVEMQ_HOST: str = 'broker.hivemq.com'",
          "    RESEND_API_KEY: str = ''",
          "    FROM_EMAIL: str = 'alertas@surqo.io'",
          "    APP_ENV: str = 'development'",
        ]),
        spacer(),
        p("Ventaja clave: si una variable requerida falta al arrancar, Pydantic lanza un error inmediatamente con el nombre exacto de la variable. Esto previene errores silenciosos en producción."),
        spacer(),
        interviewBox(
          "¿Qué es Pydantic y para qué sirve?",
          "Pydantic es una librería de validación de datos con Python type hints. Convierte JSON a objetos Python tipados, valida automáticamente tipos, formatos y constraints, y serializa de vuelta a JSON. En FastAPI, cada request body y response usa un modelo Pydantic — si el JSON llega mal formado, FastAPI retorna automáticamente un 422 con el detalle del error."
        ),
        spacer(),
        h2("3.4 Routers y endpoints"),
        p("La API está dividida en 5 routers, cada uno con su prefijo:"),
        twoColTable("Router", "Endpoints principales", [
          ["/api/v1/farms", "POST / (crear finca), GET / (listar), GET /{id}, GET /{id}/kpis"],
          ["/api/v1/sensors", "POST /reading (ingestar dato), GET /latest/{device}, GET /timeseries/{farm}, WS /live/{farm}"],
          ["/api/v1/analysis", "POST /analyze (llamar LLM), GET /history/{farm}, POST /evaluate-prompts"],
          ["/api/v1/alerts", "GET /active, GET /history, PATCH /{id}/resolve, POST /{id}/notify"],
          ["/api/v1/kpis", "GET /farm/{id}, GET /farm/{id}/vpd-history, GET /farm/{id}/pest-risk"],
        ]),
        spacer(),
        h2("3.5 Inyección de dependencias — DBSession"),
        p("FastAPI usa Depends() para inyectar la sesión de base de datos en cada endpoint sin repetir código:"),
        ...codeBlock([
          "# dependencies.py",
          "async def get_db() -> AsyncGenerator[AsyncSession, None]:",
          "    async with AsyncSessionLocal() as session:",
          "        yield session",
          "        # El contexto cierra la sesión automáticamente",
          "",
          "DBSession = Annotated[AsyncSession, Depends(get_db)]",
          "",
          "# En el router:",
          "@router.get('/active')",
          "async def get_active_alerts(db: DBSession) -> list[Alert]:",
          "    # db es una AsyncSession lista para usar",
          "    ...",
        ]),
        spacer(),
        note("El patrón Annotated[Type, Depends(fn)] es la forma moderna en FastAPI (3.10+) de declarar dependencias. Evita repetir Depends(get_db) en cada parámetro."),

        // ═══════════════════════════════════════════════════════════════════
        // 4. BASE DE DATOS
        // ═══════════════════════════════════════════════════════════════════
        h1("4. Base de Datos — PostgreSQL + SQLAlchemy"),
        h2("4.1 SQLAlchemy 2.0 async"),
        p("SQLAlchemy es el ORM (Object-Relational Mapper) más maduro de Python. La versión 2.0 introdujo un API async completamente nuevo. En Surqo usamos el modo declarativo con type hints de Python:"),
        ...codeBlock([
          "# models/sensor_reading.py",
          "class SensorReading(Base):",
          "    __tablename__ = 'sensor_readings'",
          "",
          "    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)",
          "    device_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)",
          "    soil_moisture_pct: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)",
          "    air_temp_c: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)",
          "    vpd_kpa: Mapped[float | None] = mapped_column(Numeric(5, 3), nullable=True)",
          "    raw_payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)",
          "    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())",
          "",
          "    # Índice compuesto para queries por dispositivo y tiempo",
          "    __table_args__ = (Index('ix_sensor_device_time', 'device_id', 'created_at'),)",
        ]),
        spacer(),
        interviewBox(
          "¿Qué es un ORM y cuándo NO usarlo?",
          "ORM mapea tablas SQL a objetos Python automáticamente. Ventaja: no escribes SQL, menos bugs de concatenación. Desventaja: consultas N+1 (cargar objetos relacionados uno a uno) y SQL generado ineficiente para queries complejas. En Surqo usamos lazy='noload' en las relaciones para evitar cargas accidentales, y select() explícito con joins cuando se necesita."
        ),
        spacer(),
        h2("4.2 Supabase — PostgreSQL hosted"),
        p("Supabase es un backend-as-a-service construido sobre PostgreSQL. Surqo lo usa exclusivamente como base de datos PostgreSQL (no como API REST de Supabase). Ventajas para un proyecto demo:"),
        bullet("Tier gratuito con 500MB y 2 proyectos"),
        bullet("Panel web para ver tablas, ejecutar SQL y ver logs en tiempo real"),
        bullet("Connection pooler (Supavisor) para manejar muchas conexiones simultáneas"),
        bullet("SSL automático, backups diarios, restauración point-in-time"),
        spacer(),
        p("Configuración especial para el transaction pooler de Supabase:"),
        ...codeBlock([
          "# database.py",
          "_connect_args = {}",
          "if 'pooler.supabase.com' in settings.DATABASE_URL:",
          "    # El transaction pooler no soporta prepared statements nombrados",
          "    _connect_args = {'statement_cache_size': 0}",
          "",
          "engine = create_async_engine(",
          "    settings.DATABASE_URL,",
          "    pool_size=5,       # Conexiones persistentes al pool",
          "    max_overflow=10,   # Conexiones adicionales bajo carga",
          "    pool_pre_ping=True, # Verifica conexión antes de usarla",
          "    connect_args=_connect_args,",
          ")",
        ]),
        spacer(),
        h2("4.3 Índices de base de datos"),
        p("Los índices son críticos para performance. Surqo tiene índices en:"),
        bullet("device_id (index=True): búsquedas de última lectura por dispositivo"),
        bullet("(device_id, created_at): queries de series de tiempo por dispositivo"),
        bullet("(farm_id, created_at): series de tiempo por finca"),
        bullet("created_at en sensor_readings: queries de ventana de tiempo (últimas 24h)"),
        spacer(),
        interviewBox(
          "¿Cuándo creas un índice y qué costo tiene?",
          "Creas un índice en columnas que aparecen frecuentemente en WHERE, ORDER BY o JOIN. El costo: cada INSERT/UPDATE es más lento porque PostgreSQL debe actualizar el índice. Para series de tiempo de IoT (millones de rows), el índice (farm_id, created_at) es esencial — sin él, una query de 'últimas 24 horas' haría full table scan."
        ),

        // ═══════════════════════════════════════════════════════════════════
        // 5. REDIS — CACHE
        // ═══════════════════════════════════════════════════════════════════
        h1("5. Redis — Caché y Cooldown"),
        h2("5.1 ¿Qué es Redis y cómo funciona?"),
        p("Redis es una base de datos in-memory (almacena en RAM) key-value. Lectura/escritura en microsegundos versus milisegundos de PostgreSQL. En Surqo tiene dos usos:"),
        spacer(),
        twoColTable("Uso en Surqo", "Detalle técnico", [
          ["Cache de análisis LLM", "Key: analysis:{lat}:{lon}:{crop} | TTL: 3600s (1 hora) | Evita repetir llamadas a Claude que cuestan $0.001"],
          ["Cooldown de emails de alerta", "Key: alert_email_cooldown:{farm_id} | TTL: 1800s (30 min) | Previene spam de alertas al mismo agricultor"],
          ["Cache de datos climáticos", "Key: climate:{lat}:{lon} | TTL: 3600s | Open-Meteo permite 10k calls/día gratuitos"],
        ]),
        spacer(),
        h2("5.2 CacheService — wrapper async"),
        p("El CacheService de Surqo es un thin wrapper sobre redis.asyncio que maneja errores silenciosamente (Redis down no debe romper el flujo principal):"),
        ...codeBlock([
          "# services/cache_service.py",
          "class CacheService:",
          "    async def get(self, key: str) -> dict | None:",
          "        try:",
          "            client = await self._get_client()",
          "            raw = await client.get(key)",
          "            return json.loads(raw) if raw else None",
          "        except Exception as e:",
          "            logger.warning('Cache GET error: %s', e)  # Silencioso",
          "            return None",
          "",
          "    async def set(self, key: str, value: dict, ttl: int) -> None:",
          "        try:",
          "            await client.setex(key, ttl, json.dumps(value, default=str))",
          "        except Exception as e:",
          "            logger.warning('Cache SET error: %s', e)  # Silencioso",
        ]),
        spacer(),
        note("TTL (Time To Live) = tiempo en segundos que Redis guarda el dato. Cuando vence, Redis borra la clave automáticamente. setex(key, ttl, value) hace SET + EXPIRE en una sola operación atómica."),
        spacer(),
        h2("5.3 Upstash Redis — hosted serverless"),
        p("Upstash es Redis serverless (paga por request, no por servidor corriendo 24/7). Para Surqo es perfecto porque:"),
        bullet("Tier gratuito: 10,000 comandos/día, 256MB"),
        bullet("Conexión por URL: redis://... o rediss://... (TLS)"),
        bullet("Ideal para apps con tráfico bajo/medio como esta demo"),
        spacer(),
        interviewBox(
          "¿Cuándo usar Redis vs PostgreSQL para cache?",
          "Redis cuando necesitas lectura/escritura < 1ms y los datos son temporales (análisis LLM, sesiones, rate limiting). PostgreSQL cuando los datos deben ser persistentes y consistentes. Nunca uses Redis como única fuente de verdad — es volátil (puede perder datos en reinicio si no está configurado con AOF/RDB)."
        ),

        // ═══════════════════════════════════════════════════════════════════
        // 6. MQTT e IoT
        // ═══════════════════════════════════════════════════════════════════
        h1("6. IoT — ESP32 + MQTT + HiveMQ"),
        h2("6.1 ¿Qué es MQTT y por qué es el protocolo estándar de IoT?"),
        p("MQTT (Message Queuing Telemetry Transport) es un protocolo de mensajería publish-subscribe diseñado específicamente para dispositivos con recursos limitados y conexiones poco confiables. Sus ventajas sobre HTTP:"),
        twoColTable("Característica", "MQTT vs HTTP", [
          ["Overhead por mensaje", "MQTT: 2 bytes mínimo | HTTP: 200+ bytes (headers)"],
          ["Modelo de comunicación", "MQTT: Pub/Sub (desacoplado) | HTTP: Request/Response (acoplado)"],
          ["Conexión", "MQTT: persistente (keep-alive) | HTTP: nueva conexión por request"],
          ["Consumo de batería", "MQTT: menor (menos transmisión) | HTTP: mayor"],
          ["QoS (calidad de servicio)", "MQTT: 0 (fire-and-forget), 1 (al menos una vez), 2 (exactamente una vez)"],
          ["TLS/SSL", "Ambos soportan. MQTT usa puerto 8883 con TLS"],
        ]),
        spacer(),
        h2("6.2 Estructura del topic MQTT en Surqo"),
        p("Los topics MQTT son rutas jerárquicas separadas por /. Surqo usa:"),
        ...codeBlock([
          "# Estructura del topic:",
          "surqo/farms/{farm_uuid}/sensors",
          "",
          "# Ejemplos reales:",
          "surqo/farms/123e4567-e89b-12d3-a456-426614174000/sensors",
          "",
          "# El backend suscribe con wildcard + (un nivel):",
          "surqo/farms/+/sensors",
          "# El + captura cualquier farm_id y lo extrae del topic",
        ]),
        spacer(),
        h2("6.3 Payload JSON del sensor"),
        ...codeBlock([
          "{",
          '  "device_id": "ESP32-NODE-001",',
          '  "farm_id": "123e4567-e89b-12d3-a456-426614174000",',
          '  "timestamp": "2026-05-16T10:30:00-05:00",',
          '  "firmware_version": "1.0.0",',
          '  "battery_mv": 3750,',
          '  "rssi_dbm": -62,',
          '  "sensors": {',
          '    "soil_moisture_pct": 45.2,',
          '    "soil_temp_c": 27.8,',
          '    "air_temp_c": 31.4,',
          '    "air_humidity_pct": 68.0,',
          '    "light_uv_index": 6.8',
          "  }",
          "}",
        ]),
        spacer(),
        h2("6.4 SurqoMQTTService — Consumer backend"),
        p("El consumer MQTT corre en un hilo separado (porque paho-mqtt es síncrono) pero procesa los mensajes en el event loop async de FastAPI:"),
        ...codeBlock([
          "# services/mqtt_service.py — patrón hilo + event loop",
          "def _on_message(self, client, userdata, msg):",
          "    payload = json.loads(msg.payload.decode())",
          "    # run_coroutine_threadsafe 'inyecta' una coroutine async",
          "    # desde el hilo síncrono al event loop de FastAPI",
          "    asyncio.run_coroutine_threadsafe(",
          "        self._process_reading(payload, farm_id),",
          "        self._loop,   # El event loop del proceso principal",
          "    )",
          "",
          "async def _process_reading(self, payload, farm_id):",
          "    # 1. Guarda lectura en PostgreSQL",
          "    # 2. Busca owner_email de la finca",
          "    # 3. Verifica umbrales → crea alertas → envía email (con cooldown)",
          "    # 4. Broadcast al WebSocket del dashboard",
        ]),
        spacer(),
        interviewBox(
          "¿Cómo manejas concurrencia entre un hilo síncrono (paho-mqtt) y un event loop async (FastAPI)?",
          "Con asyncio.run_coroutine_threadsafe(coro, loop). Este método es thread-safe: desde cualquier hilo, programa una coroutine para ejecutarse en el event loop especificado. Es como 'enviar una tarea' al event loop desde afuera. Sin esto, llamar await desde un hilo diferente al del event loop lanzaría un RuntimeError."
        ),
        spacer(),
        h2("6.5 Firmware ESP32 — Arquitectura"),
        p("El firmware en C++ (Arduino framework) usa el patrón wake → read → publish → sleep:"),
        ...codeBlock([
          "void setup() {  // Se ejecuta en cada ciclo después del deep sleep",
          "    // 1. Activar sensores (voltaje al pin de power)",
          "    digitalWrite(SENSOR_POWER_PIN, HIGH);",
          "    delay(SENSOR_WARMUP_MS);  // 500ms para estabilizar",
          "",
          "    // 2. Leer todos los sensores",
          "    SensorData data = readAllSensors();",
          "",
          "    // 3. Publicar: primero MQTT, fallback HTTP si MQTT falla",
          "    if (connectMQTT()) publishSensorData(data);",
          "    else fallbackHTTP(data);",
          "",
          "    // 4. Apagar sensores + dormir 15 minutos",
          "    digitalWrite(SENSOR_POWER_PIN, LOW);",
          "    esp_sleep_enable_timer_wakeup(SLEEP_MINUTES * 60 * 1000000ULL);",
          "    esp_deep_sleep_start();",
          "}",
          "",
          "void loop() {}  // Nunca se ejecuta — ESP32 duerme entre ciclos",
        ]),
        spacer(),
        h2("6.6 Sensores físicos y su lectura"),
        twoColTable("Sensor", "Qué mide + cómo se lee", [
          ["DHT22", "Temperatura y humedad del aire. Protocolo 1-Wire digital. Se promedian 3 lecturas válidas de 5 intentos para filtrar ruido"],
          ["DS18B20", "Temperatura del suelo. Protocolo OneWire. Resolución 12 bits = 0.0625°C. Requiere 750ms de conversión"],
          ["Capacitive Soil v2", "Humedad del suelo (capacitancia). Lectura ADC 12-bit (0-4095). Se promedia 10 muestras. Requiere calibración SOIL_DRY_ADC / SOIL_WET_ADC"],
          ["ML8511", "Índice UV. Lectura ADC → voltaje → UV por calibración lineal. Rango 0-11 UV"],
          ["Divisor de voltaje", "Nivel de batería LiPo. R1=R2=100kΩ → factor 2. ADC * (3300/4095) * 2 = mV reales"],
        ]),
        spacer(),
        h2("6.7 Reconexión con backoff exponencial"),
        p("Si el broker MQTT se desconecta, el servicio reintenta con delays crecientes para no saturar la red:"),
        ...codeBlock([
          "RECONNECT_DELAYS = [1, 2, 4, 8, 16, 32, 60]  # segundos",
          "",
          "def _on_disconnect(self, client, userdata, rc, properties=None):",
          "    delay = RECONNECT_DELAYS[min(self._reconnect_attempt, 6)]",
          "    self._reconnect_attempt += 1",
          "    time.sleep(delay)  # 1s → 2s → 4s → ... → 60s máximo",
          "    client.reconnect()",
        ]),

        // ═══════════════════════════════════════════════════════════════════
        // 7. IA — CLAUDE HAIKU + PROMPT ENGINEERING
        // ═══════════════════════════════════════════════════════════════════
        h1("7. Inteligencia Artificial — Claude Haiku + Prompt Engineering"),
        h2("7.1 Por qué Claude Haiku para agronomía"),
        p("Surqo usa Claude Haiku (claude-haiku-4-5-20251001) por tres razones:"),
        bullet("Velocidad: responde en 1-3 segundos, adecuado para análisis en tiempo casi real"),
        bullet("Costo: $0.25/1M tokens input y $1.25/1M tokens output (el análisis completo cuesta ~$0.0003)"),
        bullet("Calidad de razonamiento: entiende contexto agronómico colombiano y genera texto coloquial coherente"),
        spacer(),
        interviewBox(
          "¿Qué son los tokens en un LLM?",
          "Tokens son fragmentos de texto — aproximadamente 4 caracteres en inglés o 3 en español. 'Agricultura' = ~4 tokens. La API cobra por tokens consumidos, no por caracteres ni palabras. El contexto máximo de Claude Haiku es 200K tokens (~150K palabras), aunque Surqo usa prompts de ~500 tokens por eficiencia."
        ),
        spacer(),
        h2("7.2 Prompts versionados en YAML"),
        p("Una decisión de arquitectura clave: los prompts se almacenan en archivos YAML versionados, no hardcodeados en Python. Esto permite:"),
        bullet("Editar prompts sin tocar código (solo cambiar el YAML)"),
        bullet("A/B testing entre versiones v1.0 vs v1.1 con el PromptEvaluator"),
        bullet("Control de versiones explícito en git (se puede ver qué cambió en cada prompt)"),
        bullet("Separación de concerns: ingeniería de prompts vs ingeniería de software"),
        spacer(),
        p("Estructura del prompt farm_analysis_v1.0.yaml:"),
        ...codeBlock([
          "version: '1.0.0'",
          "model: 'claude-haiku-4-5-20251001'",
          "temperature: 0.2    # Bajo = más determinista, menos creativo",
          "max_tokens: 1024",
          "",
          "system_prompt: |",
          "  Eres SurqoAnalyst, sistema experto en agronomía tropical colombiana.",
          "  SIEMPRE respondes en JSON válido exacto. NUNCA inventas datos.",
          "  El 'summary_for_farmer' debe sonar como WhatsApp de un amigo agrónomo.",
          "",
          "user_template: |",
          "  FINCA: {farm_name}",
          "  CULTIVO: {crop_type}",
          "  CLIMA 7 DÍAS: Temp {temp_min}-{temp_max}°C | Lluvia {rain_total}mm",
          "  SENSOR: Humedad suelo {soil_moisture}% | Temp {air_temp_c}°C",
          "  Responde ÚNICAMENTE con este JSON...",
        ]),
        spacer(),
        h2("7.3 Técnicas de prompt engineering usadas"),
        twoColTable("Técnica", "Implementación en Surqo", [
          ["Role prompting", "'Eres SurqoAnalyst, experto en agronomía tropical colombiana' — define identidad y expertise del modelo"],
          ["Output format constraints", "El prompt especifica el JSON exacto que debe retornar, con ejemplo de estructura completa"],
          ["Temperature control", "0.2 = más determinista para datos agronómicos. Alta temperatura generaría recomendaciones inconsistentes"],
          ["Few-shot implícito", "El formato JSON con ejemplos de valores (priority: 1, category: 'irrigation') guía el modelo"],
          ["Lenguaje localizado", "'Lenguaje coloquial colombiano', 'como WhatsApp de un amigo' ajusta el tono para el usuario objetivo"],
          ["Anti-alucinación", "'NUNCA inventas datos' + 'menciona el dato que lo justifica' reduce invención de información"],
        ]),
        spacer(),
        h2("7.4 LLM-as-judge — evaluación automática de prompts"),
        p("El PromptEvaluator usa Claude Haiku para evaluar sus propias respuestas (LLM-as-judge), una técnica avanzada de AI:"),
        ...codeBlock([
          "# services/llm_service.py — PromptEvaluator.llm_judge()",
          "async def llm_judge(self, output: str, context: dict) -> float:",
          "    response = await self.llm.client.messages.create(",
          "        model=settings.LLM_MODEL,",
          "        max_tokens=50,",
          "        system='Eres un evaluador experto en agronomía colombiana.',",
          "        messages=[{'role': 'user', 'content': (",
          "            'Evalúa esta respuesta agronómica del 0.0 al 1.0 según:\\n'",
          "            'precisión(0.4) + accionabilidad(0.3) + completitud(0.2) + formato(0.1)'",
          "            f'RESPUESTA:\\n{output[:500]}'",
          "            'Responde SOLO con un número decimal entre 0.0 y 1.0'",
          "        )}],",
          "    )",
          "    return float(response.content[0].text.strip())",
        ]),
        spacer(),
        p("El endpoint POST /analysis/evaluate-prompts permite comparar v1 vs v2 en múltiples casos de prueba y recibe una recomendación automática de cuál usar basada en calidad, latencia y costo."),
        spacer(),
        h2("7.5 Extracción robusta de JSON del LLM"),
        p("Los LLMs a veces envuelven el JSON en bloques de código markdown. El LLMService lo maneja:"),
        ...codeBlock([
          "raw_text = response.content[0].text.strip()",
          "if '```json' in raw_text:",
          "    raw_text = raw_text.split('```json')[1].split('```')[0].strip()",
          "elif '```' in raw_text:",
          "    raw_text = raw_text.split('```')[1].split('```')[0].strip()",
          "data = json.loads(raw_text)  # Aquí sí puede fallar → manejar excepción",
        ]),
        spacer(),
        interviewBox(
          "¿Cuál es el riesgo de dependencia de un LLM en producción?",
          "Tres riesgos principales: (1) Latencia variable: el LLM puede tardar 1s o 10s. Solución: usar BackgroundTasks para análisis no urgentes. (2) Cambios de modelo: Anthropic puede deprecar claude-haiku — el modelo está en settings.LLM_MODEL, no hardcodeado. (3) JSON inválido: el LLM puede no cumplir el formato. Solución: validar con json.loads y campos requeridos en response_required_fields del YAML."
        ),

        // ═══════════════════════════════════════════════════════════════════
        // 8. KPIs AGRÍCOLAS
        // ═══════════════════════════════════════════════════════════════════
        h1("8. KPIs Agrícolas — La Ciencia Detrás del Sistema"),
        h2("8.1 VPD — Déficit de Presión de Vapor"),
        p("El VPD (Vapor Pressure Deficit) es el indicador más importante del estrés hídrico de las plantas. Mide la diferencia entre el vapor de agua que el aire puede contener y el que realmente contiene:"),
        ...codeBlock([
          "# services/kpi_service.py",
          "def calculate_vpd(self, temp_c: float, humidity_pct: float) -> float:",
          "    # Fórmula de Magnus — presión de vapor de saturación (kPa)",
          "    es = 0.6108 * math.exp(17.27 * temp_c / (temp_c + 237.3))",
          "    # Presión de vapor actual",
          "    ea = es * humidity_pct / 100",
          "    return max(0.0, round(es - ea, 3))",
          "",
          "# Interpretación:",
          "# < 0.4 kPa = demasiado húmedo, riesgo de hongos",
          "# 0.4 - 1.6 kPa = óptimo para la mayoría de cultivos",
          "# > 1.6 kPa = estrés hídrico, la planta cierra estomas",
          "# > 2.5 kPa = estrés crítico, marchitamiento inminente",
        ]),
        spacer(),
        h2("8.2 ETc — Evapotranspiración del Cultivo"),
        p("La ETc mide cuánta agua consume el cultivo por día, combinando la evapotranspiración de referencia (ET0, calculada por Open-Meteo según el método FAO Penman-Monteith) con el coeficiente de cultivo Kc:"),
        ...codeBlock([
          "# ETc = ET0 × Kc",
          "KC_COEFFICIENTS = {",
          "    'maíz': 1.15,   # El maíz consume 15% más agua que la referencia",
          "    'café': 0.95,   # El café consume 5% menos",
          "    'plátano': 1.10,",
          "    'arroz': 1.20,  # El arroz es el cultivo más exigente en agua",
          "    'yuca': 0.85,   # La yuca es resistente a sequía",
          "}",
          "",
          "def calculate_etc(self, et0: float, crop_type: str) -> float:",
          "    kc = self.KC_COEFFICIENTS.get(crop_type.lower(), 1.0)",
          "    return round(et0 * kc, 2)  # mm/día",
        ]),
        spacer(),
        h2("8.3 Déficit hídrico y estrés hídrico"),
        p("El déficit hídrico indica si necesita riego. El índice de estrés (0-10) combina déficit con humedad del suelo:"),
        ...codeBlock([
          "# Déficit = lo que el cultivo necesita menos lo que llovió",
          "deficit = max(0, ETc_7d - rain_7d)  # mm",
          "",
          "# Índice de estrés (0-10) — combina humedad del suelo + déficit",
          "# Humedad < 20% → +5 puntos de estrés",
          "# Humedad 20-30% → +3 puntos",
          "# Déficit > 30mm en la semana → +4 puntos adicionales",
        ]),
        spacer(),
        h2("8.4 Riesgo de plagas"),
        p("El riesgo de plagas se calcula con un modelo de reglas basado en temperatura y humedad:"),
        ...codeBlock([
          "# Alta temperatura + alta humedad = condiciones ideales para hongos",
          "if temp_c > 25 and humidity_pct > 80:",
          "    risk_pct = 75  # Riesgo muy alto",
          "    pathogens = ['roya', 'fusarium', 'pudrición de mazorca']  # para maíz",
        ]),
        spacer(),
        interviewBox(
          "¿Por qué calculas KPIs en Python si ya tienes un LLM?",
          "Los KPIs son deterministas y verificables (VPD tiene una fórmula exacta de la FAO). El LLM es para razonamiento en lenguaje natural y contextualización. Separarlos permite: (1) testear los KPIs unitariamente sin costo LLM, (2) proveer los KPIs calculados como contexto al LLM para que razone mejor, (3) mostrar KPIs en el dashboard independientemente del análisis LLM."
        ),

        // ═══════════════════════════════════════════════════════════════════
        // 9. WEBSOCKETS Y TIEMPO REAL
        // ═══════════════════════════════════════════════════════════════════
        h1("9. WebSockets — Dashboard en Tiempo Real"),
        h2("9.1 WebSocket vs HTTP polling"),
        p("El dashboard de Surqo muestra lecturas de sensores en tiempo real sin que el usuario tenga que refrescar la página. Esto se logra con WebSocket, no con polling HTTP:"),
        twoColTable("Polling HTTP", "WebSocket", [
          ["Cliente pregunta cada N segundos: '¿hay datos nuevos?'", "El servidor envía datos apenas llegan, sin que el cliente pregunte"],
          ["N requests/minuto aunque no haya datos nuevos", "0 requests cuando no hay datos — solo una conexión persistente"],
          ["Latencia = intervalo de polling (ej: 5s de retraso)", "Latencia < 100ms — el dato llega casi instantáneo"],
          ["Simple de implementar", "Requiere gestionar conexiones activas en el servidor"],
        ]),
        spacer(),
        h2("9.2 WebSocketManager — Conexiones por finca"),
        p("El manager mantiene un diccionario de conexiones activas agrupadas por farm_id:"),
        ...codeBlock([
          "# websocket/manager.py",
          "class WebSocketManager:",
          "    def __init__(self):",
          "        self.active_connections: dict[str, list[WebSocket]] = {}",
          "        # {'farm-uuid-1': [ws1, ws2], 'farm-uuid-2': [ws3]}",
          "",
          "    async def broadcast_to_farm(self, farm_id: str, data: dict):",
          "        # Envía a TODOS los clientes del dashboard de esa finca",
          "        for ws in self.active_connections.get(farm_id, []):",
          "            try:",
          "                await ws.send_text(json.dumps(data, default=str))",
          "            except Exception:",
          "                dead.append(ws)  # Conexión rota — limpiar",
        ]),
        spacer(),
        h2("9.3 Hook React useWebSocket"),
        p("En el frontend, un React custom hook maneja la conexión WebSocket con reconexión automática:"),
        ...codeBlock([
          "// lib/websocket.ts",
          "export function useWebSocket<T>(farmId: string | null) {",
          "  const [data, setData] = useState<T | null>(null)",
          "  const [connected, setConnected] = useState(false)",
          "",
          "  const connect = useCallback(() => {",
          "    const ws = new WebSocket(`${WS_BASE}/api/v1/sensors/ws/live/${farmId}`)",
          "    ws.onmessage = (event) => {",
          "      const msg = JSON.parse(event.data)",
          "      if (msg.type === 'sensor_reading') setData(msg.data)",
          "    }",
          "    ws.onclose = () => {",
          "      setConnected(false)",
          "      setTimeout(connect, 3000)  // Reconectar en 3 segundos",
          "    }",
          "  }, [farmId])",
          "",
          "  useEffect(() => { connect() }, [connect])",
          "  return { data, connected }",
          "}",
        ]),

        // ═══════════════════════════════════════════════════════════════════
        // 10. ALERTAS Y EMAIL
        // ═══════════════════════════════════════════════════════════════════
        h1("10. Sistema de Alertas y Email"),
        h2("10.1 Arquitectura del sistema de alertas"),
        p("El sistema de alertas tiene tres capas:"),
        numbered("Detección: check_thresholds() compara lecturas del sensor contra umbrales fijos"),
        numbered("Persistencia: create_alert() guarda la alerta en PostgreSQL con severidad y acción recomendada"),
        numbered("Notificación: send_email_alert() envía HTML email vía Resend con cooldown de Redis"),
        spacer(),
        h2("10.2 Umbrales de detección"),
        twoColTable("Variable", "Umbral Warning / Critical", [
          ["soil_moisture_pct", "< 25% Warning | < 15% Critical"],
          ["air_temp_c", "> 38°C Warning | > 42°C Critical"],
          ["vpd_kpa", "> 1.6 kPa Warning | > 2.5 kPa Critical"],
          ["battery_mv", "< 3400mV Warning | < 3200mV Critical"],
        ]),
        spacer(),
        h2("10.3 Cooldown con Redis — evitar spam"),
        p("El cooldown previene que el mismo agricultor reciba decenas de emails por hora si el sensor está en condición crítica sostenida:"),
        ...codeBlock([
          "# services/alert_service.py",
          "async def _send_with_cooldown(self, db, farm_id, ...):",
          "    cooldown_key = f'alert_email_cooldown:{farm_id}'",
          "    # Verificar si ya hay un email enviado recientemente",
          "    cached = await cache_service.get(cooldown_key)",
          "    if cached:",
          "        return False  # Ya se envió, omitir",
          "",
          "    sent = await self.send_email_alert(...)  # Enviar email",
          "    if sent:",
          "        # Activar cooldown por 30 minutos",
          "        await cache_service.set(cooldown_key, {'sent': True}, ttl=1800)",
          "    return sent",
          "",
          "# IMPORTANTE: si Redis está caído, el email se envía de todas formas",
          "# No queremos que la caída de Redis bloquee alertas críticas",
        ]),
        spacer(),
        h2("10.4 Resend — Transactional Email API"),
        p("Resend es una API de email transaccional moderna. En Surqo usamos su SDK Python:"),
        ...codeBlock([
          "import resend",
          "resend.api_key = settings.RESEND_API_KEY",
          "",
          "params: resend.Emails.SendParams = {",
          "    'from': settings.FROM_EMAIL,  # alertas@surqo.io",
          "    'to': [owner_email],",
          "    'subject': f'🔴 Surqo — Alerta CRITICAL: {farm_name}',",
          "    'html': '<h2>...</h2>...',  # HTML responsive con colores por severidad",
          "}",
          "resend.Emails.send(params)",
        ]),
        spacer(),
        interviewBox(
          "¿Por qué usar un servicio de email transaccional en lugar de SMTP directo?",
          "SMTP directo (enviar desde tu propio servidor) tiene problemas: (1) Alta probabilidad de caer en spam sin configurar SPF, DKIM, DMARC correctamente. (2) Necesitas mantener el servidor de email 24/7. (3) Sin analytics de entrega. Resend/SendGrid/Mailgun manejan la reputación del dominio, reintentos automáticos y métricas de entrega."
        ),

        // ═══════════════════════════════════════════════════════════════════
        // 11. FRONTEND — NEXT.JS
        // ═══════════════════════════════════════════════════════════════════
        h1("11. Frontend — Next.js 14 + Recharts"),
        h2("11.1 Next.js App Router"),
        p("Next.js 14 introdujo el App Router, que reemplaza el Pages Router anterior. Las diferencias clave:"),
        twoColTable("Pages Router (legacy)", "App Router (Next.js 14)", [
          ["pages/dashboard.tsx", "app/dashboard/page.tsx"],
          ["getServerSideProps, getStaticProps", "Fetch directo en Server Components (async/await)"],
          ["Todo es Client Component por defecto", "Todo es Server Component por defecto"],
          ["_app.tsx para providers globales", "app/layout.tsx para layout raíz"],
          ["API Routes en pages/api/", "Route Handlers en app/api/"],
        ]),
        spacer(),
        h2("11.2 Estructura del frontend Surqo"),
        ...codeBlock([
          "src/",
          "├── app/",
          "│   ├── layout.tsx          # Layout raíz: ThemeProvider, navegación global",
          "│   ├── page.tsx            # Home: descripción del proyecto + links",
          "│   ├── dashboard/page.tsx  # Dashboard con gráficas en tiempo real",
          "│   ├── analyze/page.tsx    # Formulario de análisis LLM + resultado",
          "│   ├── sensors/page.tsx    # Historial de lecturas de sensores",
          "│   └── alerts/page.tsx     # Panel de alertas activas + historial",
          "├── components/",
          "│   ├── SensorChart.tsx     # Gráfica de series de tiempo (Recharts)",
          "│   ├── LiveFeed.tsx        # Feed en tiempo real vía WebSocket",
          "│   ├── KPICard.tsx         # Tarjeta de KPI individual",
          "│   ├── AlertBadge.tsx      # Badge de severidad de alerta",
          "│   └── AnalysisResult.tsx  # Resultado del análisis LLM formateado",
          "├── lib/",
          "│   ├── api.ts              # Cliente REST tipado (farmAPI, analysisAPI...)",
          "│   └── websocket.ts        # Hook useWebSocket con reconexión automática",
          "└── types/index.ts          # Tipos TypeScript de todos los modelos",
        ]),
        spacer(),
        h2("11.3 API Client tipado con TypeScript"),
        p("El archivo api.ts centraliza todas las llamadas al backend en funciones tipadas:"),
        ...codeBlock([
          "// lib/api.ts",
          "async function fetchJSON<T>(path: string, options?: RequestInit): Promise<T> {",
          "  const resp = await fetch(`${API_BASE}${path}`, {...options})",
          "  if (!resp.ok) throw new Error((await resp.json()).detail)",
          "  return resp.json()",
          "}",
          "",
          "export const analysisAPI = {",
          "  analyze: (data: AnalysisRequest) =>",
          "    fetchJSON<Analysis>('/api/v1/analysis/analyze', {",
          "      method: 'POST',",
          "      body: JSON.stringify(data),",
          "    }),",
          "}",
          "",
          "// Uso en un componente:",
          "const result = await analysisAPI.analyze({ farm_name, lat, lon, crop_type })",
          "// result es Analysis — TypeScript conoce todos sus campos",
        ]),
        spacer(),
        interviewBox(
          "¿Qué es TypeScript y por qué usarlo en un frontend?",
          "TypeScript es un superset de JavaScript que añade tipado estático opcional. Ventajas: (1) Autocompletado en el editor — saber qué campos tiene un objeto Analysis. (2) Errores en tiempo de compilación, no en producción. (3) Refactoring seguro. Desventaja: más verboso. En Surqo, los tipos en types/index.ts reflejan exactamente los esquemas Pydantic del backend."
        ),

        // ═══════════════════════════════════════════════════════════════════
        // 12. TESTING
        // ═══════════════════════════════════════════════════════════════════
        h1("12. Testing — 52 Tests con pytest"),
        h2("12.1 Filosofía de testing en Surqo"),
        p("Surqo tiene 52 tests que cubren 4 categorías:"),
        twoColTable("Archivo de test", "Qué testea", [
          ["test_kpi_service.py", "Cálculos de VPD, ETc, GDD, salud del suelo, riesgo de plagas — verifican fórmulas matemáticas exactas"],
          ["test_climate_service.py", "ClimateService: VPD, cálculo de estrés hídrico, nombre de ubicación fallback"],
          ["test_llm_service.py", "Carga de prompts YAML, caché de prompts, cálculo de costo LLM — sin llamar a la API real"],
          ["test_api_farms.py", "Endpoints REST completos con base de datos SQLite in-memory"],
          ["test_alert_service.py", "Umbrales, envío de email (Resend mockeado), cooldown de Redis, resiliencia"],
        ]),
        spacer(),
        h2("12.2 SQLite in-memory para tests de API"),
        p("Los tests de API usan SQLite en memoria en lugar de PostgreSQL real. Esto elimina la dependencia externa y hace los tests reproducibles:"),
        ...codeBlock([
          "# tests/conftest.py",
          "TEST_DATABASE_URL = 'sqlite+aiosqlite:///:memory:'",
          "",
          "engine_test = create_async_engine(TEST_DATABASE_URL, echo=False)",
          "TestSessionLocal = async_sessionmaker(engine_test, ...)",
          "",
          "# Override del get_db de producción con el de test:",
          "app.dependency_overrides[get_db] = override_get_db",
          "",
          "# En el fixture de sesión, crear todas las tablas:",
          "@pytest_asyncio.fixture(scope='session', autouse=True)",
          "async def create_tables():",
          "    async with engine_test.begin() as conn:",
          "        await conn.run_sync(Base.metadata.create_all)",
          "    yield",
          "    # Drop all al terminar la sesión de tests",
        ]),
        spacer(),
        h2("12.3 Mocking con unittest.mock"),
        p("Para los tests del AlertService, se mockea Resend y Redis para no hacer llamadas reales:"),
        ...codeBlock([
          "# tests/test_alert_service.py",
          "def test_send_success(self, svc):",
          "    with patch('resend.Emails.send', return_value={'id': 'test-id'}) as mock:",
          "        result = await svc.send_email_alert(...)",
          "    assert result is True",
          "    mock.assert_called_once()  # Verificar que SÍ se llamó",
          "",
          "def test_cooldown_active_skips_email(self, svc):",
          "    with patch('app.services.cache_service.cache_service') as mock_cache:",
          "        mock_cache.get = AsyncMock(return_value={'sent': True})",
          "        result = await svc._send_with_cooldown(...)",
          "    assert result is False  # No envió porque hay cooldown activo",
        ]),
        spacer(),
        interviewBox(
          "¿Qué diferencia hay entre un mock y un stub?",
          "Un stub retorna valores fijos sin verificar cómo fue llamado. Un mock retorna valores fijos Y además verifica que fue llamado correctamente (cuántas veces, con qué argumentos). En pytest usamos MagicMock/AsyncMock de unittest.mock que son mocks: mock.assert_called_once() falla si no se llamó exactamente una vez."
        ),

        // ═══════════════════════════════════════════════════════════════════
        // 13. CI/CD
        // ═══════════════════════════════════════════════════════════════════
        h1("13. CI/CD — GitHub Actions + Render + Vercel"),
        h2("13.1 Pipeline CI/CD completo"),
        p("El archivo .github/workflows/ci-cd.yml define el pipeline que se ejecuta en cada push a main o pull request:"),
        ...codeBlock([
          "on:",
          "  push:",
          "    branches: [main]",
          "  pull_request:",
          "    branches: [main]",
          "",
          "jobs:",
          "  test:           # 1. Instalar uv, lint con ruff, correr 52 tests",
          "  deploy-backend: # 2. Solo en push a main: trigger hook de Render",
          "  deploy-frontend: # 3. Solo en push a main: deploy a Vercel",
          "  notify-deploy:  # 4. Resume si ambos deployments tuvieron éxito",
        ]),
        spacer(),
        h2("13.2 Secrets de GitHub requeridos"),
        twoColTable("Secret", "Dónde conseguirlo", [
          ["ANTHROPIC_API_KEY", "console.anthropic.com → API Keys"],
          ["SUPABASE_URL / SUPABASE_KEY", "Supabase Dashboard → Project → API"],
          ["RESEND_API_KEY", "resend.com → API Keys"],
          ["LOGFIRE_TOKEN", "pydantic.dev/logfire → Tokens"],
          ["RENDER_DEPLOY_HOOK", "Render → Service → Settings → Deploy Hooks"],
          ["VERCEL_TOKEN", "Vercel → Settings → Tokens"],
          ["VERCEL_ORG_ID / VERCEL_PROJECT_ID", "Vercel → Project → Settings → General"],
        ]),
        spacer(),
        h2("13.3 Render — Deploy del backend"),
        p("Render usa el archivo render.yaml como configuración declarativa del servicio:"),
        ...codeBlock([
          "# backend/render.yaml",
          "services:",
          "  - type: web",
          "    name: surqo-api",
          "    runtime: python",
          "    rootDir: backend",
          "    buildCommand: 'pip install uv && uv sync'",
          "    startCommand: 'uv run uvicorn app.main:app --host 0.0.0.0 --port $PORT'",
          "    healthCheckPath: /health",
          "    envVars:",
          "      - key: APP_ENV",
          "        value: production",
          "      - key: ANTHROPIC_API_KEY",
          "        sync: false  # Configura manualmente en el dashboard de Render",
        ]),
        spacer(),
        h2("13.4 uv — Gestor de paquetes moderno"),
        p("Surqo usa uv (de Astral, los creadores de Ruff) como reemplazo de pip + venv. Es 10-100x más rápido porque está escrito en Rust:"),
        twoColTable("Comando pip/venv", "Equivalente con uv", [
          ["python -m venv venv && source venv/bin/activate", "uv venv (automático)"],
          ["pip install -r requirements.txt", "uv sync (lee pyproject.toml)"],
          ["pip install -r requirements-dev.txt", "uv sync --dev"],
          ["pip install fastapi", "uv add fastapi"],
          ["pip freeze > requirements.txt", "uv lock (genera uv.lock)"],
          ["python -m uvicorn app.main:app", "uv run uvicorn app.main:app"],
        ]),
        spacer(),
        interviewBox(
          "¿Qué es un Deploy Hook de Render?",
          "Un Deploy Hook es una URL HTTPS especial que al recibir un POST HTTP triggera automáticamente un redeploy del servicio. GitHub Actions usa curl para llamar esa URL al hacer push a main. Render descarga el nuevo código de GitHub, construye la imagen Docker y reemplaza el contenedor en ejecución con zero downtime (si el healthcheck en /health pasa)."
        ),

        // ═══════════════════════════════════════════════════════════════════
        // 14. OBSERVABILIDAD
        // ═══════════════════════════════════════════════════════════════════
        h1("14. Observabilidad — Logfire"),
        h2("14.1 ¿Qué es observabilidad?"),
        p("Observabilidad es la capacidad de entender el estado interno de un sistema a partir de sus outputs externos. Sus tres pilares:"),
        bullet("Logs: registro textual de eventos (ERROR, WARNING, INFO)"),
        bullet("Métricas: datos numéricos agregados (requests/s, latencia promedio, errores %)"),
        bullet("Trazas (Traces): recorrido de una request a través de múltiples servicios"),
        spacer(),
        h2("14.2 Logfire en Surqo"),
        p("Logfire es la solución de observabilidad de Pydantic, con integración nativa en FastAPI. Surqo lo usa para:"),
        ...codeBlock([
          "# Traza manual con span:",
          "with logfire.span('llm.analyze_farm', farm=farm_name, crop=crop_type):",
          "    # Todo el código dentro del span está trazado",
          "    climate_data = await climate_svc.fetch_forecast(lat, lon)",
          "    result = await llm_svc.analyze_farm(...)",
          "",
          "# Log de evento:",
          "logfire.info('Análisis completado', farm=farm_name, cost=result.cost_usd)",
          "",
          "# Instrumentación automática de FastAPI:",
          "if settings.LOGFIRE_TOKEN:",
          "    logfire.instrument_fastapi(app)  # Traza cada endpoint automáticamente",
        ]),
        spacer(),
        p("Logfire muestra en su dashboard: qué endpoints son más lentos, cuánto cuesta cada análisis LLM, cuántas alertas se disparan por hora, y cualquier excepción con su stack trace completo."),

        // ═══════════════════════════════════════════════════════════════════
        // 15. VARIABLES DE ENTORNO Y SEGURIDAD
        // ═══════════════════════════════════════════════════════════════════
        h1("15. Variables de Entorno y Seguridad"),
        h2("15.1 .env vs GitHub Secrets vs variables de runtime"),
        twoColTable("Dónde se usa", "Para qué", [
          [".env (local)", "Desarrollo local. En .gitignore — NUNCA se commitea. Se copia de .env.example"],
          ["GitHub Secrets", "CI/CD en GitHub Actions. Encriptados, no visibles en logs"],
          ["Render envVars (sync: false)", "Producción en Render. Se configuran manualmente en el dashboard"],
          ["Vercel Environment Variables", "Frontend en Vercel. Prefijo NEXT_PUBLIC_ para variables del cliente"],
        ]),
        spacer(),
        h2("15.2 Variables del proyecto"),
        ...codeBlock([
          "# Backend — 14 variables",
          "ANTHROPIC_API_KEY=sk-ant-...     # No compartir jamás",
          "DATABASE_URL=postgresql+asyncpg://... # Incluye credenciales",
          "REDIS_URL=rediss://...            # TLS en Upstash",
          "HIVEMQ_HOST=xxx.hivemq.cloud      # Broker MQTT",
          "HIVEMQ_USERNAME / HIVEMQ_PASSWORD # Credenciales MQTT",
          "RESEND_API_KEY=re_...             # API de email",
          "FROM_EMAIL=alertas@surqo.io       # Dominio verificado en Resend",
          "LOGFIRE_TOKEN=...                 # Observabilidad",
          "APP_ENV=production                # development | test | production",
          "",
          "# Frontend — 2 variables (NEXT_PUBLIC = expuestas al navegador)",
          "NEXT_PUBLIC_API_URL=https://surqo-api.onrender.com",
          "NEXT_PUBLIC_WS_URL=wss://surqo-api.onrender.com",
        ]),
        spacer(),
        interviewBox(
          "¿Qué pasa si commiteas una API key en git?",
          "Es una emergencia de seguridad. La clave debe revocarse INMEDIATAMENTE en la consola del proveedor (Anthropic, AWS, etc.) — incluso si el commit fue privado, porque el historial de git puede ser comprometido. Herramientas como git-secrets, GitGuardian o Gitleaks detectan claves en pre-commit hooks. La solución preventiva es usar .gitignore para .env y configurar el pre-commit hook."
        ),

        // ═══════════════════════════════════════════════════════════════════
        // 16. SIMULADOR IoT
        // ═══════════════════════════════════════════════════════════════════
        h1("16. Simulador IoT — Modelo Climático de Córdoba"),
        h2("16.1 Por qué tener un simulador"),
        p("El simulador permite desarrollar y testear el sistema completo sin tener el hardware ESP32. Simula el clima real de Montería, Córdoba, Colombia usando un modelo matemático:"),
        bullet("Temperatura: ciclo senoidal entre 22°C (5am) y 34°C (2pm)"),
        bullet("Humedad: inversa a la temperatura (mayor temperatura → menor humedad)"),
        bullet("Lluvia: probabilística correlacionada con humedad alta (>85% HR → 25% prob. de lluvia)"),
        bullet("Humedad del suelo: decrece por evapotranspiración durante el día, sube con lluvia"),
        bullet("UV: senoidal entre 7am y 6pm con pico al mediodía (máx 11 UV)"),
        spacer(),
        h2("16.2 Uso del simulador"),
        ...codeBlock([
          "# Modo HTTP (más simple para pruebas locales):",
          "python simulator.py --mode http --interval 10 --farm-id <uuid>",
          "",
          "# Modo MQTT (replica el ESP32 real):",
          "python simulator.py --mode mqtt --mqtt-host xxx.hivemq.cloud \\",
          "                    --mqtt-user usuario --mqtt-pass pass \\",
          "                    --interval 30",
          "",
          "# Output en consola:",
          "# ✅ [10:30] Suelo: 45.2% | Aire: 31.4°C 68.0%HR | UV: 6.8 | Bat: 3750mV",
        ]),

        // ═══════════════════════════════════════════════════════════════════
        // 17. PREGUNTAS DE ENTREVISTA
        // ═══════════════════════════════════════════════════════════════════
        h1("17. Preguntas de Entrevista — Respuestas Preparadas"),
        h2("17.1 Sobre el proyecto en general"),
        interviewBox(
          "Cuéntame sobre Surqo como si tuvieras 2 minutos.",
          "Surqo es una plataforma de IoT + IA para agricultores colombianos. Un sensor ESP32 en el campo mide temperatura, humedad y luz UV cada 15 minutos y publica los datos por MQTT a la nube. Un backend en FastAPI los recibe, los analiza con Claude Haiku de Anthropic junto con datos climáticos de Open-Meteo, y genera recomendaciones de riego y control de plagas en español coloquial. El dashboard en Next.js muestra todo en tiempo real vía WebSocket. Si detecta condición crítica, envía un email automático al agricultor."
        ),
        spacer(),
        interviewBox(
          "¿Qué harías diferente si tuvieras que escalar Surqo a 10,000 fincas?",
          "1) Kafka en lugar de MQTT directo para manejar millones de mensajes/hora con retención. 2) TimescaleDB en lugar de PostgreSQL puro para series de tiempo de sensores (compresión automática, queries 10x más rápidas). 3) Separar el consumer MQTT en un microservicio independiente con múltiples instancias. 4) Celery o Temporal para las tareas de análisis LLM (queue, reintentos, prioridades). 5) Prompt caching de Anthropic para reducir costo LLM 90% en prompts repetitivos."
        ),
        spacer(),
        h2("17.2 Sobre Python y backend"),
        interviewBox(
          "¿Qué es async/await en Python y cuándo NO ayuda?",
          "async/await permite ejecutar código concurrentemente sin threads, usando un event loop. Ayuda cuando hay I/O: esperar respuesta de base de datos, API externa, MQTT. NO ayuda para CPU-bound: cálculos matemáticos pesados, procesamiento de imágenes. Para CPU-bound se usan procesos (multiprocessing) o un worker externo. Si hago await en una función bloqueante síncrona (como requests en lugar de httpx), bloqueo todo el event loop."
        ),
        spacer(),
        interviewBox(
          "¿Qué es Pydantic v2 y qué mejoras trae sobre v1?",
          "Pydantic v2 reescribió el motor de validación en Rust (pydantic-core), haciéndolo 5-50x más rápido. Los cambios breaking: model_validator en lugar de validator, model_config en lugar de class Config, Annotated types, y el decorador @field_validator con mode='before'/'after'. En Surqo usamos Mapped[type] de SQLAlchemy con pydantic-settings para las variables de entorno."
        ),
        spacer(),
        interviewBox(
          "¿Cómo testeas código que llama a APIs externas (Anthropic, Resend)?",
          "Con mocking. En los tests de Surqo: 1) patch('resend.Emails.send') reemplaza la función real con un mock que retorna un dict sin hacer la llamada HTTP real. 2) Los tests del LLMService testean la carga del YAML y el cálculo de costos, sin llamar a la API de Anthropic (eso lo testeamos manualmente o con tests de integración marcados como lentos)."
        ),
        spacer(),
        h2("17.3 Sobre bases de datos"),
        interviewBox(
          "¿Qué problema resuelve un connection pool?",
          "Crear una conexión a PostgreSQL toma ~50ms (handshake TCP + autenticación). Con pool_size=5, el servidor mantiene 5 conexiones abiertas permanentemente. Cada request toma una del pool en <1ms y la devuelve al terminar. Sin pool, una app con 100 requests/segundo haría 100 conexiones nuevas → la DB colapsa. max_overflow=10 permite 10 conexiones adicionales bajo picos de carga antes de rechazar."
        ),
        spacer(),
        interviewBox(
          "¿Qué es una migración de base de datos y cómo la harías en Surqo?",
          "Una migración es un script SQL versionado que modifica el schema de la DB (ADD COLUMN, CREATE INDEX, etc.) de forma controlada. Surqo tiene el directorio /migrations listo para Alembic (la herramienta estándar de SQLAlchemy). El flujo: alembic revision --autogenerate -m 'add farm email' → genera el script → alembic upgrade head → aplica el cambio. Para el demo usamos init_db() que hace CREATE TABLE IF NOT EXISTS, pero en producción real usaríamos Alembic."
        ),
        spacer(),
        h2("17.4 Sobre IA y LLMs"),
        interviewBox(
          "¿Cómo controlas el costo de las llamadas al LLM?",
          "Tres estrategias en Surqo: (1) Cache en Redis: si ya analizamos lat/lon/cultivo en la última hora, retornamos el cache sin llamar a Claude. (2) Haiku en lugar de Sonnet/Opus: Haiku es 20x más barato con calidad suficiente para análisis agronómico. (3) Prompt corto y enfocado: el template tiene ~500 tokens, no enviamos texto innecesario. El costo por análisis es ~$0.0003 USD — para un agricultor usando el sistema 3 veces/día son $0.001/día."
        ),
        spacer(),
        interviewBox(
          "¿Qué es el temperature del LLM y cómo afecta la salida?",
          "Temperature controla la aleatoriedad del token sampling. 0 = siempre el token más probable (determinista, mecánico). 1 = distribución normal de probabilidades (creativo). Surqo usa 0.2 para análisis agronómico: queremos respuestas consistentes y precisas, no inventivas. Para el summary_for_farmer (texto coloquial) podría ser 0.4-0.6 para sonar más natural, pero con 0.2 funciona bien."
        ),
        spacer(),
        h2("17.5 Sobre IoT y sistemas embebidos"),
        interviewBox(
          "¿Por qué el ESP32 usa deep sleep en lugar de delay()?",
          "Deep sleep apaga la CPU, la RAM dinámica y la mayoría de periféricos, consumiendo ~10 microamperios vs ~50 miliamperios en modo activo. Una batería LiPo de 2000mAh con delay() duraría ~40 horas. Con deep sleep de 15 minutos (2 segundos activo / 898 segundos dormido), dura ~4 meses. Crucial para sensores solares en campo sin electricidad."
        ),
        spacer(),
        interviewBox(
          "¿Qué es QoS en MQTT y cuál usas?",
          "QoS (Quality of Service) define la garantía de entrega: QoS 0 = fire-and-forget (puede perderse). QoS 1 = al menos una vez (puede duplicarse). QoS 2 = exactamente una vez (overhead mayor). Surqo usa QoS 1 tanto en el firmware (publishSensorData) como en el consumer backend (subscribe). Para lecturas de sensores, un duplicado ocasional es aceptable — lo importante es no perder una alerta crítica."
        ),

        // ═══════════════════════════════════════════════════════════════════
        // 18. COMANDOS DE REFERENCIA RÁPIDA
        // ═══════════════════════════════════════════════════════════════════
        h1("18. Comandos de Referencia Rápida"),
        h2("18.1 Desarrollo local"),
        ...codeBlock([
          "# Backend — instalar y correr",
          "cd backend",
          "uv sync --dev                        # Instalar todas las dependencias",
          "cp ../.env.example .env              # Copiar y editar variables",
          "uv run uvicorn app.main:app --reload # Servidor de desarrollo",
          "# API disponible en http://localhost:8000",
          "# Docs en http://localhost:8000/docs",
          "",
          "# Tests",
          "uv run python -m pytest tests/ -v --cov=app",
          "",
          "# Linter",
          "uv run ruff check app/",
          "",
          "# Frontend",
          "cd frontend",
          "npm install",
          "npm run dev                           # http://localhost:3000",
          "",
          "# Simulador IoT",
          "cd iot-simulator",
          "pip install paho-mqtt httpx",
          "python simulator.py --mode http --interval 10",
        ]),
        spacer(),
        h2("18.2 Endpoints clave de la API"),
        twoColTable("Endpoint", "Descripción", [
          ["GET /health", "Estado del sistema: DB, MQTT, WebSocket connections"],
          ["POST /api/v1/farms/", "Crear finca con coordenadas, cultivo, email del propietario"],
          ["POST /api/v1/sensors/reading", "Ingestar lectura de sensor (HTTP fallback del ESP32)"],
          ["GET /api/v1/sensors/ws/live/{farm_id}", "WebSocket: stream de lecturas en tiempo real"],
          ["POST /api/v1/analysis/analyze", "Llamar a Claude Haiku con datos climáticos + sensor"],
          ["GET /api/v1/kpis/farm/{farm_id}", "VPD, estrés hídrico, riesgo de plagas en tiempo real"],
          ["GET /api/v1/alerts/active", "Alertas sin resolver (opcional: ?farm_id=...)"],
          ["POST /api/v1/alerts/{id}/notify", "Reenviar email de alerta manualmente"],
          ["POST /api/v1/analysis/evaluate-prompts", "A/B testing de versiones de prompts"],
        ]),

        // ═══════════════════════════════════════════════════════════════════
        // 19. GLOSARIO
        // ═══════════════════════════════════════════════════════════════════
        h1("19. Glosario de Términos Técnicos"),
        twoColTable("Término", "Definición", [
          ["ASGI", "Async Server Gateway Interface — estándar Python para servidores web async (FastAPI usa esto)"],
          ["async/await", "Palabras clave de Python para código asíncrono no bloqueante con event loop"],
          ["Broker MQTT", "Servidor intermediario que recibe y distribuye mensajes MQTT (HiveMQ en Surqo)"],
          ["connection pool", "Conjunto de conexiones DB reutilizables para evitar overhead de nueva conexión por request"],
          ["deep sleep", "Modo de bajo consumo del ESP32 que apaga la CPU (~10μA vs ~50mA en activo)"],
          ["dependency injection", "Patrón de design donde las dependencias se inyectan desde afuera (Depends() en FastAPI)"],
          ["ETc", "Evapotranspiración del cultivo = ET0 × Kc. Cuánta agua consume el cultivo/día en mm"],
          ["ET0", "Evapotranspiración de referencia (pasto) según FAO Penman-Monteith. Calculada por Open-Meteo"],
          ["event loop", "Bucle del runtime async que ejecuta coroutines y callbacks de I/O"],
          ["Kc", "Coeficiente de cultivo. Maíz=1.15, Café=0.95, Arroz=1.20. Factor multiplicador de ET0"],
          ["LLM", "Large Language Model — modelo de IA entrenado en texto (Claude, GPT, Llama)"],
          ["MQTT", "Message Queuing Telemetry Transport — protocolo pub/sub ligero para IoT"],
          ["ORM", "Object-Relational Mapper — mapea tablas SQL a clases Python (SQLAlchemy)"],
          ["pub/sub", "Publish-Subscribe — productores publican en topics, consumidores suscriben a topics"],
          ["QoS", "Quality of Service en MQTT: 0=sin garantía, 1=al menos una vez, 2=exactamente una vez"],
          ["Redis", "Base de datos in-memory key-value, microsegundos de latencia, ideal para cache"],
          ["RSSI", "Received Signal Strength Indicator — nivel de señal WiFi en dBm (más negativo = más débil)"],
          ["SSL/TLS", "Protocolos de cifrado para comunicación segura. MQTT usa TLS en puerto 8883"],
          ["token (LLM)", "Fragmento de texto (~4 chars inglés). Los LLMs procesan y cobran por tokens, no palabras"],
          ["TTL", "Time To Live — tiempo en segundos que Redis guarda un dato antes de borrarlo automáticamente"],
          ["VPD", "Vapor Pressure Deficit — diferencia entre vapor saturado y real del aire. Indica estrés hídrico"],
          ["WebSocket", "Protocolo de comunicación bidireccional en tiempo real sobre HTTP"],
          ["wildcard MQTT", "+ = un nivel (surqo/farms/+/sensors). # = múltiples niveles"],
        ], [3800, 5560]),

        // ═══════════════════════════════════════════════════════════════════
        // 20. CONCLUSIÓN
        // ═══════════════════════════════════════════════════════════════════
        h1("20. Conclusión y Próximos Pasos"),
        h2("20.1 Lo que demuestra este proyecto"),
        p("Surqo demuestra competencias en múltiples áreas que una empresa tech busca en un junior developer / analista de IA:"),
        bullet("Full-stack development: backend Python async + frontend Next.js TypeScript"),
        bullet("IoT y sistemas embebidos: firmware ESP32 C++, protocolo MQTT, sensores físicos"),
        bullet("IA aplicada: prompt engineering, LLM-as-judge, control de costos, evaluación A/B de prompts"),
        bullet("Bases de datos: PostgreSQL con ORM, Redis para cache, índices para performance"),
        bullet("DevOps: CI/CD con GitHub Actions, containerización con Docker, deploy en Render y Vercel"),
        bullet("Testing: 52 tests unitarios e integración, mocking, SQLite in-memory"),
        bullet("Arquitectura: microservicios, pub/sub, WebSocket, separación de concerns"),
        spacer(),
        h2("20.2 Próximos pasos del proyecto"),
        numbered("Alembic para migraciones de DB en producción"),
        numbered("Prompt caching de Anthropic (reducir costo LLM 90% en prefijos repetidos)"),
        numbered("Autenticación JWT para múltiples usuarios (agricultores independientes)"),
        numbered("App móvil React Native para notificaciones push"),
        numbered("Integración con datos satelitales (Sentinel-2) para índice NDVI"),
        numbered("Machine Learning local: modelo TFLite en el ESP32 para detección de plagas por foto"),
        spacer(),
        new Table({
          width: { size: CONTENT_WIDTH, type: WidthType.DXA },
          columnWidths: [CONTENT_WIDTH],
          rows: [new TableRow({ children: [new TableCell({
            borders: borders(DGREEN),
            width: { size: CONTENT_WIDTH, type: WidthType.DXA },
            shading: { fill: "E8F5E9", type: ShadingType.CLEAR },
            margins: { top: 180, bottom: 180, left: 360, right: 360 },
            children: [
              new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 80 }, children: [new TextRun({ text: "🌾  Surqo — Del surco al insight", font: "Arial", size: 28, bold: true, color: DGREEN })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 80 }, children: [new TextRun({ text: "Ricardo Martínez · rickmartinezbanda@gmail.com", font: "Arial", size: 22, color: BLUE })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 0 }, children: [new TextRun({ text: "surqo.vercel.app  ·  github.com/rickm/surqo", font: "Arial", size: 20, italics: true, color: DGRAY })] }),
            ],
          })] })],
        }),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  const outputPath = "C:/Users/rickm/projects/dev/surqo/docs/Surqo_Tutorial_Tecnico_Completo.docx";
  fs.writeFileSync(outputPath, buffer);
  console.log("✅ Documento generado:", outputPath);
}).catch(console.error);
