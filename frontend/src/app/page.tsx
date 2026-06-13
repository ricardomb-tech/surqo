import Link from "next/link"
import {
  ArrowRight, Zap, Cpu, Brain, Bell, BarChart3,
  Droplets, Thermometer, Wind, TrendingUp,
  MapPin, Sprout, FlaskConical, ShieldCheck,
} from "lucide-react"
import { Button } from "@/components/ui/Primitives"
import { Footer } from "@/components/Footer"

// ── DATA ─────────────────────────────────────────────────────────────────────

const HIGHLIGHTS = [
  { icon: Cpu,       label: "Sensores IoT",          sub: "ESP32 + DHT22 en campo real" },
  { icon: Brain,     label: "IA Agronómica",          sub: "Llama 3.3 70B · en español" },
  { icon: Bell,      label: "Alertas automáticas",    sub: "Estrés hídrico, plagas, temp." },
  { icon: BarChart3, label: "Dashboard 24/7",         sub: "VPD, ETc, humedad, historial" },
]

const PROBLEM_POINTS = [
  "¿Cuándo exactamente debo regar?",
  "¿Mi cultivo tiene estrés hídrico ahora mismo?",
  "¿El clima de esta semana favorece hongos o plagas?",
  "¿Cuánta agua estoy desperdiciando sin saberlo?",
]

const SOLUTION_STEPS = [
  {
    icon: Cpu,
    step: "01",
    title: "Conecta el sensor",
    desc: "ESP32 + DHT22 + sensor de suelo. Instalación en 20 minutos. Datos cada 15 min.",
  },
  {
    icon: Brain,
    step: "02",
    title: "La IA analiza",
    desc: "Combinamos tus datos con el pronóstico de 7 días para generar recomendaciones precisas.",
  },
  {
    icon: BarChart3,
    step: "03",
    title: "Tú decides",
    desc: "Dashboard en tiempo real con KPIs, alertas y análisis histórico desde cualquier dispositivo.",
  },
]

const STATS = [
  { icon: Droplets,    value: "45%",    label: "Ahorro de agua",           color: "text-surqo-sky" },
  { icon: Thermometer, value: "±0.5°C", label: "Precisión temperatura",   color: "text-surqo-warning" },
  { icon: Wind,        value: "1.2 kPa",label: "Resolución VPD",          color: "text-surqo-green" },
  { icon: TrendingUp,  value: "24/7",   label: "Monitoreo continuo",      color: "text-surqo-green" },
]

const FEATURES = [
  {
    icon: Sprout,
    title: "Para el agricultor real",
    desc: "No para laboratorios. Diseñado para condiciones reales del campo colombiano: clima tropical, conectividad limitada y decisiones urgentes.",
  },
  {
    icon: FlaskConical,
    title: "Ciencia detrás de cada consejo",
    desc: "Calculamos VPD, evapotranspiración (ETc) e índice de estrés hídrico con datos reales de tu finca, no promedios genéricos.",
  },
  {
    icon: ShieldCheck,
    title: "Tus datos son tuyos",
    desc: "Arquitectura segura con Supabase Auth, TLS en todas las conexiones y Row Level Security. Nadie más ve tus datos.",
  },
  {
    icon: Zap,
    title: "100% gratuito, siempre",
    desc: "Sin planes, sin tarjeta, sin letra pequeña. Es un proyecto abierto para democratizar la tecnología agrícola en Colombia.",
  },
]

const TESTIMONIALS = [
  {
    quote: "Antes adivinábamos cuándo regar. Ahora el sistema nos dice exactamente cuándo y cuánto. Ahorramos agua y la cosecha llegó mejor.",
    author: "Carlos M.",
    role: "Productor de maíz",
    location: "Montería, Córdoba",
  },
  {
    quote: "Es como tener un agrónomo disponible los 7 días. El análisis de IA nos avisa antes de que el problema se vuelva pérdida.",
    author: "María R.",
    role: "Agricultora",
    location: "Cereté, Córdoba",
  },
]

const PAGES = [
  {
    href: "/soluciones",
    label: "Soluciones",
    desc: "Los 4 módulos que hacen funcionar Surqo: IoT, IA, Alertas y Dashboard.",
    icon: Brain,
  },
  {
    href: "/como-funciona",
    label: "Cómo funciona",
    desc: "El flujo completo en 5 pasos. Hardware, firmware, MQTT, IA y dashboard.",
    icon: Cpu,
  },
  {
    href: "/preguntas",
    label: "Preguntas frecuentes",
    desc: "Resuelve todas tus dudas antes de crear tu cuenta.",
    icon: ShieldCheck,
  },
]

