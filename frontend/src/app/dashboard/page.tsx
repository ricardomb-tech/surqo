"use client"

import { useState } from "react"
import { Button, Card } from "@/components/ui/Primitives"
import { 
  Cloud, 
  Droplets, 
  Thermometer, 
  Wind, 
  AlertCircle, 
  RefreshCcw, 
  LayoutDashboard,
  Settings,
  Database,
  BarChart3,
  Waves,
  ArrowRight
} from "lucide-react"
import { KPICard } from "@/components/KPICard"
import { SensorChart } from "@/components/SensorChart"
import { LiveFeed } from "@/components/LiveFeed"
import { AlertBadge } from "@/components/AlertBadge"
import { AnalysisResult } from "@/components/AnalysisResult"
import { cn } from "@/lib/utils"

const DEMO_FARM_NAME = "Finca La Esperanza"
const LOCATION = "Córdoba, Colombia"

export default function Dashboard() {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  return (
    <div className="min-h-screen pt-16">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Command Center Header */}
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-surqo-green-bright font-bold text-xs tracking-[0.2em] uppercase">
              <span className="live-dot" />
              Terminal de Control Operativo
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter">
              <span className="text-gradient">{DEMO_FARM_NAME}</span>
            </h1>
            <p className="text-surqo-text-secondary font-medium flex items-center gap-2">
              <Cloud className="w-4 h-4" />
              {LOCATION} · Monitoreo de Precisión
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2">
              <RefreshCcw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
              Sincronizar
            </Button>
            <Button variant="primary" size="sm" className="gap-2">
              <Settings className="w-4 h-4" />
              Configurar Nodo
            </Button>
          </div>
        </header>

        <div className="grid lg:grid-cols-12 gap-6">
          
          {/* Main Content Column */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <KPICard
                title="VPD"
                value="1.24"
                unit="kPa"
                status="ok"
                icon={<Wind className="w-5 h-5" />}
                trend="down"
              />
              <KPICard
                title="Humedad Suelo"
                value="42.8"
                unit="%"
                status="warning"
                icon={<Droplets className="w-5 h-5" />}
                trend="up"
              />
              <KPICard
                title="Temp. Ambiente"
                value="29.4"
                unit="°C"
                status="ok"
                icon={<Thermometer className="w-5 h-5" />}
                trend="stable"
              />
            </div>

            {/* Main Chart Area */}
            <Card className="p-0 overflow-hidden border-surqo-green/10">
              <div className="p-6 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-surqo-green/10 flex items-center justify-center text-surqo-green">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black tracking-tight">Histórico de Variables</h3>
                    <p className="text-xs text-surqo-text-muted font-bold uppercase tracking-widest">Últimas 24 Horas</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  {["1H", "6H", "24H", "7D"].map(t => (
                    <Button key={t} variant={t === "24H" ? "secondary" : "ghost"} size="sm" className="h-8 px-3 text-[10px]">
                      {t}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="p-4 h-[350px]">
                <SensorChart />
              </div>
            </Card>

            {/* Analysis & Recommendations */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                    <Database className="w-5 h-5" />
                  </div>
                  <h3 className="font-black tracking-tight">Análisis Inteligente</h3>
                </div>
                <AnalysisResult />
              </Card>

              <Card className="p-6 bg-surqo-green/[0.02]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-surqo-green/10 flex items-center justify-center text-surqo-green">
                    <Waves className="w-5 h-5" />
                  </div>
                  <h3 className="font-black tracking-tight">Estado Hídrico</h3>
                </div>
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-xs font-bold text-surqo-text-muted uppercase">Nivel freático</span>
                      <span className="text-lg font-black text-surqo-green">84%</span>
                    </div>
                    <div className="h-2 w-full bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-surqo-green w-[84%] rounded-full shadow-glow-sm" />
                    </div>
                  </div>
                  <p className="text-xs text-surqo-text-secondary leading-relaxed font-medium">
                    El suelo mantiene una capacidad de campo óptima. Se recomienda retrasar el próximo ciclo de riego 4 horas para maximizar la absorción radicular.
                  </p>
                </div>
              </Card>
            </div>
          </div>

          {/* Side Column - Live Feed & Alerts */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="p-0 border-surqo-danger/10">
              <div className="p-6 border-b border-black/5 dark:border-white/5 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-surqo-danger" />
                <h3 className="font-black tracking-tight">Centro de Alertas</h3>
              </div>
              <div className="p-4 space-y-3">
                <AlertBadge 
                  severity="critical" 
                  message="VPD excedido (>1.6 kPa)" 
                  time="Hace 2 min" 
                />
                <AlertBadge 
                  severity="warning" 
                  message="Humedad baja en Sector A" 
                  time="Hace 15 min" 
                />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Settings className="w-5 h-5 text-surqo-green" />
                <h3 className="font-black tracking-tight">Acción Rápida</h3>
              </div>
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <label htmlFor="node-id">Identificador de Nodo</label>
                  <input type="text" id="node-id" placeholder="Ej: SURQO-X01" className="w-full" />
                </div>
                <div>
                  <label htmlFor="threshold">Umbral Crítico (%)</label>
                  <input type="number" id="threshold" placeholder="45" className="w-full" />
                </div>
                <Button variant="primary" size="sm" className="w-full">
                  Actualizar Configuración
                </Button>
              </form>
            </Card>

            <Card className="p-0">
              <div className="p-6 border-b border-black/5 dark:border-white/5 flex items-center gap-3">
                <RefreshCcw className="w-5 h-5 text-surqo-green" />
                <h3 className="font-black tracking-tight">Live Feed Nodes</h3>
              </div>
              <div className="p-4">
                <LiveFeed />
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-surqo-green/10 to-transparent border-surqo-green/20">
              <h4 className="text-sm font-black mb-2 tracking-tight">¿Necesitas ayuda técnica?</h4>
              <p className="text-xs text-surqo-text-secondary mb-4 font-medium leading-relaxed">
                Nuestro equipo de soporte agronómico está disponible 24/7 para ayudarte con la configuración de tus sensores.
              </p>
              <Button variant="primary" size="sm" className="w-full group">
                Contactar Soporte
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
