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
      "ESP32 con sensores DHT22 y capacitivo de suelo. Una batería dura semanas con deep sleep.",
    points: [
      "Temperatura y humedad del aire",
      "Humedad del suelo en tiempo real",
      "Deep sleep: batería de semanas",
      "Setup en menos de 60 segundos",
    ],
  },
  {
    icon: Wifi,
    badge: "IoT",
    number: "02",
    title: "Datos en tiempo real",
    description:
      "Cada 15 minutos el nodo envía lecturas vía MQTT con cifrado TLS. Stream en vivo en el dashboard.",
    points: [
      "MQTT TLS cifrado en puerto 8883",
      "Deep sleep entre lecturas",
      "Live feed por WebSocket",
      "Latencia menor a 2 segundos",
    ],
  },
  {
    icon: FlaskConical,
    badge: "IA",
    number: "03",
    title: "La IA analiza y recomienda",
    description:
      "Llama 3.3 70B cruza tus datos con pronóstico de 7 días y genera recomendaciones en español.",
    points: [
      "Pronóstico de 7 días por GPS",
      "Cálculo de VPD, ETc e índice hídrico",
      "Recomendaciones de riego y fertilización",
      "Evaluación de riesgo de plagas",
    ],
  },
  {
    icon: Bell,
    badge: "Alertas",
    number: "04",
    title: "Alertas cuando importa",
    description:
      "El sistema detecta estrés hídrico, temperatura fuera de rango o riesgo de hongos y te avisa antes.",
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
      "KPIs en tiempo real, gráfica histórica, análisis IA y alertas — todo en un panel, 24/7.",
    points: [
      "VPD, temperatura y humedad en vivo",
      "Gráfica histórica de humedad de suelo",
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

  // Posición flotante relativa al card activo (0 = centro, ±1 = lados, ±2 = fondo)
  // Responsive: 260px en mobile, 320px en desktop
  const CARD_W = typeof window !== "undefined" && window.innerWidth < 640 ? 260 : 320
  const GAP    = typeof window !== "undefined" && window.innerWidth < 640 ? 280 : 340
  const x = useTransform(scrollYProgress, (p) => {
    const active = p * (total - 1)
    const pos = index - active
    return pos * GAP - CARD_W / 2
  })

  const scale = useTransform(scrollYProgress, (p) => {
    const active = p * (total - 1)
    const dist = Math.abs(index - active)
    return Math.max(0.72, 1 - dist * 0.12)
  })

  const opacity = useTransform(scrollYProgress, (p) => {
    const active = p * (total - 1)
    const dist = Math.abs(index - active)
    return Math.max(0.10, 1 - dist * 0.44)
  })

  const zIndex = useTransform(scrollYProgress, (p) => {
    const active = p * (total - 1)
    const dist = Math.abs(index - active)
    return Math.round(20 - dist * 5)
  })

  // Springs suaves
  const sx      = useSpring(x,       { stiffness: 90, damping: 26 })
  const sScale  = useSpring(scale,   { stiffness: 90, damping: 26 })
  const sOpacity = useSpring(opacity, { stiffness: 90, damping: 26 })

  return (
    <motion.div
      className="absolute left-1/2"
      style={{ x: sx, scale: sScale, opacity: sOpacity, zIndex }}
    >
      {/* Glass card — vidrio intenso */}
      <div
        className="w-[260px] sm:w-[320px] rounded-3xl p-5 sm:p-7 flex flex-col gap-4 sm:gap-5"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.18) 100%)",
          border: "1.5px solid rgba(255,255,255,0.75)",
          backdropFilter: "blur(28px) saturate(200%) brightness(1.08)",
          WebkitBackdropFilter: "blur(28px) saturate(200%) brightness(1.08)",
          boxShadow:
            "0 16px 48px rgba(0,0,0,0.30), 0 2px 8px rgba(0,0,0,0.15), inset 0 1.5px 0 rgba(255,255,255,0.90), inset 0 -1px 0 rgba(0,0,0,0.08)",
        }}
      >
        {/* Número + icono */}
        <div className="flex items-center justify-between">
          <span
            className="text-6xl font-black leading-none tracking-tighter select-none"
            style={{ color: "rgba(134,230,106,0.28)" }}
          >
            {paso.number}
          </span>
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{
              background: "rgba(134,230,106,0.22)",
              border: "1.5px solid rgba(134,230,106,0.60)",
              boxShadow: "0 4px 16px rgba(134,230,106,0.18)",
            }}
          >
            <Icon className="w-8 h-8" style={{ color: LIME }} />
          </div>
        </div>

        {/* Badge */}
        <span
          className="self-start text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-lg"
          style={{
            color: LIME,
            background: "rgba(134,230,106,0.15)",
            border: "1px solid rgba(134,230,106,0.35)",
          }}
        >
          {paso.badge}
        </span>

        {/* Título */}
        <h3 className="text-xl font-black text-white leading-tight">{paso.title}</h3>

        {/* Descripción */}
        <p className="text-sm text-white/80 leading-relaxed">{paso.description}</p>

        {/* Puntos */}
        <ul className="space-y-1.5 pt-1">
          {paso.points.map((pt) => (
            <li key={pt} className="flex items-start gap-2 text-xs text-white/55 font-medium">
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0 mt-[3px]"
                style={{ backgroundColor: LIME }}
              />
              {pt}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  )
}

// ── Barra de progreso por paso ────────────────────────────────────────────────

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
    [index / (total - 1) - 1 / (total - 1), index / (total - 1)],
    ["0%", "100%"]
  )
  return (
    <div
      className="h-[3px] rounded-full flex-1 overflow-hidden"
      style={{ background: "rgba(255,255,255,0.15)" }}
    >
      <motion.div
        className="h-full rounded-full"
        style={{ width, background: LIME }}
      />
    </div>
  )
}

