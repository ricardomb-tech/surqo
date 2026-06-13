"use client"

import { useEffect, useState, useCallback } from "react"
import { RequireAuth } from "@/components/RequireAuth"
import { farmAPI } from "@/lib/api"
import { useAuth } from "@/components/AuthProvider"
import type { Farm } from "@/types"
import {
  Plus, Sprout, MapPin, Loader2, Trash2, X,
  Edit2, AlertCircle, CheckCircle2, Mountain,
} from "lucide-react"
import { Button, Card } from "@/components/ui/Primitives"

const CROP_OPTIONS = [
  "Maíz", "Yuca", "Ñame", "Arroz", "Algodón",
  "Sorgo", "Plátano", "Aguacate", "Cacao", "Café",
  "Caña de azúcar", "Palma de aceite", "Otro",
]

const DEPARTMENTS = [
  "Córdoba", "Antioquia", "Cundinamarca", "Bolívar", "Sucre",
  "Cesar", "Magdalena", "Atlántico", "Tolima", "Huila",
  "Valle del Cauca", "Cauca", "Nariño", "Meta", "Casanare",
  "Santander", "Norte de Santander", "Boyacá", "Caldas", "Otro",
]

interface FormState {
  name: string
  department: string
  municipality: string
  crop_type: string
  area_hectares: string
  latitude: string
  longitude: string
  altitude_masl: string
}

const EMPTY_FORM: FormState = {
  name: "", department: "", municipality: "", crop_type: "",
  area_hectares: "", latitude: "", longitude: "", altitude_masl: "",
}

