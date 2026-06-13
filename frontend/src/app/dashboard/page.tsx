"use client"

import { useState, useEffect } from "react"
import { Button, Card } from "@/components/ui/Primitives"
import {
  Cloud, Droplets, Thermometer, Wind, AlertCircle,
  RefreshCcw, BarChart3, Waves, ArrowRight, Loader2, MapPin, Sprout
} from "lucide-react"
import { KPICard } from "@/components/KPICard"
import { SensorChart } from "@/components/SensorChart"
import { LiveFeed } from "@/components/LiveFeed"
import { AlertBadge } from "@/components/AlertBadge"
import { AnalysisResult } from "@/components/AnalysisResult"
import { RequireAuth } from "@/components/RequireAuth"
import { farmAPI, alertAPI, analysisAPI, sensorAPI } from "@/lib/api"
import { cn } from "@/lib/utils"
import type { Farm, Alert, KPIs, Analysis, TimeseriesPoint } from "@/types"

function DashboardContent() {
  const [farm, setFarm] = useState<Farm | null>(null)
  const [kpis, setKpis] = useState<KPIs | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [timeseries, setTimeseries] = useState<TimeseriesPoint[]>([])
  const [lastAnalysis, setLastAnalysis] = useState<Analysis | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const load = async () => {
    try {
      const farms = await farmAPI.list()
      if (farms.length === 0) return
      const f = farms[0]
      setFarm(f)
      const [kpiData, alertData, tsData, analysisData] = await Promise.allSettled([
        farmAPI.kpis(f.id),
        alertAPI.active(f.id),
        sensorAPI.timeseries(f.id, 24, "soil_moisture_pct"),
        analysisAPI.history(f.id),
      ])
      if (kpiData.status === "fulfilled" && !("error" in kpiData.value)) setKpis(kpiData.value)
      if (alertData.status === "fulfilled") setAlerts(alertData.value)
      if (tsData.status === "fulfilled") setTimeseries(tsData.value)
      if (analysisData.status === "fulfilled" && analysisData.value.length > 0) {
        setLastAnalysis(analysisData.value[0])
      }
    } catch {
      // silently handle
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await load()
    setIsRefreshing(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-surqo-green animate-spin" />
      </div>
    )
  }

  if (!farm) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-3xl bg-surqo-green/10 border border-surqo-green/20 flex items-center justify-center mx-auto mb-6">
            <Sprout className="w-10 h-10 text-surqo-green" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 mb-2">
            Aún no tienes una finca
          </h2>
          <p className="text-slate-500 font-medium mb-8">
            Registra tu finca para comenzar a monitorear tus cultivos y ver los datos en tiempo real.
          </p>
          <Button
            variant="primary"
            className="gap-2 px-8"
            onClick={() => window.location.href = "/farms"}
          >
            <Sprout className="w-4 h-4" />
            Registrar mi finca
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    )
  }

  const location = [farm.municipality, farm.department].filter(Boolean).join(", ")

  const kpiStatus = (val: number | undefined, low: number, high: number) =>
    val === undefined ? "ok" : val < low ? "warning" : val > high ? "critical" : "ok"

  return (
    <div className="min-h-screen pt-16">
      <div className="max-w-7xl mx-auto px-4 py-8">

        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-surqo-green-bright font-bold text-xs tracking-[0.2em] uppercase">
              <span className="live-dot" />
              Terminal de Control Operativo
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter">
              <span className="text-gradient">{farm.name}</span>
            </h1>
            <p className="text-surqo-text-secondary font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {location || "Colombia"} · {farm.crop_type}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2">
              <RefreshCcw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
              Sincronizar
            </Button>
          </div>
        </header>

        <div className="grid lg:grid-cols-12 gap-6">

          <div className="lg:col-span-8 space-y-6">

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <KPICard
                title="VPD"
                value={kpis ? (kpis.vpd_kpa?.toFixed(2) ?? "—") : "—"}
                unit="kPa"
                status={kpis ? kpiStatus(kpis.vpd_kpa, 0.4, 1.6) : "ok"}
                icon={<Wind className="w-5 h-5" />}
                trend="stable"
              />
              <KPICard
                title="Humedad Suelo"
                value={kpis ? (kpis.avg_soil_moisture_pct?.toFixed(1) ?? "—") : "—"}
                unit="%"
                status={kpis ? kpiStatus(kpis.avg_soil_moisture_pct, 30, 80) : "ok"}
                icon={<Droplets className="w-5 h-5" />}
                trend="stable"
              />
              <KPICard
                title="Temp. Ambiente"
                value={kpis ? (kpis.avg_air_temp_c?.toFixed(1) ?? "—") : "—"}
                unit="°C"
                status={kpis ? kpiStatus(kpis.avg_air_temp_c, 15, 35) : "ok"}
                icon={<Thermometer className="w-5 h-5" />}
                trend="stable"
              />
            </div>

            <Card className="p-0 overflow-hidden border-surqo-green/10">
              <div className="p-6 border-b border-black/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-surqo-green/10 flex items-center justify-center text-surqo-green">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black tracking-tight">Histórico de Variables</h3>
                    <p className="text-xs text-surqo-text-muted font-bold uppercase tracking-widest">Últimas 24 Horas</p>
                  </div>
                </div>
              </div>
              <div className="p-4 h-[350px]">
                <SensorChart data={timeseries.length > 0 ? timeseries : undefined} metric="Humedad Suelo" unit="%" />
              </div>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                    <Cloud className="w-5 h-5" />
                  </div>
                  <h3 className="font-black tracking-tight">Análisis Inteligente</h3>
                </div>
                <AnalysisResult analysis={lastAnalysis} />
              </Card>

              <Card className="p-6 bg-surqo-green/[0.02]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-surqo-green/10 flex items-center justify-center text-surqo-green">
                    <Waves className="w-5 h-5" />
                  </div>
                  <h3 className="font-black tracking-tight">Salud del Suelo</h3>
                </div>
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-black/5 border border-black/5">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-xs font-bold text-surqo-text-muted uppercase">Índice de salud</span>
                      <span className="text-lg font-black text-surqo-green">
                        {kpis ? `${Math.round(kpis.soil_health_score)}%` : "—"}
                      </span>
                    </div>
                    {kpis && (
                      <div className="h-2 w-full bg-black/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-surqo-green rounded-full"
                          style={{ width: `${kpis.soil_health_score}%` }}
                        />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-surqo-text-secondary leading-relaxed font-medium">
                    {kpis
                      ? `${kpis.readings_count_24h} lecturas en las últimas 24h. Riesgo de plagas: ${kpis.pest_risk?.risk_pct ?? 0}%.`
                      : "Sin datos de sensores disponibles aún."}
                  </p>
                </div>
              </Card>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <Card className="p-0 border-surqo-danger/10">
              <div className="p-6 border-b border-black/5 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-surqo-danger" />
                <h3 className="font-black tracking-tight">Centro de Alertas</h3>
                {alerts.length > 0 && (
                  <span className="ml-auto text-xs font-bold bg-surqo-danger/10 text-surqo-danger px-2 py-0.5 rounded-full">
                    {alerts.length}
                  </span>
                )}
              </div>
              <div className="p-4 space-y-3">
                {alerts.length === 0 ? (
                  <p className="text-sm text-surqo-text-muted text-center py-4 font-medium">
                    Sin alertas activas
                  </p>
                ) : (
                  alerts.slice(0, 4).map((a) => (
                    <AlertBadge
                      key={a.id}
                      severity={a.severity as "critical" | "warning" | "info"}
                      message={a.title}
                      time={new Date(a.created_at).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                      alert={a}
                    />
                  ))
                )}
              </div>
            </Card>

            <Card className="p-0">
              <div className="p-6 border-b border-black/5 flex items-center gap-3">
                <RefreshCcw className="w-5 h-5 text-surqo-green" />
                <h3 className="font-black tracking-tight">Live Feed</h3>
              </div>
              <div className="p-4">
                <LiveFeed farmId={farm.id} />
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-surqo-green/10 to-transparent border-surqo-green/20">
              <h4 className="text-sm font-black mb-2 tracking-tight">Análisis IA</h4>
              <p className="text-xs text-surqo-text-secondary mb-4 font-medium leading-relaxed">
                Genera un análisis predictivo completo de tu finca con Llama 3.3 70B.
              </p>
              <Button variant="primary" size="sm" className="w-full group" onClick={() => window.location.href = "/analyze"}>
                Ir a Análisis IA
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  return (
    <RequireAuth>
      <DashboardContent />
    </RequireAuth>
  )
}
