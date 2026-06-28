import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Cpu, Wifi, Terminal, FlaskConical, Bell, LayoutDashboard, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/Primitives"
import { Footer } from "@/components/Footer"

const STEPS = [
  {
    number: "01",
    icon: Cpu,
    title: "Instala el nodo en tu finca",
    description:
      "El Surqo Node es un ESP32 con sensores DHT22 (temperatura y humedad del aire) y un sensor capacitivo de humedad de suelo. Lo conectas a tu WiFi o a un router 4G. Consume tan poca energía que una batería de 3000 mAh dura semanas.",
    details: ["Flashea el firmware con PlatformIO (un clic)", "Edita config.h con tu WiFi y Farm ID", "Enciéndelo — envía datos en menos de 60 s"],
  },
  {
    number: "02",
    icon: Wifi,
    title: "Los datos llegan en tiempo real",
    description:
      "Cada 15 minutos el nodo despierta, toma lecturas y las envía vía MQTT con cifrado TLS al servidor. Puedes ver el stream en vivo en la sección Sensores del dashboard.",
    details: ["MQTT TLS en puerto 8883", "Nodo en deep sleep entre lecturas", "Live feed por WebSocket en el dashboard"],
  },
  {
    number: "03",
    icon: FlaskConical,
    title: "La IA analiza y recomienda",
    description:
      "Combinamos tus lecturas de suelo con el pronóstico climático de 7 días (Open-Meteo) para tu ubicación GPS exacta. Llama 3.3 70B genera recomendaciones agronómicas específicas para tu cultivo en español.",
    details: ["Pronóstico de 7 días por coordenadas GPS", "Cálculo de VPD, ETc e índice hídrico", "Recomendaciones de riego, fertilización y plagas"],
  },
  {
    number: "04",
    icon: Bell,
    title: "Recibe alertas cuando importa",
    description:
      "El sistema detecta automáticamente condiciones críticas como estrés hídrico, temperaturas fuera de rango o humedad que favorece hongos, y te notifica por correo antes de que sea tarde.",
    details: ["Alertas por correo electrónico", "Severidad: crítica / advertencia / info", "Historial completo de eventos"],
  },
  {
    number: "05",
    icon: LayoutDashboard,
    title: "Decide con datos, no con intuición",
    description:
      "El dashboard centraliza todo: KPIs del día, gráfica de humedad histórica, últimos análisis de IA y estado de alertas. Accesible desde cualquier dispositivo, 24/7.",
    details: ["VPD, temperatura, humedad en tiempo real", "Historial de análisis con IA", "Exporta y comparte datos de tu finca"],
  },
]

const HARDWARE = [
  { name: "ESP32 DevKit", price: "~$8 USD", note: "Microcontrolador principal" },
  { name: "DHT22",        price: "~$4 USD", note: "Temperatura + humedad del aire" },
  { name: "Sensor capacitivo de suelo", price: "~$3 USD", note: "Humedad del suelo (más preciso que resistivo)" },
  { name: "Batería LiPo 3000 mAh",      price: "~$6 USD", note: "Semanas de autonomía con deep sleep" },
  { name: "2N3904 (transistor NPN)",    price: "~$0.10 USD", note: "Corta alimentación de sensores en sleep" },
]