// ── PAGE ─────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">

      {/* ── HERO ── */}
      <section className="relative overflow-hidden pt-16">
        <div className="absolute inset-0 mesh-bg opacity-25 pointer-events-none" />
        <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-[0.07] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 pt-24 pb-20 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-surqo-green/10 border border-surqo-green/20 rounded-full px-4 py-2 text-xs font-bold text-surqo-green-bright mb-10">
            <span className="live-dot" />
            <span className="tracking-widest uppercase">Piloto activo · Córdoba, Colombia</span>
          </div>

          <h1 className="text-6xl sm:text-8xl lg:text-[96px] font-black tracking-tighter mb-6 leading-[0.85]">
            Del surco al <br />
            <span className="text-gradient">insight.</span>
          </h1>

          <p className="text-lg sm:text-xl text-surqo-text-secondary max-w-xl mx-auto mb-4 leading-relaxed font-medium">
            Inteligencia agroclimática para el campo colombiano.
            IoT + IA que convierte datos del suelo en decisiones concretas.
          </p>
          <p className="text-xs text-surqo-text-muted font-medium mb-12 tracking-widest uppercase">
            100 % gratuito · Sin tarjeta · Sin letra pequeña
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20">
            <Button size="lg" className="h-14 px-10 text-base rounded-2xl group" asChild>
              <Link href="/register">
                Empieza gratis
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="h-14 px-10 text-base rounded-2xl" asChild>
              <Link href="/soluciones">Ver qué hace Surqo</Link>
            </Button>
          </div>

          {/* 4 pills */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
            {HIGHLIGHTS.map(({ icon: Icon, label, sub }) => (
              <div key={label} className="glass rounded-2xl border border-white/[0.07] p-4 text-left hover:border-surqo-green/20 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-surqo-green/10 border border-surqo-green/20 flex items-center justify-center text-surqo-green mb-3">
                  <Icon className="w-4 h-4" />
                </div>
                <p className="text-xs font-black text-surqo-text leading-tight mb-1">{label}</p>
                <p className="text-[11px] text-surqo-text-muted font-medium leading-tight">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EL PROBLEMA ── */}
      <section className="border-t border-white/[0.06] bg-white/[0.02]">
        <div className="max-w-5xl mx-auto px-4 py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-bold tracking-[0.2em] uppercase text-surqo-danger mb-4">El problema</p>
              <h2 className="text-4xl font-black tracking-tighter mb-5">
                El agricultor colombiano<br />
                <span className="text-surqo-text-secondary">toma decisiones</span><br />
                a ciegas
              </h2>
              <p className="text-surqo-text-secondary font-medium text-sm leading-relaxed">
                Sin datos del suelo ni del clima local, cada decisión de riego, fertilización
                o fumigación es una apuesta. Surqo cierra esa brecha con tecnología accesible
                y análisis de inteligencia artificial.
              </p>
            </div>
            <div className="space-y-3">
              {PROBLEM_POINTS.map((p) => (
                <div key={p} className="glass rounded-xl border border-surqo-danger/10 px-5 py-4 flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-surqo-danger shrink-0" />
                  <p className="text-sm text-surqo-text-secondary font-medium">{p}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── LA SOLUCIÓN: 3 PASOS ── */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-surqo-green-bright mb-4">La solución</p>
          <h2 className="text-4xl font-black tracking-tighter">
            De 0 a datos reales<br />
            <span className="text-gradient">en 3 pasos</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {SOLUTION_STEPS.map((s) => {
            const Icon = s.icon
            return (
              <div key={s.step} className="glass rounded-2xl border border-white/[0.07] hover:border-surqo-green/20 transition-all p-7 relative overflow-hidden group">
                <span className="absolute top-4 right-5 text-6xl font-black text-white/[0.03] group-hover:text-surqo-green/5 transition-colors leading-none select-none">
                  {s.step}
                </span>
                <div className="w-11 h-11 rounded-xl bg-surqo-green/10 border border-surqo-green/20 flex items-center justify-center text-surqo-green mb-5">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-surqo-text tracking-tight mb-2">{s.title}</h3>
                <p className="text-sm text-surqo-text-secondary font-medium leading-relaxed">{s.desc}</p>
              </div>
            )
          })}
        </div>
        <div className="text-center mt-8">
          <Link href="/como-funciona" className="text-sm font-bold text-surqo-green-bright hover:underline inline-flex items-center gap-1.5">
            Ver el proceso completo en detalle <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="border-y border-white/[0.06] bg-white/[0.02]">
        <div className="max-w-5xl mx-auto px-4 py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map(({ icon: Icon, value, label, color }) => (
              <div key={label} className="text-center">
                <div className="w-10 h-10 rounded-xl bg-surqo-green/10 border border-surqo-green/20 flex items-center justify-center text-surqo-green mx-auto mb-3">
                  <Icon className="w-5 h-5" />
                </div>
                <div className={`text-2xl font-black mb-1 ${color}`}>{value}</div>
                <div className="text-xs font-bold text-surqo-text-muted tracking-widest uppercase">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── POR QUÉ SURQO ── */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-surqo-green-bright mb-4">Por qué Surqo</p>
          <h2 className="text-4xl font-black tracking-tighter">
            Construido para<br />
            <span className="text-gradient">el campo colombiano</span>
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          {FEATURES.map((f) => {
            const Icon = f.icon
            return (
              <div key={f.title} className="glass rounded-2xl border border-white/[0.07] hover:border-surqo-green/20 transition-all p-7 flex gap-5">
                <div className="w-10 h-10 rounded-xl bg-surqo-green/10 border border-surqo-green/20 flex items-center justify-center text-surqo-green shrink-0 mt-0.5">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-surqo-text text-sm mb-2">{f.title}</h3>
                  <p className="text-xs text-surqo-text-secondary font-medium leading-relaxed">{f.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── TESTIMONIOS ── */}
      <section className="border-t border-white/[0.06] bg-white/[0.02]">
        <div className="max-w-5xl mx-auto px-4 py-20">
          <div className="text-center mb-14">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-surqo-green-bright mb-4">Piloto</p>
            <h2 className="text-4xl font-black tracking-tighter">
              Lo que dicen los<br />
              <span className="text-gradient">agricultores del piloto</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="glass rounded-2xl border border-white/[0.07] p-7 flex flex-col gap-5">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, s) => (
                    <span key={s} className="text-surqo-green">★</span>
                  ))}
                </div>
                <p className="text-base text-surqo-text-secondary leading-relaxed font-medium flex-1">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3 border-t border-white/[0.06] pt-5">
                  <div className="w-9 h-9 rounded-full bg-surqo-green/10 border border-surqo-green/20 flex items-center justify-center text-sm font-black text-surqo-green shrink-0">
                    {t.author[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-surqo-text">{t.author} — {t.role}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-surqo-text-muted" />
                      <p className="text-[11px] text-surqo-text-muted font-medium">{t.location}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EXPLORAR PÁGINAS ── */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black tracking-tighter mb-2">Explora el proyecto</h2>
          <p className="text-surqo-text-secondary font-medium text-sm">
            Todo lo que necesitas saber antes de empezar.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {PAGES.map(({ href, label, desc, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="glass rounded-2xl border border-white/[0.07] hover:border-surqo-green/20 transition-all p-6 flex flex-col gap-4 group"
            >
              <div className="w-10 h-10 rounded-xl bg-surqo-green/10 border border-surqo-green/20 flex items-center justify-center text-surqo-green group-hover:scale-110 transition-transform">
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-black text-surqo-text text-sm mb-1">{label}</p>
                <p className="text-xs text-surqo-text-muted font-medium leading-relaxed">{desc}</p>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-surqo-green-bright">
                Ver más <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="max-w-5xl mx-auto px-4 pb-24">
        <div className="glass rounded-3xl border border-surqo-green/20 p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 mesh-bg opacity-20 pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-surqo-green/10 border border-surqo-green/20 rounded-full px-4 py-2 text-xs font-bold text-surqo-green-bright mb-6">
              <Zap className="w-3.5 h-3.5" />
              100% gratuito · Siempre
            </div>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tighter mb-4">
              Tu finca inteligente<br />
              <span className="text-gradient">te está esperando</span>
            </h2>
            <p className="text-surqo-text-secondary font-medium mb-10 max-w-lg mx-auto">
              Crea tu cuenta, registra tu finca y empieza a recibir análisis agronómicos
              con IA en menos de 5 minutos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="h-14 px-12 text-base rounded-2xl group" asChild>
                <Link href="/register">
                  Crear cuenta gratis
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="h-14 px-10 text-base rounded-2xl" asChild>
                <Link href="/login">Ya tengo cuenta</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
