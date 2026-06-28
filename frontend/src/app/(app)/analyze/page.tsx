"use client"

import { useState, useEffect, useCallback } from "react"
import dynamic from "next/dynamic"
import { AnalysisResult } from "@/components/AnalysisResult"
import { analysisAPI, farmAPI } from "@/lib/api"
import { Button } from "@/components/ui/Primitives"
import type { Analysis } from "@/types"
import {
  Brain, Sparkles, Mail, Sprout,
  ArrowRight, Loader2, Clock, CheckCircle2,
  AlertTriangle, XCircle, ChevronDown, Map, Thermometer,
  Droplets, Wind, CloudRain, Activity, Zap,
} from "lucide-react"
import "leaflet/dist/leaflet.css"

const PointMapSelector = dynamic(() => import("@/components/PointMapSelector"), { ssr: false })
const AnalysisChat = dynamic(() => import("@/components/AnalysisChat"), { ssr: false })

const CROPS = ["maíz", "yuca", "plátano", "café", "arroz", "algodón", "cacao", "sorgo", "aguacate", "palma de aceite", "ñame"]

function alertIcon(level: string) {
  if (level === "critical") return <XCircle className="w-4 h-4 text-red-500" />
  if (level === "warning")  return <AlertTriangle className="w-4 h-4 text-amber-500" />
  return <CheckCircle2 className="w-4 h-4 text-green-600" />
}

function stressColor(v: number | null) {
  if (v === null) return "text-gray-400"
  if (v >= 7) return "text-red-600"
  if (v >= 4) return "text-amber-600"
  return "text-green-600"
}

