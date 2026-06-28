"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Wind, Droplets, Thermometer, AlertCircle,
  RefreshCcw, BarChart3, Waves, ArrowRight,
  Loader2, MapPin, Sprout, Activity, Brain,
  Clock, Wifi, WifiOff, TrendingUp, TrendingDown, Minus,
  ChevronRight, Bell,
} from "lucide-react"
import { SensorChart } from "@/components/SensorChart"
import { LiveFeed } from "@/components/LiveFeed"
import { AnalysisResult } from "@/components/AnalysisResult"
import { RequireAuth } from "@/components/RequireAuth"
import { AppSidebar } from "@/components/AppSidebar"
import { farmAPI, alertAPI, analysisAPI, sensorAPI } from "@/lib/api"
import { cn } from "@/lib/utils"
import type { Farm, Alert, KPIs, Analysis, TimeseriesPoint } from "@/types"
import Link from "next/link"

const LIME = "#86E66A"
const LIME_DARK = "#2d6e10"

// ── helpers ────────────────────────────────────────────────────────────────────
function kpiStatus(val: number | undefined, low: number, high: number): "ok" | "warning" | "critical" {
  if (val === undefined) return "ok"
  if (val < low) return "warning"
  if (val > high) return "critical"
  return "ok"
}

function relativeTime(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return `hace ${diff}s`
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`
  return `hace ${Math.floor(diff / 3600)}h`
}

// ── Stat card ──────────────────────────────────────────────────────────────────
function StatCard({
  label, value, unit, icon, status, trend, description,
}: {
  label: string; value: string; unit: string
  icon: React.ReactNode; status: "ok" | "warning" | "critical"
  trend?: "up" | "down" | "stable"; description?: string
}) {
  const statusColors = {
    ok:       { bg: "#f0faf0", border: "#c8e8c8", badge: "#16a34a", text: LIME_DARK },
    warning:  { bg: "#fffbeb", border: "#fde68a", badge: "#d97706", text: "#92400e" },
    critical: { bg: "#fff1f1", border: "#fecaca", badge: "#dc2626", text: "#991b1b" },
  }
  const c = statusColors[status]

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus
  const trendColor = trend === "up" ? "#16a34a" : trend === "down" ? "#dc2626" : "#94a3b8"

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4 group relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      style={{ background: "#ffffff", border: "1px solid #e8f0e8", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
    >
      <div className="flex items-start justify-between">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: c.bg, border: `1px solid ${c.border}` }}
        >
          <div style={{ color: c.badge }}>{icon}</div>
        </div>
        {status !== "ok" && (
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{ background: c.bg, color: c.badge, border: `1px solid ${c.border}` }}
          >
            {status === "warning" ? "Atención" : "Crítico"}
          </span>
        )}
      </div>

      <div>
        <div className="flex items-baseline gap-1.5 mb-1">
          <span className="text-3xl font-black tracking-tight" style={{ color: "#0f1f0f" }}>{value}</span>
          <span className="text-sm font-medium text-gray-400">{unit}</span>
          {trend && (
            <TrendIcon className="w-4 h-4 ml-1" style={{ color: trendColor }} />
          )}
        </div>
        <p className="text-sm font-semibold text-gray-500">{label}</p>
        {description && (
          <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">{description}</p>
        )}
      </div>
    </div>
  )
}

// ── Section card ───────────────────────────────────────────────────────────────
function SectionCard({ title, subtitle, icon, action, children }: {
  title: string; subtitle?: string; icon: React.ReactNode
  action?: React.ReactNode; children: React.ReactNode
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "#ffffff", border: "1px solid #e8f0e8", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
    >
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: `${LIME}20` }}
          >
            <div style={{ color: LIME_DARK }}>{icon}</div>
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">{title}</p>
            {subtitle && <p className="text-[11px] text-gray-400 font-medium uppercase tracking-widest mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

// ── Empty state ────────────────────────────────────────────────────────────────
function NoFarm() {
  return (
    <div className="flex-1 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6"
          style={{ background: `${LIME}15`, border: `1px solid ${LIME}30` }}
        >
          <Sprout className="w-10 h-10" style={{ color: LIME_DARK }} />
        </div>
        <h2 className="text-2xl font-black tracking-tight mb-2 text-gray-900">Aún no tienes una finca</h2>
        <p className="text-gray-500 font-medium mb-8 text-sm leading-relaxed">
          Registra tu primera finca para comenzar a monitorear tus cultivos con IA.
        </p>
        <Link
          href="/farms"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5"
          style={{ background: LIME, color: "#0f1f0f", boxShadow: `0 4px 16px ${LIME}50` }}
        >
          <Sprout className="w-4 h-4" />
          Registrar mi finca
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}

// ── Dashboard ──────────────────────────────────────────────────────────────────
function DashboardContent() {
  const [farm,         setFarm]         = useState<Farm | null>(null)
  const [kpis,         setKpis]         = useState<KPIs | null>(null)
  const [alerts,       setAlerts]       = useState<Alert[]>([])
  const [timeseries,   setTimeseries]   = useState<TimeseriesPoint[]>([])
  const [lastAnalysis, setLastAnalysis] = useState<Analysis | undefined>(undefined)
  const [loading,      setLoading]      = useState(true)
  const [refreshing,   setRefreshing]   = useState(false)
  const [lastSync,     setLastSync]     = useState<string | null>(null)

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
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  const activeAlerts  = alerts.filter((a) => !a.is_resolved)
  const hasSensorData = !!kpis
  const hasTimeseries = timeseries.length > 0
  const location      = farm ? [farm.municipality, farm.department].filter(Boolean).join(", ") || "Colombia" : ""

  return (
    <div className="flex min-h-screen" style={{ background: "#f4f7f4" }}>

      {/* Sidebar */}
      <AppSidebar />

      {/* Main content — offset by sidebar width */}
      <div className="flex-1 flex flex-col min-h-screen pl-16">

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: LIME_DARK }} />
              <p className="text-sm text-gray-500 font-medium">Cargando datos de la finca…</p>
            </div>
          </div>
        ) : !farm ? (
          <NoFarm />
        ) : (
          <>
            {/* ── Top bar ── */}
            <header
              className="h-16 flex items-center justify-between px-6 border-b shrink-0 sticky top-0 z-30"
              style={{ background: "#ffffff", borderColor: "#e8f0e8" }}
            >
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400 font-medium">Dashboard</span>
                <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                <span className="font-semibold text-gray-700">{farm.name}</span>
              </div>

              {/* Right side */}
              <div className="flex items-center gap-3">
                {/* Live badge */}
                <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: LIME_DARK }}>
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: LIME }} />
                  En vivo
                </div>

                {/* Alerts badge */}
                {activeAlerts.length > 0 && (
                  <Link
                    href="/alerts"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                    style={{ background: "#fff1f1", color: "#dc2626", border: "1px solid #fecaca" }}
                  >
                    <Bell className="w-3 h-3" />
                    {activeAlerts.length} alerta{activeAlerts.length > 1 ? "s" : ""}
                  </Link>
                )}

                {/* Sync */}
                {lastSync && (
                  <span className="hidden sm:flex items-center gap-1 text-xs text-gray-400 font-medium">
                    <Clock className="w-3 h-3" />
                    {relativeTime(lastSync)}
                  </span>
                )}
                <button
                  onClick={handleRefresh}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all border border-gray-200"
                >
                  <RefreshCcw className={cn("w-3.5 h-3.5", refreshing && "animate-spin")} />
                  Sincronizar
                </button>
              </div>
            </header>

            {/* ── Hero section ── */}
            <div
              className="mx-6 mt-6 rounded-2xl overflow-hidden relative"
              style={{
                background: "linear-gradient(135deg, #0f2e10 0%, #1a4a1a 60%, #1f5a20 100%)",
                minHeight: 130,
              }}
            >
              {/* Subtle pattern */}
              <div
                className="absolute inset-0 opacity-5"
                style={{
                  backgroundImage: "radial-gradient(circle at 20% 50%, #86E66A 0%, transparent 50%), radial-gradient(circle at 80% 20%, #86E66A 0%, transparent 40%)",
                }}
              />

              <div className="relative z-10 px-8 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  {/* Status chips */}
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full"
                      style={{ background: `${LIME}25`, color: LIME, border: `1px solid ${LIME}40` }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: LIME }} />
                      Activa
                    </span>
                    {farm.crop_type && (
                      <span
                        className="text-xs font-semibold px-3 py-1 rounded-full"
                        style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.75)", border: "1px solid rgba(255,255,255,0.15)" }}
                      >
                        {farm.crop_type}
                      </span>
                    )}
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight mb-2">
                    {farm.name}
                  </h1>

                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="flex items-center gap-1.5 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                      <MapPin className="w-3.5 h-3.5" />
                      {location}
                    </span>
                    {farm.area_hectares && (
                      <span className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                        {farm.area_hectares} ha
                      </span>
                    )}
                    {kpis && (
                      <span className="flex items-center gap-1.5 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                        <Activity className="w-3.5 h-3.5" />
                        {kpis.readings_count_24h} lecturas hoy
                      </span>
                    )}
                  </div>
                </div>

                {/* Soil health score */}
                {hasSensorData && (
                  <div
                    className="shrink-0 text-center px-6 py-4 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
                  >
                    <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                      Salud del suelo
                    </p>
                    <p className="text-4xl font-black" style={{ color: LIME }}>{Math.round(kpis!.soil_health_score)}</p>
                    <p className="text-xs font-semibold mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>/100</p>
                    {/* Progress bar */}
                    <div className="mt-2 w-20 h-1.5 bg-white/10 rounded-full overflow-hidden mx-auto">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${kpis!.soil_health_score}%`, background: LIME }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Content ── */}
            <div className="px-6 pb-8 space-y-5 mt-5">

              {/* No sensor banner */}
              {!hasSensorData && (
                <div
                  className="rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-4 border border-dashed"
                  style={{ background: "#fffbeb", borderColor: "#fde68a" }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#fef3c7" }}>
                    <WifiOff className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <p className="font-bold text-amber-900 text-sm mb-0.5">Sin lecturas de sensores</p>
                    <p className="text-xs text-amber-700 font-medium">
                      El nodo ESP32 aún no ha enviado datos. Conecta el nodo a WiFi o configura el MQTT.
                    </p>
                  </div>
                  <Link
                    href="/sensors"
                    className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
                    style={{ background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" }}
                  >
                    <Activity className="w-3.5 h-3.5" />
                    Ver sensores
                  </Link>
                </div>
              )}

              {/* ── KPI cards ── */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  label="VPD"
                  value={kpis?.vpd_kpa?.toFixed(2) ?? "—"}
                  unit="kPa"
                  status={kpis ? kpiStatus(kpis.vpd_kpa, 0.4, 1.6) : "ok"}
                  icon={<Wind className="w-4.5 h-4.5" />}
                  trend="stable"
                  description="Déficit de presión de vapor"
                />
                <StatCard
                  label="Humedad suelo"
                  value={kpis?.avg_soil_moisture_pct?.toFixed(1) ?? "—"}
                  unit="%"
                  status={kpis ? kpiStatus(kpis.avg_soil_moisture_pct, 30, 80) : "ok"}
                  icon={<Droplets className="w-4.5 h-4.5" />}
                  trend="stable"
                />
                <StatCard
                  label="Temperatura aire"
                  value={kpis?.avg_air_temp_c?.toFixed(1) ?? "—"}
                  unit="°C"
                  status={kpis ? kpiStatus(kpis.avg_air_temp_c, 15, 35) : "ok"}
                  icon={<Thermometer className="w-4.5 h-4.5" />}
                  trend="stable"
                />
                <StatCard
                  label="Riesgo plagas"
                  value={kpis?.pest_risk?.risk_pct?.toString() ?? "—"}
                  unit="%"
                  status={kpis ? kpiStatus(kpis.pest_risk?.risk_pct ?? 0, 0, 40) : "ok"}
                  icon={<Waves className="w-4.5 h-4.5" />}
                  trend="stable"
                />
              </div>

              {/* ── Chart + Live feed ── */}
              <div className="grid lg:grid-cols-3 gap-5">

                <div className="lg:col-span-2">
                  <SectionCard
                    title="Humedad del Suelo"
                    subtitle="Últimas 24 horas"
                    icon={<BarChart3 className="w-4 h-4" />}
                    action={
                      hasTimeseries ? (
                        <span
                          className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                          style={{ background: `${LIME}15`, color: LIME_DARK, border: `1px solid ${LIME}30` }}
                        >
                          {timeseries.length} lecturas
                        </span>
                      ) : undefined
                    }
                  >
                    <div className="p-4 h-[260px]">
                      <SensorChart data={hasTimeseries ? timeseries : undefined} metric="Humedad Suelo" unit="%" />
                    </div>
                  </SectionCard>
                </div>

                <div>
                  <SectionCard
                    title="Live Feed"
                    subtitle="Nodo ESP32"
                    icon={<Wifi className="w-4 h-4" />}
                  >
                    <div className="p-4">
                      <LiveFeed farmId={farm.id} />
                    </div>
                  </SectionCard>
                </div>

              </div>

              {/* ── AI Analysis + Alerts ── */}
              <div className="grid lg:grid-cols-5 gap-5">

                {/* AI — 3/5 */}
                <div className="lg:col-span-3">
                  <SectionCard
                    title="Análisis con IA"
                    subtitle={lastAnalysis ? relativeTime(lastAnalysis.created_at) : "Sin análisis aún"}
                    icon={<Brain className="w-4 h-4" />}
                    action={
                      <Link
                        href="/analyze"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all hover:bg-gray-50"
                        style={{ borderColor: "#e8f0e8", color: "#374151" }}
                      >
                        <Brain className="w-3.5 h-3.5" />
                        Nuevo análisis
                      </Link>
                    }
                  >
                    <div className="p-5">
                      {lastAnalysis ? (
                        <AnalysisResult analysis={lastAnalysis} />
                      ) : (
                        <div className="flex flex-col items-center justify-center py-10 gap-4 text-center">
                          <div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center"
                            style={{ background: "#f3e8ff", border: "1px solid #e9d5ff" }}
                          >
                            <Brain className="w-7 h-7 text-purple-500" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-800 mb-1">Sin análisis todavía</p>
                            <p className="text-sm text-gray-500 font-medium max-w-xs">
                              Genera tu primer análisis agronómico con IA usando el clima de 7 días + sensores.
                            </p>
                          </div>
                          <Link
                            href="/analyze"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5"
                            style={{ background: LIME, color: "#0f1f0f", boxShadow: `0 4px 12px ${LIME}40` }}
                          >
                            <Brain className="w-4 h-4" />
                            Analizar mi finca
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      )}
                    </div>
                  </SectionCard>
                </div>

                {/* Alerts — 2/5 */}
                <div className="lg:col-span-2">
                  <SectionCard
                    title="Alertas activas"
                    subtitle={`${activeAlerts.length} pendiente${activeAlerts.length !== 1 ? "s" : ""}`}
                    icon={<AlertCircle className="w-4 h-4" />}
                    action={
                      activeAlerts.length > 0 ? (
                        <Link
                          href="/alerts"
                          className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
                        >
                          Ver todas
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      ) : undefined
                    }
                  >
                    <div className="p-4 space-y-2">
                      {activeAlerts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ background: `${LIME}15`, border: `1px solid ${LIME}30` }}
                          >
                            <AlertCircle className="w-5 h-5" style={{ color: LIME_DARK }} />
                          </div>
                          <p className="text-sm font-bold text-gray-700">Todo en orden</p>
                          <p className="text-xs text-gray-400 font-medium">Sin alertas activas</p>
                        </div>
                      ) : (
                        activeAlerts.slice(0, 4).map((a) => (
                          <div
                            key={a.id}
                            className="flex items-start gap-3 p-3 rounded-xl"
                            style={{
                              background: a.severity === "critical" ? "#fff1f1" : a.severity === "warning" ? "#fffbeb" : "#f0faf0",
                              border: `1px solid ${a.severity === "critical" ? "#fecaca" : a.severity === "warning" ? "#fde68a" : "#c8e8c8"}`,
                            }}
                          >
                            <AlertCircle
                              className="w-4 h-4 mt-0.5 shrink-0"
                              style={{ color: a.severity === "critical" ? "#dc2626" : a.severity === "warning" ? "#d97706" : "#16a34a" }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-gray-800 truncate">{a.title}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5 font-medium">
                                {new Date(a.created_at).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </SectionCard>
                </div>

              </div>

              {/* ── Extra stats row (only with sensor data) ── */}
              {hasSensorData && (
                <div className="grid sm:grid-cols-3 gap-4">
                  {[
                    { label: "Lecturas 24h",  value: kpis!.readings_count_24h.toString(), icon: <Activity className="w-4 h-4" />, unit: "" },
                    { label: "Humedad aire",  value: kpis!.avg_humidity_pct?.toFixed(0) ?? "—", icon: <Droplets className="w-4 h-4" />, unit: "%" },
                    { label: "Riesgo plagas", value: `${kpis!.pest_risk?.risk_pct ?? 0}`, icon: <Waves className="w-4 h-4" />, unit: "%" },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="rounded-2xl p-4 flex items-center gap-4"
                      style={{ background: "#ffffff", border: "1px solid #e8f0e8", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
                    >
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${LIME}15` }}>
                        <div style={{ color: LIME_DARK }}>{s.icon}</div>
                      </div>
                      <div>
                        <p className="text-xl font-black text-gray-900">{s.value}<span className="text-sm font-medium text-gray-400 ml-1">{s.unit}</span></p>
                        <p className="text-xs text-gray-500 font-semibold">{s.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </>
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
