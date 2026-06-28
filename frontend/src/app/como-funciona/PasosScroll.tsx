"use client"

import { useRef } from "react"
import Image from "next/image"
import { Cpu, Wifi, FlaskConical, Bell, LayoutDashboard } from "lucide-react"
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  MotionValue,
} from "framer-motion"

const LIME = "#86E66A"

const PASOS = [
  {
    icon: Cpu,
    badge: "Hardware",
    number: "01",
    title: "Instala el nodo en tu finca",
    description:
      "El Surqo Node es un ESP32 con sensores DHT22 y capacitivo de suelo. Lo conectas a tu WiFi o router 4G. Una batería de 3000 mAh dura semanas gracias al modo deep sleep.",
    points: [
      "Temperatura y humedad del aire",
      "Humedad y temperatura del suelo",
      "Índice UV y estado de batería",
      "Setup en menos de 60 segundos",
    ],
  },
  {
    icon: Wifi,
    badge: "IoT",
    number: "02",
    title: "Datos en tiempo real",
    description:
      "Cada 15 minutos el nodo despierta, toma lecturas y las envía vía MQTT con cifrado TLS. Puedes ver el stream en vivo en el dashboard desde cualquier dispositivo.",
    points: [
      "MQTT TLS cifrado en puerto 8883",
      "Deep sleep entre lecturas",
      "Live feed por WebSocket",
      "Latencia menor a 2 segundos",
    ],
  },
  {
    icon: FlaskConical,
    badge: "Inteligencia Artificial",
    number: "03",
    title: "La IA analiza y recomienda",
    description:
      "Llama 3.3 70B cruza tus lecturas con el pronóstico climático de 7 días para tu ubicación GPS exacta y genera recomendaciones agronómicas en español claro.",
    points: [
      "Pronóstico de 7 días por GPS",
      "Cálculo de VPD, ETc e índice hídrico",
      "Recomendaciones de riego y fertilización",
      "Evaluación de riesgo de plagas y hongos",
    ],
  },
  {
    icon: Bell,
    badge: "Alertas",
    number: "04",
    title: "Alertas cuando importa",
    description:
      "El sistema detecta condiciones críticas automáticamente — estrés hídrico, temperatura fuera de rango o riesgo de hongos — y te notifica por correo antes de que sea tarde.",
    points: [
      "Alertas por correo electrónico",
      "Niveles: crítico / advertencia / info",
      "Historial completo de eventos",
      "Sin configuración adicional",
    ],
  },
  {
    icon: LayoutDashboard,
    badge: "Dashboard",
    number: "05",
    title: "Decide con datos",
    description:
      "El dashboard centraliza todo: KPIs en tiempo real, gráfica de humedad histórica, últimos análisis de IA y estado de alertas. Accesible 24/7 desde móvil o PC.",
    points: [
      "VPD, temperatura y humedad en vivo",
      "Gráfica histórica de suelo",
      "Últimos análisis con IA",
      "Exporta datos de tu finca",
    ],
  },
]

// ── Card individual ───────────────────────────────────────────────────────────

function PasoCard({
  paso,
  index,
  total,
  scrollYProgress,
}: {
  paso: (typeof PASOS)[0]
  index: number
  total: number
  scrollYProgress: MotionValue<number>
}) {
  const Icon = paso.icon
  const start = index / total
  const end = (index + 1) / total

  const opacity = useTransform(
    scrollYProgress,
    [start, start + 0.1, end - 0.1, end],
    [0, 1, 1, 0]
  )
  const y = useTransform(
    scrollYProgress,
    [start, start + 0.14, end - 0.1, end],
    [50, 0, 0, -50]
  )
  const scale = useTransform(
    scrollYProgress,
    [start, start + 0.14, end - 0.1, end],
    [0.94, 1, 1, 0.96]
  )

  const sOpacity = useSpring(opacity, { stiffness: 100, damping: 22 })
  const sY      = useSpring(y,       { stiffness: 100, damping: 22 })
  const sScale  = useSpring(scale,   { stiffness: 100, damping: 22 })

  return (
    <motion.div
      className="absolute inset-0"
      style={{ opacity: sOpacity, y: sY, scale: sScale }}
    >
      <div
        className="w-full h-full rounded-3xl p-7 sm:p-10 flex flex-col sm:flex-row gap-7 sm:gap-10"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.10) 100%)",
          border: "1px solid rgba(255,255,255,0.50)",
          backdropFilter: "blur(16px) saturate(160%)",
          WebkitBackdropFilter: "blur(16px) saturate(160%)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.70), inset 0 -1px 0 rgba(0,0,0,0.06)",
        }}
      >
        {/* Left: número + icono + badge */}
        <div className="flex sm:flex-col items-center sm:items-start gap-4 sm:gap-5 shrink-0 sm:w-44">
          {/* Número grande */}
          <span
            className="text-5xl sm:text-6xl font-black leading-none tracking-tighter"
            style={{ color: "rgba(134,230,106,0.25)" }}
          >
            {paso.number}
          </span>

          {/* Icono */}
          <motion.div
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(134,230,106,0.18)", border: "1.5px solid rgba(134,230,106,0.50)" }}
            whileHover={{ scale: 1.08, rotate: 4 }}
            transition={{ type: "spring", stiffness: 280, damping: 14 }}
          >
            <Icon className="w-8 h-8 sm:w-10 sm:h-10" style={{ color: LIME }} />
          </motion.div>

          {/* Badge */}
          <span
            className="text-[11px] sm:text-xs font-black tracking-widest uppercase px-3 py-1.5 rounded-lg"
            style={{ color: LIME, background: "rgba(134,230,106,0.15)", border: "1px solid rgba(134,230,106,0.35)" }}
          >
            {paso.badge}
          </span>
        </div>

        {/* Right: contenido */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h2
            className="font-black tracking-tight text-white mb-3 leading-tight"
            style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.5rem)" }}
          >
            {paso.title}
          </h2>
          <p
            className="leading-relaxed font-medium mb-6 text-white/75"
            style={{ fontSize: "clamp(0.9rem, 1.6vw, 1.05rem)" }}
          >
            {paso.description}
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {paso.points.map((p) => (
              <li
                key={p}
                className="flex items-center gap-2.5 font-medium text-white/65"
                style={{ fontSize: "clamp(0.8rem, 1.3vw, 0.92rem)" }}
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: LIME }} />
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  )
}

