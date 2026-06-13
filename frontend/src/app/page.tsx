import Link from "next/link"
import { ArrowRight, Zap, Cpu, Brain, Bell, BarChart3, Droplets, Thermometer, Wind } from "lucide-react"
import { Button } from "@/components/ui/Primitives"

const solutions = [
  {
    icon: Cpu,
    badge: "IoT",
    title: "Sensores en campo real",
    description:
      "Nodos ESP32 con sensores de temperatura, humedad de suelo y aire. Datos cada 15 minutos, directamente desde tu cultivo.",
  },
  {
    icon: Brain,
    badge: "Inteligencia Artificial",
    title: "Análisis agronómico con IA",
    description:
      "Llama 3.3 70B analiza el clima de 7 días, el estado del suelo y te dice exactamente cuándo y cuánto regar, fertilizar o actuar.",
  },
  {
    icon: Bell,
    badge: "Alertas",
    title: "Alertas antes de que sea tarde",
    description:
      "Detectamos estrés hídrico, riesgo de plagas y condiciones críticas. Te avisamos por email en tiempo real antes de que pierdas la cosecha.",
  },
  {
    icon: BarChart3,
    badge: "Dashboard",
    title: "Todo en un panel",
    description:
      "VPD, ETc, humedad de suelo, temperatura y análisis histórico. Un dashboard profesional accesible desde cualquier dispositivo.",
  },
]

const steps = [
  {
    number: "01",
    title: "Instala el nodo",
    description: "Conecta el Surqo Node en tu finca. WiFi o 4G. Empieza a recibir datos en minutos.",
  },
  {
    number: "02",
    title: "La IA analiza",
    description: "Combinamos tus datos del suelo con el pronóstico climático de 7 días para generar recomendaciones precisas.",
  },
  {
    number: "03",
    title: "Tú decides",
    description: "Recibe el análisis en tu dashboard. Cuándo regar, cuánto fertilizar, qué riesgo hay esta semana.",
  },
]

const metrics = [
  { icon: Droplets, value: "45%", label: "Ahorro de agua" },
  { icon: Thermometer, value: "±0.5°C", label: "Precisión temperatura" },
  { icon: Wind, value: "1.2 kPa", label: "VPD en tiempo real" },
  { icon: BarChart3, value: "24/7", label: "Monitoreo continuo" },
]

export default function Home() {
  return (
    <div className="min-h-screen">

      {/* ── HERO ── */}
      <section className="relative pt-32 pb-28 overflow-hidden">
        <div className="absolute inset-0 mesh-bg opacity-30 pointer-events-none" />
        <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-10 pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-surqo-green/10 border border-surqo-green/20 rounded-full px-4 py-2 text-xs font-bold text-surqo-green-bright mb-8 shadow-inner-glow">
            <span className="live-dot" />
            <span className="tracking-widest uppercase">Piloto activo · Córdoba, Colombia</span>
          </div>

          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter mb-6 leading-[0.88]">
            La agricultura colombiana<br />
            merece datos <span className="text-gradient">reales.</span>
          </h1>

          <p className="text-lg sm:text-xl text-surqo-text-secondary max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
            Surqo conecta tus cultivos a la inteligencia artificial. Sensores IoT + análisis agronómico
            + alertas automáticas. Todo en uno, desde $180.000 COP.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="h-14 px-10 text-base rounded-2xl group" asChild>
              <Link href="/register">
                Empieza gratis
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="h-14 px-10 text-base rounded-2xl" asChild>
              <Link href="/login">
                Ya tengo cuenta
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── MÉTRICAS ── */}
      <section className="border-y border-black/5 dark:border-white/5 bg-surqo-bg-surface/30 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {metrics.map(({ icon: Icon, value, label }) => (
              <div key={label} className="text-center">
                <div className="w-10 h-10 rounded-xl bg-surqo-green/10 flex items-center justify-center text-surqo-green mx-auto mb-3 border border-surqo-green/20">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-2xl font-black text-gradient mb-1">{value}</div>
                <div className="text-xs font-bold text-surqo-text-muted tracking-widest uppercase">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOLUCIONES ── */}
      <section className="max-w-5xl mx-auto px-4 py-28">
        <div className="text-center mb-16">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-surqo-green-bright mb-4">Soluciones</p>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tighter mb-4">
            Todo lo que necesita<br />
            <span className="text-gradient">tu finca</span>
          </h2>
          <p className="text-surqo-text-secondary font-medium max-w-lg mx-auto">
            Diseñado para los desafíos reales del campo colombiano: clima tropical, conectividad limitada y decisiones urgentes.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {solutions.map((s) => {
            const Icon = s.icon
            return (
              <div key={s.title} className="glass rounded-2xl border border-white/[0.07] p-8 group hover:border-surqo-green/20 transition-all duration-300">
                <div className="flex items-start gap-5">
                  <div className="w-12 h-12 rounded-xl bg-surqo-green/10 border border-surqo-green/20 flex items-center justify-center text-surqo-green shrink-0 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold tracking-widest uppercase text-surqo-green-bright bg-surqo-green/10 border border-surqo-green/20 px-2 py-0.5 rounded-md">
                      {s.badge}
                    </span>
                    <h3 className="text-lg font-black tracking-tight text-surqo-text mt-2 mb-2">{s.title}</h3>
                    <p className="text-sm text-surqo-text-secondary leading-relaxed font-medium">{s.description}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ── */}
      <section className="border-t border-black/5 dark:border-white/5 bg-surqo-bg-surface/20">
        <div className="max-w-5xl mx-auto px-4 py-28">
          <div className="text-center mb-16">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-surqo-green-bright mb-4">Proceso</p>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tighter">
              Tres pasos para<br />
              <span className="text-gradient">transformar tu finca</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <div className="text-6xl font-black text-surqo-green/10 mb-4 leading-none">{step.number}</div>
                <h3 className="text-xl font-black tracking-tight text-surqo-text mb-3">{step.title}</h3>
                <p className="text-sm text-surqo-text-secondary leading-relaxed font-medium">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="max-w-5xl mx-auto px-4 py-28">
        <div className="glass rounded-3xl border border-surqo-green/20 p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 mesh-bg opacity-20 pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-surqo-green/10 border border-surqo-green/20 rounded-full px-4 py-2 text-xs font-bold text-surqo-green-bright mb-6">
              <Zap className="w-3.5 h-3.5" />
              Empieza hoy · Sin tarjeta de crédito
            </div>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tighter mb-4">
              Tu finca inteligente<br />
              <span className="text-gradient">te está esperando</span>
            </h2>
            <p className="text-surqo-text-secondary font-medium mb-10 max-w-lg mx-auto">
              Crea tu cuenta gratis, registra tu finca y empieza a recibir análisis agronómicos
              con IA en menos de 5 minutos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" className="h-14 px-12 text-base rounded-2xl group" asChild>
                <Link href="/register">
                  Crear cuenta gratis
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="h-14 px-10 text-base rounded-2xl" asChild>
                <Link href="/login">Iniciar sesión</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-200 dark:border-white/5 py-12">
        <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-surqo-green" />
            <span className="text-base font-black tracking-tighter text-gradient">SURQO</span>
          </div>
          <p className="text-xs text-surqo-text-muted font-medium">
            © 2026 Surqo · Inteligencia Agroclimática · Córdoba, Colombia
          </p>
          <div className="flex items-center gap-4 text-xs text-surqo-text-muted font-medium">
            <Link href="/login" className="hover:text-surqo-green transition-colors">Iniciar sesión</Link>
            <Link href="/register" className="hover:text-surqo-green transition-colors">Registrarse</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