export default function ComoFuncionaPage() {
  return (
    <div className="min-h-screen bg-surqo-bg">

      {/* ── HERO ── */}
      <section className="relative h-screen flex flex-col justify-end overflow-hidden" style={{ backgroundColor: "#1a3318" }}>
        {/* Imagen de fondo */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/campo-trigo.jpg"
            alt="Campo de trigo al atardecer"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />
        </div>

        {/* Texto hero */}
        <div className="relative z-10 px-6 sm:px-12 pb-28 max-w-4xl">
          <h1 className="font-black text-white leading-none tracking-tight mb-5"
            style={{ fontSize: "clamp(2.8rem, 7vw, 5.5rem)" }}>
            Del sensor al análisis<br />en 5 pasos
          </h1>
          <p className="text-white/75 font-medium max-w-xl leading-relaxed"
            style={{ fontSize: "clamp(1rem, 2vw, 1.25rem)" }}>
            Un flujo completo desde el hardware en campo hasta la recomendación agronómica en tu pantalla.
          </p>
        </div>

        {/* Botón scroll */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <Link href="#pasos"
            className="flex items-center justify-center w-14 h-14 rounded-full transition-transform hover:scale-110 active:scale-95"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.10) 100%)",
              border: "1px solid rgba(255,255,255,0.50)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              boxShadow: "0 4px 24px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.70)",
            }}
          >
            <ChevronDown className="w-6 h-6 text-surqo-green" strokeWidth={2.5} />
          </Link>
        </div>
      </section>

      {/* ── STEPS ── */}
      <section id="pasos" className="max-w-4xl mx-auto px-4 pb-20 pt-16">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-surqo-green/30 via-surqo-green/10 to-transparent hidden md:block" />

          <div className="space-y-6">
            {STEPS.map((step) => {
              const Icon = step.icon
              return (
                <div key={step.number} className="relative flex gap-6 md:gap-8">
                  {/* Step indicator */}
                  <div className="relative shrink-0 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl glass border border-surqo-green/20 flex items-center justify-center bg-surqo-green/5 z-10">
                      <Icon className="w-6 h-6 text-surqo-green" />
                    </div>
                    <span className="text-[10px] font-black text-surqo-green/40 mt-1">{step.number}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 glass rounded-2xl border border-white/[0.07] hover:border-surqo-green/20 transition-colors p-6 mb-0">
                    <h2 className="text-xl font-black tracking-tight text-surqo-text mb-2">{step.title}</h2>
                    <p className="text-sm text-surqo-text-secondary leading-relaxed font-medium mb-4">{step.description}</p>
                    <ul className="space-y-1.5">
                      {step.details.map((d) => (
                        <li key={d} className="flex items-center gap-2 text-xs text-surqo-text-secondary font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-surqo-green shrink-0" />
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── HARDWARE LIST ── */}
      <section className="border-t border-white/[0.06] bg-white/[0.02]">
        <div className="max-w-4xl mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-surqo-green-bright mb-4">Hardware</p>
            <h2 className="text-4xl font-black tracking-tighter mb-3">
              ¿Qué necesitas comprar?
            </h2>
            <p className="text-surqo-text-secondary font-medium max-w-md mx-auto">
              Todo el hardware cuesta menos de <span className="font-black text-surqo-text">$22 USD</span>.
              Disponible en MercadoLibre Colombia.
            </p>
          </div>

          <div className="glass rounded-2xl border border-white/[0.07] overflow-hidden">
            <div className="grid grid-cols-3 px-6 py-3 border-b border-white/[0.06] bg-white/[0.02]">
              <p className="text-xs font-bold text-surqo-text-muted uppercase tracking-widest">Componente</p>
              <p className="text-xs font-bold text-surqo-text-muted uppercase tracking-widest text-center">Precio aprox.</p>
              <p className="text-xs font-bold text-surqo-text-muted uppercase tracking-widest">Función</p>
            </div>
            {HARDWARE.map((h, i) => (
              <div
                key={h.name}
                className={`grid grid-cols-3 px-6 py-4 items-center gap-4 ${
                  i < HARDWARE.length - 1 ? "border-b border-white/[0.04]" : ""
                }`}
              >
                <p className="text-sm font-bold text-surqo-text">{h.name}</p>
                <p className="text-sm font-black text-surqo-green text-center">{h.price}</p>
                <p className="text-xs text-surqo-text-muted font-medium">{h.note}</p>
              </div>
            ))}
            <div className="px-6 py-4 border-t border-surqo-green/20 bg-surqo-green/5 flex items-center justify-between">
              <p className="text-sm font-bold text-surqo-text">Total estimado</p>
              <p className="text-lg font-black text-surqo-green">~ $21.10 USD</p>
            </div>
          </div>

          {/* Simulator note */}
          <div className="mt-6 glass rounded-2xl border border-surqo-sky/20 p-5 flex items-start gap-4">
            <div className="w-9 h-9 rounded-xl bg-surqo-sky/10 border border-surqo-sky/20 flex items-center justify-center shrink-0">
              <Terminal className="w-4 h-4 text-surqo-sky" />
            </div>
            <div>
              <p className="text-sm font-bold text-surqo-text mb-1">¿Sin hardware aún?</p>
              <p className="text-xs text-surqo-text-secondary font-medium leading-relaxed">
                Usa el simulador Python para generar lecturas realistas y probar toda la plataforma. Lo encuentras en la sección <strong className="text-surqo-text">Sensores</strong> del dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <div className="glass rounded-3xl border border-surqo-green/20 p-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 mesh-bg opacity-15 pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-3xl font-black tracking-tighter mb-3">Empieza hoy, gratis</h2>
            <p className="text-surqo-text-secondary font-medium mb-8 max-w-md mx-auto">
              Crea tu cuenta, registra tu finca y conecta el sensor. O prueba con el simulador sin comprar nada.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" className="gap-2" asChild>
                <Link href="/register">
                  Crear cuenta gratis
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/preguntas">Preguntas frecuentes</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