// ── Barra de progreso ─────────────────────────────────────────────────────────

function ProgressBar({
  index,
  total,
  scrollYProgress,
}: {
  index: number
  total: number
  scrollYProgress: MotionValue<number>
}) {
  const width = useTransform(
    scrollYProgress,
    [index / total, (index + 1) / total],
    ["0%", "100%"]
  )
  return (
    <div
      className="h-[3px] rounded-full flex-1 overflow-hidden"
      style={{ background: "rgba(255,255,255,0.15)" }}
    >
      <motion.div className="h-full rounded-full" style={{ width, background: LIME }} />
    </div>
  )
}

// ── Hint inicial ──────────────────────────────────────────────────────────────

function ScrollHint({
  scrollYProgress,
  total,
}: {
  scrollYProgress: MotionValue<number>
  total: number
}) {
  const opacity = useTransform(scrollYProgress, [0, 1 / total], [1, 0])
  return (
    <motion.p
      className="text-white/30 text-xs text-center mt-6 font-semibold tracking-widest uppercase"
      style={{ opacity }}
    >
      Desliza para ver más
    </motion.p>
  )
}

// ── Principal ─────────────────────────────────────────────────────────────────

export function PasosScroll() {
  const containerRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  })

  const smoothProgress = useSpring(scrollYProgress, { stiffness: 80, damping: 22 })

  return (
    <div ref={containerRef} style={{ height: `${(PASOS.length + 1) * 100}vh` }}>
      <div className="sticky top-0 overflow-hidden" style={{ height: "100vh" }}>

        {/* Fondo — fondosection3.jpg con bordes redondeados */}
        <div
          className="absolute inset-4 sm:inset-8 z-0 rounded-3xl overflow-hidden"
          style={{ border: "2px solid rgba(255,255,255,0.55)", boxShadow: "0 0 0 1px rgba(255,255,255,0.15)" }}
        >
          <Image
            src="/fondosection3.jpg"
            alt="Viñedo colombiano"
            fill
            sizes="100vw"
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMCwsKCwsNCxAQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/wAARCAAIABADASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAeEAABBAMBAQAAAAAAAAAAAAABAAIDBBESITH/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8Amtjls9Pjx3HnX0oW2hlKlBThAJABPfn+aKKAP//Z"
            className="object-cover object-center transition-opacity duration-500"
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>

        {/* Contenido */}
        <div className="relative z-10 h-full flex flex-col justify-center px-8 sm:px-14 lg:px-20 max-w-5xl mx-auto w-full">

          {/* Barras de progreso */}
          <div className="flex gap-2 mb-8">
            {PASOS.map((_, i) => (
              <ProgressBar key={i} index={i} total={PASOS.length} scrollYProgress={smoothProgress} />
            ))}
          </div>

          {/* Stack de cards */}
          <div className="relative w-full" style={{ height: "clamp(300px, 48vh, 440px)" }}>
            {PASOS.map((p, i) => (
              <PasoCard
                key={p.title}
                paso={p}
                index={i}
                total={PASOS.length}
                scrollYProgress={smoothProgress}
              />
            ))}
          </div>

          <ScrollHint scrollYProgress={smoothProgress} total={PASOS.length} />
        </div>
      </div>
    </div>
  )
}
