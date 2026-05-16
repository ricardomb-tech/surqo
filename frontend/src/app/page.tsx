import Link from "next/link"
import { Button, Card } from "@/components/ui/Primitives"
import { ArrowRight, Cpu, LineChart, ShieldCheck } from "lucide-react"

const features = [
  {
    icon: <Cpu className="w-6 h-6" />,
    title: "Edge Computing IoT",
    description: "Nodos ESP32 con sensores industriales de alta precisión (DHT22, DS18B20) y transmisión segura via MQTT TLS.",
    badge: "Hardware",
  },
  {
    icon: <LineChart className="w-6 h-6" />,
    title: "IA Agronómica",
    description: "Modelos de Claude Anthropic optimizados para el campo colombiano. Análisis de VPD, ETc y estrés hídrico.",
    badge: "Inteligencia",
  },
  {
    icon: <ShieldCheck className="w-6 h-6" />,
    title: "Protocolos de Alerta",
    description: "Monitoreo 24/7 con notificaciones instantáneas y dashboards interactivos de baja latencia.",
    badge: "Seguridad",
  },
]

const stats = [
  { label: "VPD", value: "1.2", unit: "kPa" },
  { label: "Humedad", value: "45", unit: "%" },
  { label: "Temp", value: "28", unit: "°C" },
  { label: "ETc", value: "4.2", unit: "mm" },
]

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        <div className="absolute inset-0 mesh-bg opacity-30 dark:opacity-40 pointer-events-none" />
        <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-10 dark:opacity-20 pointer-events-none" />
        
        <div className="max-w-6xl mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-surqo-green/10 dark:bg-surqo-green/10 border border-surqo-green/20 rounded-full px-4 py-2 text-xs font-bold text-surqo-green-bright mb-8 animate-fade-up shadow-inner-glow">
            <span className="live-dot" />
            <span className="tracking-widest uppercase">Red Activa en Córdoba, Colombia</span>
          </div>

          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter mb-8 text-balance animate-fade-up leading-[0.85]">
            Del surco al <br />
            <span className="text-gradient">insight.</span>
          </h1>

          <p className="text-lg sm:text-xl text-surqo-text-secondary max-w-2xl mx-auto mb-12 text-balance leading-relaxed animate-fade-up font-medium" style={{ animationDelay: "0.1s" }}>
            Impulsamos la agricultura colombiana con inteligencia de datos real. 
            Conecta tus cultivos, optimiza tus recursos, maximiza tu cosecha.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up items-center" style={{ animationDelay: "0.2s" }}>
            <Button size="lg" className="h-14 px-10 text-lg rounded-2xl group" asChild>
              <Link href="/dashboard">
                Entrar al Dashboard
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="h-14 px-10 text-lg rounded-2xl" asChild>
              <Link href="/analyze">
                Probar IA
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="border-y border-black/5 dark:border-white/5 bg-surqo-bg-surface/30 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-black text-gradient mb-1">{s.value}</div>
                <div className="text-xs font-bold text-surqo-text-muted tracking-widest uppercase">{s.label} ({s.unit})</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-6xl mx-auto px-4 py-32">
        <div className="text-center mb-20">
          <h2 className="text-4xl sm:text-5xl font-black tracking-tighter mb-4">Tecnología de <span className="text-gradient">Precisión</span></h2>
          <p className="text-surqo-text-secondary font-medium">Diseñado para los desafíos climáticos del trópico colombiano.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <Card key={f.title} className="group hover:border-surqo-green/30 hover:shadow-glow-sm transition-all duration-500 overflow-hidden relative" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="scan-line" />
              <div className="w-14 h-14 rounded-2xl bg-surqo-green/10 flex items-center justify-center text-surqo-green mb-6 border border-surqo-green/20 group-hover:scale-110 transition-transform duration-500">
                {f.icon}
              </div>
              <div className="text-xs font-bold text-surqo-green-bright bg-surqo-green/10 border border-surqo-green/20 px-2.5 py-1 rounded-lg inline-block mb-4">
                {f.badge}
              </div>
              <h3 className="text-xl font-black text-surqo-text mb-3 tracking-tight">{f.title}</h3>
              <p className="text-surqo-text-secondary text-sm leading-relaxed font-medium">{f.description}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