export default function AnalyzePage() {
  const [form, setForm] = useState({ farm_name: "", lat: "", lon: "", crop_type: "maíz", alert_email: "" })
  const [farmId,         setFarmId]         = useState<string | undefined>()
  const [result,         setResult]         = useState<Analysis | null>(null)
  const [history,        setHistory]        = useState<Analysis[]>([])
  const [loading,        setLoading]        = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [error,          setError]          = useState<string | null>(null)
  const [farmLoaded,     setFarmLoaded]     = useState(false)
  const [showMap,        setShowMap]        = useState(false)

  useEffect(() => {
    async function prefill() {
      try {
        const farms = await farmAPI.list()
        if (farms.length > 0) {
          const f = farms[0]
          setFarmId(f.id)
          setForm({ farm_name: f.name, lat: String(f.latitude), lon: String(f.longitude), crop_type: f.crop_type || "maíz", alert_email: f.owner_email || "" })
          setFarmLoaded(true)
          setLoadingHistory(true)
          const h = await analysisAPI.history(f.id)
          setHistory(h)
          setLoadingHistory(false)
        }
      } catch { /* sin finca */ }
    }
    prefill()
  }, [])

  const handleMapChange = useCallback((lat: string, lng: string) => {
    setForm((f) => ({ ...f, lat, lon: lng }))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null); setResult(null)
    try {
      const analysis = await analysisAPI.analyze({
        farm_name: form.farm_name, lat: parseFloat(form.lat), lon: parseFloat(form.lon),
        crop_type: form.crop_type, alert_email: form.alert_email || undefined, farm_id: farmId,
      })
      setResult(analysis)
      if (farmId) { const h = await analysisAPI.history(farmId); setHistory(h) }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al generar el análisis")
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Top bar */}
      <header className="h-16 flex items-center px-6 border-b sticky top-0 z-30"
        style={{ background: "#ffffff", borderColor: "#e8f0e8" }}>
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-purple-600" />
          <span className="text-xs font-bold tracking-[0.15em] uppercase text-purple-600">Motor IA</span>
          <span className="mx-2 text-gray-300">/</span>
          <span className="font-semibold text-gray-700 text-sm">Análisis Predictivo</span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 border border-purple-200 text-purple-600 text-xs font-bold uppercase tracking-widest mb-4">
            <Brain className="w-3.5 h-3.5" />Motor de Inteligencia Agronómica
          </div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 mb-2">Análisis Predictivo con IA</h1>
          <p className="text-gray-500 font-medium max-w-xl text-sm">
            Llama 3.3 70B fusiona el pronóstico climático de 7 días con los datos de tus sensores para generar recomendaciones agronómicas precisas.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* ── Columna izquierda: formulario + historial ── */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl border border-gray-100 overflow-hidden bg-white" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <p className="font-bold text-gray-900 text-sm">Parámetros del análisis</p>
                {farmLoaded && (
                  <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-md">Datos precargados</span>
                )}
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Nombre */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                    <Sprout className="w-3.5 h-3.5 text-green-600" />Nombre de la finca
                  </label>
                  <input type="text" value={form.farm_name}
                    onChange={(e) => setForm({ ...form, farm_name: e.target.value })}
                    placeholder="Finca El Porvenir" className="w-full" required />
                </div>

                {/* Cultivo */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                    <Sprout className="w-3.5 h-3.5 text-green-600" />Cultivo
                  </label>
                  <div className="relative">
                    <select value={form.crop_type} onChange={(e) => setForm({ ...form, crop_type: e.target.value })} className="w-full appearance-none pr-8">
                      {CROPS.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Coordenadas + Mapa */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-widest">
                      Ubicación GPS
                    </label>
                    <button type="button" onClick={() => setShowMap((v) => !v)}
                      className="flex items-center gap-1 text-[11px] font-bold text-purple-600 hover:text-purple-800 transition-colors">
                      <Map className="w-3 h-3" />
                      {showMap ? "Ocultar mapa" : "Usar mapa"}
                    </button>
                  </div>

                  {showMap ? (
                    <PointMapSelector lat={form.lat} lng={form.lon} onChange={handleMapChange} />
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <input type="number" step="any" value={form.lat}
                        onChange={(e) => setForm({ ...form, lat: e.target.value })}
                        placeholder="Latitud" className="w-full" required />
                      <input type="number" step="any" value={form.lon}
                        onChange={(e) => setForm({ ...form, lon: e.target.value })}
                        placeholder="Longitud" className="w-full" required />
                    </div>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                    <Mail className="w-3.5 h-3.5 text-green-600" />Email alertas críticas
                    <span className="text-gray-300 normal-case tracking-normal font-medium ml-1">(opcional)</span>
                  </label>
                  <input type="email" value={form.alert_email}
                    onChange={(e) => setForm({ ...form, alert_email: e.target.value })}
                    placeholder="tu@email.com" className="w-full" />
                </div>

                <div className="pt-2 border-t border-gray-100 space-y-3">
                  <div className="flex items-center gap-2 text-[11px] text-gray-400 font-medium bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
                    <Sparkles className="w-3.5 h-3.5 text-green-600 shrink-0" />Open-Meteo + sensores IoT + Llama 3.3 70B
                  </div>
                  <Button type="submit" disabled={loading} className="w-full gap-2 h-11">
                    {loading
                      ? <><Loader2 className="w-4 h-4 animate-spin" />Analizando…</>
                      : <><Brain className="w-4 h-4" />Generar análisis<ArrowRight className="w-4 h-4" /></>}
                  </Button>
                </div>
              </form>
            </div>

            {/* Historial */}
            {(history.length > 0 || loadingHistory) && (
              <div className="rounded-2xl border border-gray-100 overflow-hidden bg-white" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                <div className="px-6 py-4 border-b border-gray-100">
                  <p className="font-bold text-gray-900 text-sm">Historial</p>
                  <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">Últimos análisis</p>
                </div>
                <div className="divide-y divide-gray-50">
                  {loadingHistory ? (
                    <div className="px-6 py-4 flex items-center gap-2 text-sm text-gray-400">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />Cargando historial…
                    </div>
                  ) : (
                    history.slice(0, 5).map((h) => (
                      <button key={h.id} onClick={() => setResult(h)}
                        className="w-full px-6 py-3.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left">
                        {alertIcon(h.alert_level)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{h.crop_type}</p>
                          <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {new Date(h.created_at).toLocaleDateString("es-CO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md border shrink-0"
                          style={{
                            background: h.alert_level === "critical" ? "#fff1f1" : h.alert_level === "warning" ? "#fffbeb" : "#f0faf0",
                            color: h.alert_level === "critical" ? "#dc2626" : h.alert_level === "warning" ? "#d97706" : "#16a34a",
                            borderColor: h.alert_level === "critical" ? "#fecaca" : h.alert_level === "warning" ? "#fde68a" : "#c8e8c8",
                          }}>
                          {h.alert_level}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Columna derecha: datos + resultado + chat ── */}
          <div className="lg:col-span-3 space-y-4">
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5 flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-red-600 text-sm">Error en el análisis</p>
                  <p className="text-sm text-red-500 mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {loading && (
              <div className="rounded-2xl border border-purple-100 bg-white p-12 flex flex-col items-center justify-center gap-6 text-center min-h-[400px]"
                style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center">
                    <Brain className="w-8 h-8 text-purple-500 animate-pulse" />
                  </div>
                  <Sparkles className="absolute -top-2 -right-2 w-5 h-5 text-green-500 animate-bounce" />
                </div>
                <div>
                  <p className="font-black text-gray-900 text-lg mb-2">Analizando tu finca…</p>
                  <p className="text-sm text-gray-500 font-medium max-w-xs">Obteniendo pronóstico climático de 7 días, calculando ETc y consultando a la IA</p>
                </div>
                <div className="flex gap-1.5">
                  {[0, 150, 300].map((d) => (
                    <div key={d} className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            )}

            {result && !loading && (
              <>
                {/* ─ Tarjetas de datos climáticos y sensor ─ */}
                <div className="rounded-2xl border border-gray-100 overflow-hidden bg-white" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                  <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/60">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-blue-500" />Datos del análisis
                    </p>
                  </div>
                  <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {/* Temperatura */}
                    <div className="rounded-xl border border-orange-100 bg-orange-50 p-3 text-center">
                      <Thermometer className="w-4 h-4 text-orange-500 mx-auto mb-1" />
                      <p className="text-lg font-black text-orange-700">
                        {result.avg_temperature_c?.toFixed(1) ?? "—"}
                        <span className="text-xs font-bold text-orange-400 ml-0.5">°C</span>
                      </p>
                      <p className="text-[10px] font-bold text-orange-400 uppercase tracking-wide">Temp. prom.</p>
                    </div>
                    {/* Lluvia */}
                    <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-center">
                      <CloudRain className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                      <p className="text-lg font-black text-blue-700">
                        {result.total_rain_7d_mm?.toFixed(0) ?? "—"}
                        <span className="text-xs font-bold text-blue-400 ml-0.5">mm</span>
                      </p>
                      <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wide">Lluvia 7d</p>
                    </div>
                    {/* VPD */}
                    <div className="rounded-xl border border-purple-100 bg-purple-50 p-3 text-center">
                      <Wind className="w-4 h-4 text-purple-500 mx-auto mb-1" />
                      <p className="text-lg font-black text-purple-700">
                        {result.avg_vpd_kpa?.toFixed(2) ?? "—"}
                        <span className="text-xs font-bold text-purple-400 ml-0.5">kPa</span>
                      </p>
                      <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wide">VPD prom.</p>
                    </div>
                    {/* Estrés hídrico */}
                    <div className={`rounded-xl border p-3 text-center ${
                      (result.water_stress_index ?? 0) >= 7 ? "border-red-100 bg-red-50" :
                      (result.water_stress_index ?? 0) >= 4 ? "border-amber-100 bg-amber-50" :
                      "border-green-100 bg-green-50"
                    }`}>
                      <Droplets className={`w-4 h-4 mx-auto mb-1 ${stressColor(result.water_stress_index)}`} />
                      <p className={`text-lg font-black ${stressColor(result.water_stress_index)}`}>
                        {result.water_stress_index?.toFixed(1) ?? "—"}
                        <span className="text-xs font-bold ml-0.5 opacity-60">/10</span>
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-wide opacity-60">Estrés hídrico</p>
                    </div>
                  </div>
                  {/* ET0 si existe */}
                  {result.et0_7d_mm !== null && (
                    <div className="px-5 pb-4">
                      <div className="rounded-lg bg-gray-50 border border-gray-100 px-4 py-2 flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Evapotranspiración 7d (ET₀)</span>
                        <span className="text-sm font-black text-gray-700">{result.et0_7d_mm?.toFixed(1)} mm</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* ─ Resultado de la IA ─ */}
                <div className="rounded-2xl border border-gray-100 overflow-hidden bg-white" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-500">
                        <Brain className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{result.farm_name}</p>
                        <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">
                          {new Date(result.created_at).toLocaleDateString("es-CO", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          {result.model_used && ` · ${result.model_used.split("/").pop()}`}
                        </p>
                      {(result.input_tokens || result.output_tokens) && (
                        <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                          <Zap className="w-2.5 h-2.5 text-purple-400" />
                          {((result.input_tokens ?? 0) + (result.output_tokens ?? 0)).toLocaleString()} tokens
                          <span className="text-gray-300">·</span>
                          <span className="text-gray-300">{result.input_tokens?.toLocaleString()} entrada</span>
                          <span className="text-gray-300">·</span>
                          <span className="text-gray-300">{result.output_tokens?.toLocaleString()} salida</span>
                        </p>
                      )}
                      </div>
                    </div>
                  </div>
                  <div className="p-6"><AnalysisResult analysis={result} /></div>
                </div>

                {/* ─ Chat contextual ─ */}
                <AnalysisChat analysis={result} />
              </>
            )}

            {!result && !loading && !error && (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white min-h-[400px] flex flex-col items-center justify-center gap-5 p-12 text-center"
                style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                <div className="w-16 h-16 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center">
                  <Brain className="w-8 h-8 text-purple-300" />
                </div>
                <div>
                  <p className="font-bold text-gray-800 mb-1">El análisis aparecerá aquí</p>
                  <p className="text-sm text-gray-400 font-medium max-w-xs">Completa el formulario y presiona "Generar análisis" para ver las recomendaciones de la IA y poder hacerle preguntas</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
