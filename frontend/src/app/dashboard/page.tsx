"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Wind, Droplets, Thermometer, AlertCircle,
  RefreshCcw, BarChart3, Waves, ArrowRight,
  Loader2, MapPin, Sprout, Activity, Brain,
  Clock, Wifi, WifiOff,
} from "lucide-react"
import { Button } from "@/components/ui/Primitives"
import { KPICard } from "@/components/KPICard"
import { SensorChart } from "@/components/SensorChart"
import { LiveFeed } from "@/components/LiveFeed"
import { AlertBadge } from "@/components/AlertBadge"
import { AnalysisResult } from "@/components/AnalysisResult"
import { RequireAuth } from "@/components/RequireAuth"
import { farmAPI, alertAPI, analysisAPI, sensorAPI } from "@/lib/api"
import { cn } from "@/lib/utils"
import type { Farm, Alert, KPIs, Analysis, TimeseriesPoint } from "@/types"

// ── helpers ────────────────────────────────────────────────────────────────────
function kpiStatus(val: number | undefined, low: number, high: number) {
  if (val === undefined) return "ok" as const
  if (val < low) return "warning" as const
  if (val > high) return "critical" as const
  return "ok" as const
}

function relativeTime(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return `hace ${diff}s`
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`
  return `hace ${Math.floor(diff / 3600)}h`
}

// ── empty state ────────────────────────────────────────────────────────────────
function NoFarm() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 rounded-3xl bg-surqo-green/10 border border-surqo-green/20 flex items-center justify-center mx-auto mb-6">
          <Sprout className="w-10 h-10 text-surqo-green" />
        </div>
        <h2 className="text-2xl font-black tracking-tight mb-2">Aún no tienes una finca</h2>
        <p className="text-surqo-text-secondary font-medium mb-8 text-sm leading-relaxed">
          Registra tu primera finca para comenzar a monitorear tus cultivos y recibir análisis con IA.
        </p>
        <Button className="gap-2 px-8" onClick={() => (window.location.href = "/farms")}>
          <Sprout className="w-4 h-4" />
          Registrar mi finca
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

// ── main dashboard ─────────────────────────────────────────────────────────────
function DashboardContent() {
  const [farm, setFarm] = useState<Farm | null>(null)
  const [kpis, setKpis] = useState<KPIs | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [timeseries, setTimeseries] = useState<TimeseriesPoint[]>([])
  const [lastAnalysis, setLastAnalysis] = useState<Analysis | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastSync, setLastSync] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const farms = await farmAPI.list()
      if (!farms.length) return
      const f = farms[0]
      setFarm(f)

      const [kpiRes, alertRes, tsRes, analysisRes] = await Promise.allSettled([
        farmAPI.kpis(f.id),
        alertAPI.active(f.id),
        sensorAPI.timeseries(f.id, 24, "soil_moisture_pct"),
        analysisAPI.history(f.id),
      ])

      if (kpiRes.status === "fulfilled" && !("error" in kpiRes.value)) setKpis(kpiRes.value)
      if (alertRes.status === "fulfilled") setAlerts(alertRes.value)
      if (tsRes.status === "fulfilled") setTimeseries(tsRes.value)
      if (analysisRes.status === "fulfilled" && analysisRes.value.length > 0)
        setLastAnalysis(analysisRes.value[0])

      setLastSync(new Date().toISOString())
    } catch {
      // silently handle
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-surqo-green animate-spin" />
          <p className="text-sm text-surqo-text-muted font-medium">Cargando datos de la finca…</p>
        </div>
      </div>
    )
  }

  if (!farm) return <NoFarm />

  const location = [farm.municipality, farm.department].filter(Boolean).join(", ") || "Colombia"
  const activeAlerts = alerts.filter((a) => !a.is_resolved)
  const hasSensorData = !!kpis
  const hasTimeseries = timeseries.length > 0

  return (
    <div className="min-h-screen pt-16 bg-surqo-bg">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

        {/* ── HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="live-dot" />
              <span className="text-xs font-bold tracking-[0.15em] uppercase text-surqo-green-bright">
                Terminal de Control
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-surqo-text">
              {farm.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-1.5">
              <span className="flex items-center gap-1.5 text-sm text-surqo-text-secondary font-medium">
                <MapPin className="w-3.5 h-3.5" />
                {location}
              </span>
              <span className="w-1 h-1 rounded-full bg-surqo-text-muted" />
              <span className="text-sm text-surqo-text-secondary font-medium">{farm.crop_type}</span>
              {farm.area_hectares && (
                <>
                  <span className="w-1 h-1 rounded-full bg-surqo-text-muted" />
                  <span className="text-sm text-surqo-text-secondary font-medium">{farm.area_hectares} ha</span>
                </>
              )}
              {lastSync && (
                <>
                  <span className="w-1 h-1 rounded-full bg-surqo-text-muted" />
                  <span className="flex items-center gap-1 text-xs text-surqo-text-muted font-medium">
                    <Clock className="w-3 h-3" />
                    {relativeTime(lastSync)}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {activeAlerts.length > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surqo-danger/10 border border-surqo-danger/20 text-surqo-danger text-xs font-bold">
                <AlertCircle className="w-3.5 h-3.5" />
                {activeAlerts.length} alerta{activeAlerts.length > 1 ? "s" : ""}
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="gap-2 h-9"
            >
              <RefreshCcw className={cn("w-3.5 h-3.5", refreshing && "animate-spin")} />
              Sincronizar
            </Button>
          </div>
        </div>

        {/* ── KPI ROW ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="VPD"
            value={kpis?.vpd_kpa?.toFixed(2) ?? "—"}
            unit="kPa"
            status={kpis ? kpiStatus(kpis.vpd_kpa, 0.4, 1.6) : "ok"}
            icon={<Wind className="w-5 h-5" />}
            trend="stable"
            description="Déficit de presión de vapor. Rango óptimo: 0.4–1.6 kPa"
          />
          <KPICard
            title="Humedad del suelo"
            value={kpis?.avg_soil_moisture_pct?.toFixed(1) ?? "—"}
            unit="%"
            status={kpis ? kpiStatus(kpis.avg_soil_moisture_pct, 30, 80) : "ok"}
            icon={<Droplets className="w-5 h-5" />}
            trend="stable"
            description="Humedad volumétrica promedio de las últimas 24 h"
          />
          <KPICard
            title="Temperatura aire"
            value={kpis?.avg_air_temp_c?.toFixed(1) ?? "—"}
            unit="°C"
            status={kpis ? kpiStatus(kpis.avg_air_temp_c, 15, 35) : "ok"}
            icon={<Thermometer className="w-5 h-5" />}
            trend="stable"
            description="Temperatura ambiente promedio del nodo sensor"
          />
          <KPICard
            title="Salud del suelo"
            value={kpis ? `${Math.round(kpis.soil_health_score)}` : "—"}
            unit="/100"
            status={kpis ? kpiStatus(kpis.soil_health_score, 40, 100) : "ok"}
            icon={<Waves className="w-5 h-5" />}
            trend="stable"
            description="Índice compuesto: humedad, temperatura y conductividad del suelo"
          />
        </div>

        {/* ── SENSOR STATUS BANNER (sin datos) ── */}
        {!hasSensorData && (
          <div className="glass rounded-2xl border border-dashed border-surqo-text-muted/20 p-6 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="w-12 h-12 rounded-xl bg-surqo-text-muted/10 flex items-center justify-center shrink-0">
              <WifiOff className="w-6 h-6 text-surqo-text-muted" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-surqo-text mb-0.5">Sin lecturas de sensores</p>
              <p className="text-sm text-surqo-text-secondary font-medium">
                El nodo ESP32 aún no ha enviado datos. Conecta el nodo a WiFi o configura el MQTT para ver métricas en tiempo real.
              </p>
            </div>
            <Button variant="outline" size="sm" className="shrink-0" onClick={() => (window.location.href = "/sensors")}>
              <Activity className="w-3.5 h-3.5 mr-1.5" />
              Ver sensores
            </Button>
          </div>
        )}

        {/* ── CHART + LIVE FEED ── */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Chart — 2/3 */}
          <div className="lg:col-span-2 glass rounded-2xl border border-white/[0.07] overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-surqo-green/10 flex items-center justify-center text-surqo-green">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-surqo-text text-sm">Humedad del Suelo</p>
                  <p className="text-[11px] text-surqo-text-muted font-bold uppercase tracking-widest">Últimas 24 horas</p>
                </div>
              </div>
              {hasTimeseries && (
                <span className="text-[10px] font-bold text-surqo-green-bright bg-surqo-green/10 border border-surqo-green/20 px-2 py-1 rounded-lg">
                  {timeseries.length} lecturas
                </span>
              )}
            </div>
            <div className="p-4 h-[280px]">
              <SensorChart
                data={hasTimeseries ? timeseries : undefined}
                metric="Humedad Suelo"
                unit="%"
              />
            </div>
          </div>

          {/* Live Feed — 1/3 */}
          <div className="glass rounded-2xl border border-white/[0.07] overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-surqo-sky/10 flex items-center justify-center text-surqo-sky">
                <Wifi className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-surqo-text text-sm">Live Feed</p>
                <p className="text-[11px] text-surqo-text-muted font-bold uppercase tracking-widest">Nodo ESP32</p>
              </div>
            </div>
            <div className="p-4">
              <LiveFeed farmId={farm.id} />
            </div>
          </div>
        </div>

        {/* ── AI ANALYSIS + ALERTS ── */}
        <div className="grid lg:grid-cols-5 gap-6">

          {/* AI Analysis — 3/5 */}
          <div className="lg:col-span-3 glass rounded-2xl border border-white/[0.07] overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                  <Brain className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-surqo-text text-sm">Análisis con IA</p>
                  <p className="text-[11px] text-surqo-text-muted font-bold uppercase tracking-widest">
                    {lastAnalysis
                      ? relativeTime(lastAnalysis.created_at)
                      : "Sin análisis aún"}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() => (window.location.href = "/analyze")}
              >
                <Brain className="w-3.5 h-3.5" />
                Nuevo análisis
              </Button>
            </div>
            <div className="p-6">
              {lastAnalysis ? (
                <AnalysisResult analysis={lastAnalysis} />
              ) : (
                <div className="flex flex-col items-center justify-center py-10 gap-4 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                    <Brain className="w-7 h-7 text-purple-400" />
                  </div>
                  <div>
                    <p className="font-bold text-surqo-text mb-1">Sin análisis todavía</p>
                    <p className="text-sm text-surqo-text-secondary font-medium max-w-xs">
                      Genera tu primer análisis agronómico con IA. Usamos el clima de 7 días + los datos de tus sensores.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="gap-2"
                    onClick={() => (window.location.href = "/analyze")}
                  >
                    <Brain className="w-4 h-4" />
                    Analizar mi finca
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Alerts — 2/5 */}
          <div className="lg:col-span-2 glass rounded-2xl border border-white/[0.07] overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  activeAlerts.length > 0
                    ? "bg-surqo-danger/10 text-surqo-danger"
                    : "bg-surqo-green/10 text-surqo-green"
                )}>
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-surqo-text text-sm">Alertas activas</p>
                  <p className="text-[11px] text-surqo-text-muted font-bold uppercase tracking-widest">
                    {activeAlerts.length} pendiente{activeAlerts.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              {activeAlerts.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => (window.location.href = "/alerts")}
                >
                  Ver todas
                </Button>
              )}
            </div>
            <div className="p-4 space-y-3">
              {activeAlerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                  <div className="w-10 h-10 rounded-xl bg-surqo-green/10 border border-surqo-green/20 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-surqo-green" />
                  </div>
                  <p className="text-sm font-bold text-surqo-text">Todo en orden</p>
                  <p className="text-xs text-surqo-text-muted font-medium">Sin alertas activas en este momento</p>
                </div>
              ) : (
                activeAlerts.slice(0, 4).map((a) => (
                  <AlertBadge
                    key={a.id}
                    severity={a.severity as "critical" | "warning" | "info"}
                    message={a.title}
                    time={new Date(a.created_at).toLocaleTimeString("es-CO", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    alert={a}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── SOIL DETAILS ── (solo si hay KPIs) */}
        {hasSensorData && (
          <div className="glass rounded-2xl border border-white/[0.07] p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-surqo-green/10 flex items-center justify-center text-surqo-green">
                <Waves className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-surqo-text text-sm">Salud del Suelo</p>
                <p className="text-[11px] text-surqo-text-muted font-bold uppercase tracking-widest">
                  Basado en {kpis!.readings_count_24h} lecturas · últimas 24 h
                </p>
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-6 items-center">
              {/* Score bar */}
              <div className="sm:col-span-1">
                <div className="flex items-end justify-between mb-2">
                  <span className="text-xs font-bold text-surqo-text-muted uppercase tracking-widest">Índice</span>
                  <span className="text-2xl font-black text-surqo-green">{Math.round(kpis!.soil_health_score)}%</span>
                </div>
                <div className="h-2 w-full bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-surqo-green rounded-full transition-all duration-700"
                    style={{ width: `${kpis!.soil_health_score}%` }}
                  />
                </div>
              </div>
              {/* Stats */}
              <div className="sm:col-span-2 grid grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <p className="text-lg font-black text-surqo-text">{kpis!.readings_count_24h}</p>
                  <p className="text-[10px] text-surqo-text-muted uppercase tracking-widest mt-0.5">Lecturas</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <p className="text-lg font-black text-surqo-text">{kpis!.pest_risk?.risk_pct ?? 0}%</p>
                  <p className="text-[10px] text-surqo-text-muted uppercase tracking-widest mt-0.5">Riesgo plagas</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <p className="text-lg font-black text-surqo-text">{kpis!.avg_humidity_pct?.toFixed(0) ?? "—"}%</p>
                  <p className="text-[10px] text-surqo-text-muted uppercase tracking-widest mt-0.5">HR aire</p>
                </div>
              </div>
            </div>
          </div>
        )}

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