function FarmsContent() {
  const { planLimits, refreshPlanLimits } = useAuth()
  const [farms, setFarms] = useState<Farm[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)

  const load = useCallback(async () => {
    setLoading(true)
    try { setFarms(await farmAPI.list()) }
    catch { setFarms([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const lat = parseFloat(form.latitude)
    const lon = parseFloat(form.longitude)
    if (isNaN(lat) || isNaN(lon)) {
      setError("Ingresa coordenadas válidas.")
      setSubmitting(false)
      return
    }

    try {
      await farmAPI.create({
        name: form.name,
        crop_type: form.crop_type,
        latitude: lat,
        longitude: lon,
        area_hectares: form.area_hectares ? parseFloat(form.area_hectares) : null,
        department: form.department,
        municipality: form.municipality || null,
        altitude_masl: form.altitude_masl ? parseFloat(form.altitude_masl) : null,
      })
      setShowForm(false)
      setForm(EMPTY_FORM)
      await Promise.all([load(), refreshPlanLimits()])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al crear la finca"
      if (msg.includes("400") || msg.toLowerCase().includes("limit")) {
        setError("Solo puedes registrar 1 finca por cuenta.")
      } else {
        setError(msg)
      }
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeleteId(id)
    try {
      const token = await import("@/lib/auth").then((m) => m.getAccessToken())
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://surqo-api.fly.dev"
      await fetch(`${API_BASE}/api/v1/farms/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      await Promise.all([load(), refreshPlanLimits()])
    } finally {
      setDeleteId(null)
    }
  }

  const atLimit = (planLimits?.farms.used ?? 0) >= (planLimits?.farms.limit ?? 1)

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-7 h-7 text-surqo-green animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen pt-20 pb-16 bg-surqo-bg">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* ── HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sprout className="w-4 h-4 text-surqo-green" />
              <span className="text-xs font-bold tracking-[0.15em] uppercase text-surqo-green-bright">
                Gestión de Fincas
              </span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-surqo-text">Mis Fincas</h1>
            {planLimits && (
              <p className="text-sm text-surqo-text-secondary font-medium mt-0.5">
                {planLimits.farms.used} de {planLimits.farms.limit} finca registrada
              </p>
            )}
          </div>
          {!atLimit && (
            <Button onClick={() => setShowForm(true)} className="gap-2 shrink-0">
              <Plus className="w-4 h-4" />
              Nueva finca
            </Button>
          )}
        </div>

        {/* ── LIMIT BANNER ── */}
        {atLimit && (
          <div className="glass rounded-2xl border border-surqo-sky/20 p-4 flex items-center gap-3">
            <Edit2 className="w-5 h-5 text-surqo-sky shrink-0" />
            <div>
              <p className="text-sm font-bold text-surqo-text">Límite de fincas alcanzado</p>
              <p className="text-xs text-surqo-text-muted font-medium mt-0.5">
                El plan actual incluye 1 finca. Elimina la actual para registrar una nueva.
              </p>
            </div>
          </div>
        )}

        {/* ── MODAL FORM ── */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="glass w-full max-w-lg rounded-3xl border border-white/[0.10] shadow-2xl overflow-hidden">
              <div className="px-6 py-5 border-b border-white/[0.07] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-surqo-green/10 border border-surqo-green/20 flex items-center justify-center text-surqo-green">
                    <Sprout className="w-4 h-4" />
                  </div>
                  <h2 className="text-lg font-black tracking-tight text-surqo-text">Registrar finca</h2>
                </div>
                <button onClick={() => { setShowForm(false); setError(null); setForm(EMPTY_FORM) }}
                  className="p-1.5 rounded-lg text-surqo-text-muted hover:text-surqo-text hover:bg-white/[0.06] transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="p-6 space-y-4">
                {/* Name */}
                <div>
                  <label className="text-xs font-bold text-surqo-text-muted uppercase tracking-widest mb-1.5 block">
                    Nombre de la finca *
                  </label>
                  <input placeholder="Ej: Finca El Paraíso" value={form.name}
                    onChange={set("name")} required className="w-full" />
                </div>

                {/* Department + Municipality */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-surqo-text-muted uppercase tracking-widest mb-1.5 block">
                      Departamento *
                    </label>
                    <select value={form.department} onChange={set("department")} required className="w-full">
                      <option value="">Seleccionar…</option>
                      {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-surqo-text-muted uppercase tracking-widest mb-1.5 block">
                      Municipio
                    </label>
                    <input placeholder="Ej: Montería" value={form.municipality} onChange={set("municipality")} className="w-full" />
                  </div>
                </div>

                {/* Crop + Area */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-surqo-text-muted uppercase tracking-widest mb-1.5 block">
                      Cultivo principal
                    </label>
                    <select value={form.crop_type} onChange={set("crop_type")} className="w-full">
                      <option value="">Seleccionar…</option>
                      {CROP_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-surqo-text-muted uppercase tracking-widest mb-1.5 block">
                      Área (ha)
                    </label>
                    <input type="number" placeholder="0.0" min="0" step="0.1"
                      value={form.area_hectares} onChange={set("area_hectares")} className="w-full" />
                  </div>
                </div>

                {/* Lat + Lon */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-surqo-text-muted uppercase tracking-widest mb-1.5 block">
                      Latitud *
                    </label>
                    <input type="number" step="any" placeholder="Ej: 8.7575"
                      value={form.latitude} onChange={set("latitude")} required className="w-full" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-surqo-text-muted uppercase tracking-widest mb-1.5 block">
                      Longitud *
                    </label>
                    <input type="number" step="any" placeholder="Ej: -75.889"
                      value={form.longitude} onChange={set("longitude")} required className="w-full" />
                  </div>
                </div>

                {/* Altitude (optional) */}
                <div>
                  <label className="text-xs font-bold text-surqo-text-muted uppercase tracking-widest mb-1.5 block">
                    Altitud (msnm) — opcional
                  </label>
                  <input type="number" placeholder="Ej: 120" min="0" step="1"
                    value={form.altitude_masl} onChange={set("altitude_masl")} className="w-full" />
                </div>

                {error && (
                  <div className="flex items-start gap-2.5 bg-surqo-danger/10 border border-surqo-danger/20 rounded-xl px-3 py-2.5">
                    <AlertCircle className="w-4 h-4 text-surqo-danger shrink-0 mt-0.5" />
                    <p className="text-sm text-surqo-danger font-medium">{error}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" className="flex-1"
                    onClick={() => { setShowForm(false); setError(null); setForm(EMPTY_FORM) }}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1 gap-2" disabled={submitting}>
                    {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    Registrar
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── FARMS GRID ── */}
        {farms.length === 0 ? (
          <div className="glass rounded-2xl border border-dashed border-white/[0.10] py-20 flex flex-col items-center gap-5 text-center">
            <div className="w-16 h-16 rounded-2xl bg-surqo-green/10 border border-surqo-green/20 flex items-center justify-center">
              <Sprout className="w-8 h-8 text-surqo-green" />
            </div>
            <div>
              <p className="font-bold text-surqo-text text-lg">Sin fincas registradas</p>
              <p className="text-sm text-surqo-text-secondary font-medium mt-1">
                Registra tu primera finca para activar el monitoreo IoT y los análisis con IA.
              </p>
            </div>
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Registrar primera finca
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {farms.map((farm) => (
              <div key={farm.id}
                className="glass rounded-2xl border border-white/[0.07] hover:border-surqo-green/20 transition-all duration-200 group overflow-hidden">

                {/* Card header */}
                <div className="px-5 pt-5 pb-4 border-b border-white/[0.06] flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-surqo-green/10 border border-surqo-green/20 flex items-center justify-center shrink-0">
                      <Sprout className="w-5 h-5 text-surqo-green" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-surqo-text tracking-tight truncate">{farm.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-surqo-text-muted shrink-0" />
                        <p className="text-xs text-surqo-text-muted font-medium truncate">
                          {farm.municipality ? `${farm.municipality}, ` : ""}{farm.department}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(farm.id)}
                    disabled={deleteId === farm.id}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-surqo-text-muted hover:text-surqo-danger hover:bg-surqo-danger/10 transition-all shrink-0"
                  >
                    {deleteId === farm.id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>

                {/* Card body */}
                <div className="px-5 py-4 flex flex-wrap gap-2">
                  {farm.crop_type && (
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg bg-surqo-green/10 text-surqo-green-bright border border-surqo-green/20">
                      {farm.crop_type}
                    </span>
                  )}
                  {farm.area_hectares != null && farm.area_hectares > 0 && (
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg bg-white/[0.04] text-surqo-text-secondary border border-white/[0.08]">
                      {farm.area_hectares} ha
                    </span>
                  )}
                  {farm.altitude_masl != null && (
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg bg-white/[0.04] text-surqo-text-muted border border-white/[0.06] flex items-center gap-1">
                      <Mountain className="w-3 h-3" />
                      {farm.altitude_masl} msnm
                    </span>
                  )}
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg border ${
                    farm.is_active
                      ? "bg-surqo-green/10 text-surqo-green border-surqo-green/20"
                      : "bg-white/[0.04] text-surqo-text-muted border-white/[0.06]"
                  }`}>
                    {farm.is_active ? "Activa" : "Inactiva"}
                  </span>
                </div>

                {/* Coords footer */}
                <div className="px-5 pb-4">
                  <p className="text-[11px] text-surqo-text-muted font-mono">
                    {farm.latitude.toFixed(4)}, {farm.longitude.toFixed(4)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function FarmsPage() {
  return <RequireAuth><FarmsContent /></RequireAuth>
}