// ── Indicador del paso activo ─────────────────────────────────────────────────

function StepLabel({ scrollYProgress, total }: { scrollYProgress: MotionValue<number>; total: number }) {
  const activeIdx = useTransform(scrollYProgress, (p) => Math.round(p * (total - 1)))
  return (
    <motion.p className="text-white/40 text-xs font-bold tracking-widest uppercase mt-4 text-center">
      {PASOS.map((p, i) => (
        <motion.span
          key={i}
          style={{
            display: "inline",
            opacity: useTransform(activeIdx, (a) => (Math.round(a) === i ? 1 : 0)),
          }}
        >
          {p.title}
        </motion.span>
      ))}
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

  const smooth = useSpring(scrollYProgress, { stiffness: 70, damping: 24 })

  return (
    <div ref={containerRef} style={{ height: `${(PASOS.length + 1) * 100}vh` }}>
      <div className="sticky top-0 overflow-hidden" style={{ height: "100vh" }}>

        {/* Fondo fondosection3.jpg */}
        <div
          className="absolute inset-4 sm:inset-8 z-0 rounded-3xl overflow-hidden"
          style={{
            border: "2px solid rgba(255,255,255,0.55)",
            boxShadow: "0 0 0 1px rgba(255,255,255,0.15)",
          }}
        >
          <Image
            src="/fondosection3.webp"
            alt="Viñedo colombiano"
            fill
            sizes="100vw"
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMCwsKCwsNCxAQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/wAARCAAIABADASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAeEAABBAMBAQAAAAAAAAAAAAABAAIDBBESITH/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AmtjlsxPnx3HXX0oW2htCiRygEgAn/9k="
            className="object-cover object-center transition-opacity duration-500"
          />
          <div className="absolute inset-0 bg-black/52" />
        </div>

        {/* Contenido */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center px-4">

          {/* Carousel de cards */}
          <div className="relative flex items-center justify-center w-full" style={{ height: "480px" }}>
            {PASOS.map((p, i) => (
              <PasoCard
                key={p.title}
                paso={p}
                index={i}
                total={PASOS.length}
                scrollYProgress={smooth}
              />
            ))}
          </div>

          <p className="text-white/25 text-xs font-semibold tracking-widest uppercase mt-6">
            Desliza para continuar
          </p>
        </div>
      </div>
    </div>
  )
}
