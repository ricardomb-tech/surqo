"use client"

import { useState, useEffect } from "react"
import { AnalysisResult } from "@/components/AnalysisResult"
import { analysisAPI, farmAPI } from "@/lib/api"
import { RequireAuth } from "@/components/RequireAuth"
import { Button } from "@/components/ui/Primitives"
import type { Analysis } from "@/types"
import {
  Brain, Sparkles, MapPin, Mail, Sprout,
  ArrowRight, Loader2, Clock, CheckCircle2,
  AlertTriangle, XCircle, ChevronDown,
} from "lucide-react"

const CROPS = ["maíz", "yuca", "plátano", "café", "arroz", "algodón", "cacao", "sorgo"]

function alertIcon(level: string) {
  if (level === "critical") return <XCircle className="w-4 h-4 text-surqo-danger" />
  if (level === "warning") return <AlertTriangle className="w-4 h-4 text-surqo-warning" />
  return <CheckCircle2 className="w-4 h-4 text-surqo-green" />
}

function AnalyzePage() {
  const [form, setForm] = useState({
    farm_name: "",
    lat: "",
    lon: "",
    crop_type: "maíz",
    alert_email: "",
  })
  const [farmId, setFarmId] = useState<string | undefined>()
  const [result, setResult] = useState<Analysis | null>(null)
  const [history, setHistory] = useState<Analysis[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [farmLoaded, setFarmLoaded] = useState(false)

  // Precarga datos de la finca registrada
  useEffect(() => {
    async function prefill() {
      try {
        const farms = await farmAPI.list()
        if (farms.length > 0) {
          const f = farms[0]
          setFarmId(f.id)
          setForm({
            farm_name: f.name,
            lat: String(f.latitude),
            lon: String(f.longitude),
            crop_type: f.crop_type || "maíz",
            alert_email: f.owner_email || "",
          })
          setFarmLoaded(true)
          // Cargar historial
          setLoadingHistory(true)
          const h = await analysisAPI.history(f.id)
          setHistory(h)
          setLoadingHistory(false)
        }
      } catch {
        // sin finca registrada
      }
    }
    prefill()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const analysis = await analysisAPI.analyze({
        farm_name: form.farm_name,
        lat: parseFloat(form.lat),
        lon: parseFloat(form.lon),
        crop_type: form.crop_type,
        alert_email: form.alert_email || undefined,
        farm_id: farmId,
      })
      setResult(analysis)
      // Actualizar historial
      if (farmId) {
        const h = await analysisAPI.history(farmId)
        setHistory(h)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al generar el análisis")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen pt-20 pb-20 bg-surqo-bg">
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* ── HEADER ── */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-widest mb-4">
            <Brain className="w-3.5 h-3.5" />
            Motor de Inteligencia Agronómica
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-surqo-text mb-2">
            Análisis Predictivo con IA
          </h1>
          <p className="text-surqo-text-secondary font-medium max-w-xl">
            Llama 3.3 70B fusiona el pronóstico climático de 7 días con los datos de tus sensores
            para generar recomendaciones agronómicas precisas.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">

          {/* ── FORM — 2/5 ── */}
          <div className="lg:col-span-2 space-y-4">
            <div className="glass rounded-2xl border border-white/[0.07] overflow-hidden">
              <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
                <p className="font-bold text-surqo-text text-sm">Parámetros del análisis</p>
                {farmLoaded && (
                  <span className="text-[10px] font-bold text-surqo-green-bright bg-surqo-green/10 border border-surqo-green/20 px-2 py-0.5 rounded-md">
                    Datos precargados
                  </span>
                )}
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Nombre */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-surqo-text-secondary uppercase tracking-widest mb-2">
                    <Sprout className="w-3.5 h-3.5 text-surqo-green" />
                    Nombre de la finca
                  </label>
                  <input
                    type="text"
                    value={form.farm_name}
                    onChange={(e) => setForm({ ...form, farm_name: e.target.value })}
                    placeholder="Finca El Porvenir"
                    className="w-full"
                    required
                  />
                </div>

                {/* Cultivo */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-surqo-text-secondary uppercase tracking-widest mb-2">
                    <Sprout className="w-3.5 h-3.5 text-surqo-green" />
                    Cultivo
                  </label>
                  <div className="relative">
                    <select
                      value={form.crop_type}
                      onChange={(e) => setForm({ ...form, crop_type: e.target.value })}
                      className="w-full appearance-none pr-8"
                    >
                      {CROPS.map((c) => (
                        <option key={c} value={c}>
                          {c.charAt(0).toUpperCase() + c.slice(1)}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surqo-text-muted pointer-events-none" />
                  </div>
                </div>

                {/* Coordenadas */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-surqo-text-secondary uppercase tracking-widest mb-2">
                    <MapPin className="w-3.5 h-3.5 text-surqo-green" />
                    Coordenadas GPS
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      step="any"
                      value={form.lat}
                      onChange={(e) => setForm({ ...form, lat: e.target.value })}
                      placeholder="Latitud"
                      className="w-full"
                      required
                    />
                    <input
                      type="number"
                      step="any"
                      value={form.lon}
                      onChange={(e) => setForm({ ...form, lon: e.target.value })}
                      placeholder="Longitud"
                      className="w-full"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-surqo-text-muted mt-1.5 font-medium">
                    Usamos estas coordenadas para el pronóstico climático de 7 días
                  </p>
                </div>

                {/* Email */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-surqo-text-secondary uppercase tracking-widest mb-2">
                    <Mail className="w-3.5 h-3.5 text-surqo-green" />
                    Email para alertas críticas
                    <span className="text-surqo-text-muted normal-case tracking-normal font-medium ml-1">(opcional)</span>
                  </label>
                  <input
                    type="email"
                    value={form.alert_email}
                    onChange={(e) => setForm({ ...form, alert_email: e.target.value })}
                    placeholder="tu@email.com"
                    className="w-full"
                  />
                </div>

                {/* Info + submit */}
                <div className="pt-2 border-t border-white/[0.06] space-y-3">
                  <div className="flex items-center gap-2 text-[11px] text-surqo-text-muted font-medium bg-white/[0.03] rounded-xl px-3 py-2.5 border border-white/[0.06]">
                    <Sparkles className="w-3.5 h-3.5 text-surqo-green shrink-0" />
                    Open-Meteo + sensores IoT + Llama 3.3 70B
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full gap-2 h-11"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Analizando…
                      </>
                    ) : (
                      <>
                        <Brain className="w-4 h-4" />
                        Generar análisis
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>

            {/* Historial de análisis */}
            {(history.length > 0 || loadingHistory) && (
              <div className="glass rounded-2xl border border-white/[0.07] overflow-hidden">
                <div className="px-6 py-4 border-b border-white/[0.06]">
                  <p className="font-bold text-surqo-text text-sm">Historial</p>
                  <p className="text-[11px] text-surqo-text-muted font-bold uppercase tracking-widest">
                    Últimos análisis
                  </p>
                </div>
                <div className="divide-y divide-white/[0.04]">
                  {loadingHistory ? (
                    <div className="px-6 py-4 flex items-center gap-2 text-sm text-surqo-text-muted">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Cargando historial…
                    </div>
                  ) : (
                    history.slice(0, 5).map((h) => (
                      <button
                        key={h.id}
                        onClick={() => setResult(h)}
                        className="w-full px-6 py-3.5 flex items-center gap-3 hover:bg-white/[0.03] transition-colors text-left"
                      >
                        {alertIcon(h.alert_level)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-surqo-text truncate">{h.crop_type}</p>
                          <p className="text-[11px] text-surqo-text-muted flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {new Date(h.created_at).toLocaleDateString("es-CO", {
                              day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md border shrink-0"
                          style={{
                            background: h.alert_level === "critical" ? "rgba(239,68,68,0.1)"
                              : h.alert_level === "warning" ? "rgba(245,158,11,0.1)"
                              : "rgba(34,197,94,0.1)",
                            color: h.alert_level === "critical" ? "#ef4444"
                              : h.alert_level === "warning" ? "#f59e0b"
                              : "#4ade80",
                            borderColor: h.alert_level === "critical" ? "rgba(239,68,68,0.2)"
                              : h.alert_level === "warning" ? "rgba(245,158,11,0.2)"
                              : "rgba(34,197,94,0.2)",
                          }}
                        >
                          {h.alert_level}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── RESULT — 3/5 ── */}
          <div className="lg:col-span-3">

            {/* Error */}
            {error && (
              <div className="glass rounded-2xl border border-surqo-danger/20 p-5 flex items-start gap-3 mb-4">
                <XCircle className="w-5 h-5 text-surqo-danger shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-surqo-danger text-sm">Error en el análisis</p>
                  <p className="text-sm text-surqo-text-secondary mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="glass rounded-2xl border border-purple-500/20 p-12 flex flex-col items-center justify-center gap-6 text-center min-h-[400px]">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                    <Brain className="w-8 h-8 text-purple-400 animate-pulse" />
                  </div>
                  <Sparkles className="absolute -top-2 -right-2 w-5 h-5 text-surqo-green animate-bounce" />
                </div>
                <div>
                  <p className="font-black text-surqo-text text-lg mb-2">Analizando tu finca…</p>
                  <p className="text-sm text-surqo-text-secondary font-medium max-w-xs">
                    Obteniendo pronóstico climático de 7 días, calculando ETc y consultando a la IA
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-surqo-green rounded-full animate-bounce [animation-delay:0ms]" />
                  <div className="w-2 h-2 bg-surqo-green rounded-full animate-bounce [animation-delay:150ms]" />
                  <div className="w-2 h-2 bg-surqo-green rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}

            {/* Result */}
            {result && !loading && (
              <div className="glass rounded-2xl border border-white/[0.07] overflow-hidden animate-fade-up">
                <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                      <Brain className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-surqo-text text-sm">{result.farm_name}</p>
                      <p className="text-[11px] text-surqo-text-muted font-bold uppercase tracking-widest">
                        {new Date(result.created_at).toLocaleDateString("es-CO", {
                          weekday: "short", day: "numeric", month: "short",
                          hour: "2-digit", minute: "2-digit",
                        })}
                        {result.model_used && ` · ${result.model_used.split("/").pop()}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.cost_usd !== null && result.cost_usd !== undefined && (
                      <span className="text-[10px] text-surqo-text-muted font-medium bg-white/[0.04] border border-white/[0.06] px-2 py-1 rounded-lg">
                        ${result.cost_usd === 0 ? "Gratis" : `$${result.cost_usd.toFixed(4)}`}
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-6">
                  <AnalysisResult analysis={result} />
                </div>
              </div>
            )}

            {/* Empty state */}
            {!result && !loading && !error && (
              <div className="glass rounded-2xl border border-dashed border-white/[0.10] min-h-[400px] flex flex-col items-center justify-center gap-5 p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <Brain className="w-8 h-8 text-purple-400 opacity-50" />
                </div>
                <div>
                  <p className="font-bold text-surqo-text mb-1">El análisis aparecerá aquí</p>
                  <p className="text-sm text-surqo-text-secondary font-medium max-w-xs">
                    Completa el formulario y presiona "Generar análisis" para ver las recomendaciones de la IA
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <RequireAuth>
      <AnalyzePage />
    </RequireAuth>
  )
}
