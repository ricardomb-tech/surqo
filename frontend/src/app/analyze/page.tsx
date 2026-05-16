"use client"

import { useState } from "react"
import Link from "next/link"
import { Button, Card } from "@/components/ui/Primitives"
import { AnalysisResult } from "@/components/AnalysisResult"
import { analysisAPI } from "@/lib/api"
import { useAuth } from "@/components/AuthProvider"
import type { Analysis } from "@/types"
import { Brain, Sparkles, MapPin, Mail, Sprout, ArrowRight, Loader2, CrownIcon, Lock } from "lucide-react"

const CROPS = ["maíz", "yuca", "plátano", "café", "arroz", "algodón"]

export default function AnalyzePage() {
  const { isPaid, loading: authLoading } = useAuth()
  const [form, setForm] = useState({
    farm_name: "Finca La Esperanza",
    lat: "8.7575",
    lon: "-75.8891",
    crop_type: "maíz",
    alert_email: "",
  })
  const [result, setResult] = useState<Analysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      })
      setResult(analysis)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-surqo-green animate-spin" />
      </div>
    )
  }

  if (!isPaid) {
    return (
      <div className="min-h-screen pt-28 pb-20 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-amber-400" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-surqo-text mb-3">Análisis IA — Plan Pro</h1>
          <p className="text-surqo-text-secondary font-medium mb-8 text-sm leading-relaxed">
            El análisis con Claude AI está disponible en el plan Pro. Obtén recomendaciones agronómicas precisas, predicciones climáticas y planes de acción para tus cultivos.
          </p>
          <div className="flex flex-col gap-3">
            <Button size="lg" className="w-full" asChild>
              <Link href="/upgrade">
                <CrownIcon className="w-5 h-5 mr-2" />
                Ver planes — Actualizar a Pro
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="w-full" asChild>
              <Link href="/dashboard">Volver al dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-28 pb-20">
      <div className="max-w-4xl mx-auto px-4">
        
        {/* Header Area */}
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surqo-green/10 border border-surqo-green/20 text-surqo-green-bright text-xs font-bold uppercase tracking-widest">
            <Sparkles className="w-3 h-3" />
            Motor de Inteligencia Agro
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-gradient leading-tight">
            Análisis Predictivo IA
          </h1>
          <p className="text-surqo-text-secondary max-w-2xl mx-auto font-medium">
            Claude AI fusiona datos meteorológicos de alta resolución con los parámetros de tus sensores para generar un plan de acción optimizado para tu cultivo.
          </p>
        </div>

        <div className="grid lg:grid-cols-1 gap-8">
          <Card className="relative overflow-hidden group">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-surqo-green/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            
            <form onSubmit={handleSubmit} className="relative z-10 space-y-8">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div>
                    <label htmlFor="farm_name" className="flex items-center gap-2">
                      <Sprout className="w-4 h-4 text-surqo-green" />
                      Nombre de la Unidad Productiva
                    </label>
                    <input
                      id="farm_name"
                      type="text"
                      value={form.farm_name}
                      onChange={(e) => setForm({ ...form, farm_name: e.target.value })}
                      placeholder="Ej: Finca El Porvenir"
                      className="w-full"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="crop_type" className="flex items-center gap-2">
                      <Sprout className="w-4 h-4 text-surqo-green" />
                      Variedad de Cultivo
                    </label>
                    <select
                      id="crop_type"
                      value={form.crop_type}
                      onChange={(e) => setForm({ ...form, crop_type: e.target.value })}
                      className="w-full"
                    >
                      {CROPS.map((c) => (
                        <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="lat" className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-surqo-green" />
                        Latitud
                      </label>
                      <input
                        id="lat"
                        type="number"
                        step="any"
                        value={form.lat}
                        onChange={(e) => setForm({ ...form, lat: e.target.value })}
                        className="w-full"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="lon" className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-surqo-green" />
                        Longitud
                      </label>
                      <input
                        id="lon"
                        type="number"
                        step="any"
                        value={form.lon}
                        onChange={(e) => setForm({ ...form, lon: e.target.value })}
                        className="w-full"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-surqo-green" />
                      Email para Notificaciones Críticas
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={form.alert_email}
                      onChange={(e) => setForm({ ...form, alert_email: e.target.value })}
                      placeholder="agricultor@surqo.ai"
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-black/5 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-3 text-xs text-surqo-text-muted font-medium bg-black/5 dark:bg-white/5 px-4 py-2.5 rounded-xl border border-black/5 dark:border-white/5">
                  <Brain className="w-4 h-4 text-surqo-green" />
                  <span>Fusión de datos: Open-Meteo + IoT + Claude 3.5</span>
                </div>
                
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full md:w-auto min-w-[240px] gap-3 h-14 text-base"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Procesando con IA...
                    </>
                  ) : (
                    <>
                      Generar Análisis Pro Max
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>

          {error && (
            <div className="bg-surqo-danger/10 border border-surqo-danger/20 rounded-2xl p-4 text-surqo-danger text-sm font-bold flex items-center gap-3 animate-fade-up">
              <span className="w-8 h-8 rounded-full bg-surqo-danger/10 flex items-center justify-center text-lg">⚠️</span>
              {error}
            </div>
          )}

          {loading && (
            <Card className="p-12 text-center space-y-6 bg-surqo-green/[0.02]">
              <div className="relative inline-block">
                <Brain className="w-16 h-16 text-surqo-green animate-pulse" />
                <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-surqo-green-bright animate-bounce" />
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight mb-2">Consultando al Oráculo Digital...</h3>
                <p className="text-surqo-text-secondary text-sm font-medium">
                  Estamos triangulando coordenadas, obteniendo modelos climáticos y evaluando riesgos.
                </p>
              </div>
              <div className="flex justify-center gap-2">
                <div className="w-2 h-2 bg-surqo-green rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-2 h-2 bg-surqo-green rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-2 h-2 bg-surqo-green rounded-full animate-bounce" />
              </div>
            </Card>
          )}

          {result && !loading && (
            <div className="animate-fade-up">
              <AnalysisResult analysis={result} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
