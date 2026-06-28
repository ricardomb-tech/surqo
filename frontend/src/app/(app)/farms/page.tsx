"use client"

import { useEffect, useState, useCallback } from "react"
import dynamic from "next/dynamic"
import { farmAPI } from "@/lib/api"
import { useAuth } from "@/components/AuthProvider"
import type { Farm } from "@/types"
import { Plus, Sprout, MapPin, Loader2, Trash2, X, Edit2, AlertCircle, CheckCircle2, Mountain } from "lucide-react"
import { Button } from "@/components/ui/Primitives"
import ColombiaLocationSelector from "@/components/ColombiaLocationSelector"
import "leaflet/dist/leaflet.css"

const FarmMapSelector = dynamic(() => import("@/components/FarmMapSelector"), { ssr: false })

const CROP_OPTIONS = [
  "Maíz","Yuca","Ñame","Arroz","Algodón","Sorgo","Plátano",
  "Aguacate","Cacao","Café","Caña de azúcar","Palma de aceite","Otro",
]

interface MapData {
  latitude: number
  longitude: number
  area_hectares: number | null
  altitude_masl: number | null
  boundary_points: { lat: number; lng: number }[]
}

interface FormState {
  name: string
  department: string
  municipality: string
  crop_type: string
}

const EMPTY: FormState = { name: "", department: "", municipality: "", crop_type: "" }

export default function FarmsPage() {
  const { planLimits, refreshPlanLimits } = useAuth()
  const [farms,      setFarms]      = useState<Farm[]>([])
  const [loading,    setLoading]    = useState(true)
  const [showForm,   setShowForm]   = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [deleteId,   setDeleteId]   = useState<string | null>(null)
  const [form,       setForm]       = useState<FormState>(EMPTY)
  const [mapData,    setMapData]    = useState<MapData | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try { setFarms(await farmAPI.list()) } catch { setFarms([]) } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleMapData = useCallback((data: MapData) => setMapData(data), [])

  const set = (k: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    if (!mapData || mapData.boundary_points.length < 3) {
      setError("Marca al menos 3 puntos en el mapa para definir los límites de la finca.")
      setSubmitting(false)
      return
    }
    if (!form.department) {
      setError("Selecciona el departamento.")
      setSubmitting(false)
      return
    }

    try {
      await farmAPI.create({
        name: form.name,
        crop_type: form.crop_type,
        latitude: mapData.latitude,
        longitude: mapData.longitude,
        area_hectares: mapData.area_hectares ?? undefined,
        altitude_masl: mapData.altitude_masl ?? undefined,
        department: form.department,
        municipality: form.municipality || undefined,
      })
      setShowForm(false)
      setForm(EMPTY)
      setMapData(null)
      await Promise.all([load(), refreshPlanLimits()])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al crear la finca"
      setError(msg.includes("400") || msg.toLowerCase().includes("limit")
        ? "Solo puedes registrar 1 finca por cuenta."
        : msg)
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeleteId(id)
    try {
      const token = await import("@/lib/auth").then((m) => m.getAccessToken())
      const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://surqo-api.fly.dev").replace(/^﻿/, "").trim()
      await fetch(`${API_BASE}/api/v1/farms/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      await Promise.all([load(), refreshPlanLimits()])
    } finally { setDeleteId(null) }
  }

  const closeForm = () => { setShowForm(false); setError(null); setForm(EMPTY); setMapData(null) }

  const atLimit = (planLimits?.farms.used ?? 0) >= (planLimits?.farms.limit ?? 1)

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-7 h-7 text-green-700 animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen pb-16">
      {/* Top bar */}
      <header className="h-16 flex items-center justify-between px-6 border-b sticky top-0 z-30"
        style={{ background: "#ffffff", borderColor: "#e8f0e8" }}>
        <div className="flex items-center gap-2">
          <Sprout className="w-4 h-4 text-green-700" />
          <span className="text-xs font-bold tracking-[0.15em] uppercase text-green-700">Gestión</span>
          <span className="mx-2 text-gray-300">/</span>
          <span className="font-semibold text-gray-700 text-sm">Mis Fincas</span>
          {planLimits && <span className="ml-2 text-xs text-gray-400 font-medium">({planLimits.farms.used}/{planLimits.farms.limit})</span>}
        </div>
        {!atLimit && (
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="w-4 h-4" />Nueva finca
          </Button>
        )}
      </header>

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
        <h1 className="text-2xl font-black tracking-tight text-gray-900">Mis Fincas</h1>

        {atLimit && (
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 flex items-center gap-3">
            <Edit2 className="w-5 h-5 text-blue-500 shrink-0" />
            <div>
              <p className="text-sm font-bold text-blue-900">Límite de fincas alcanzado</p>
              <p className="text-xs text-blue-600 font-medium mt-0.5">El plan actual incluye 1 finca. Elimina la actual para registrar una nueva.</p>
            </div>
          </div>
        )}

        {/* Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
            <div className="w-full max-w-2xl rounded-3xl border border-gray-100 shadow-2xl overflow-hidden bg-white my-8">
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center text-green-700">
                    <Sprout className="w-4 h-4" />
                  </div>
                  <h2 className="text-lg font-black tracking-tight text-gray-900">Registrar finca</h2>
                </div>
                <button onClick={closeForm}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="p-6 space-y-5">
                {/* Name */}
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Nombre de la finca *</label>
                  <input placeholder="Ej: Finca El Paraíso" value={form.name} onChange={set("name")} required className="w-full" />
                </div>

                {/* Crop */}
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Cultivo principal</label>
                  <select value={form.crop_type} onChange={set("crop_type")} className="w-full">
                    <option value="">Seleccionar…</option>
                    {CROP_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Department / Municipality */}
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Ubicación</p>
                  <ColombiaLocationSelector
                    department={form.department}
                    municipality={form.municipality}
                    onDepartmentChange={(v) => setForm((f) => ({ ...f, department: v }))}
                    onMunicipalityChange={(v) => setForm((f) => ({ ...f, municipality: v }))}
                    required
                  />
                </div>

                {/* Map */}
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Límites de la finca en el mapa *</p>
                  <FarmMapSelector onData={handleMapData} />
                </div>

                {/* Captured summary */}
                {mapData && mapData.boundary_points.length >= 3 && (
                  <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-3 grid grid-cols-2 gap-x-6 gap-y-1 text-xs font-medium text-green-800">
                    <span>Lat: <strong>{mapData.latitude}</strong></span>
                    <span>Lng: <strong>{mapData.longitude}</strong></span>
                    {mapData.area_hectares !== null && <span>Área: <strong>{mapData.area_hectares} ha</strong></span>}
                    {mapData.altitude_masl !== null && <span>Altitud: <strong>{mapData.altitude_masl} msnm</strong></span>}
                  </div>
                )}

                {error && (
                  <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-600 font-medium">{error}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={closeForm}>Cancelar</Button>
                  <Button type="submit" className="flex-1 gap-2" disabled={submitting}>
                    {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    Registrar
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Farm cards */}
        {farms.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-20 flex flex-col items-center gap-5 text-center">
            <div className="w-16 h-16 rounded-2xl bg-green-50 border border-green-200 flex items-center justify-center">
              <Sprout className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-lg">Sin fincas registradas</p>
              <p className="text-sm text-gray-400 font-medium mt-1">Registra tu primera finca para activar el monitoreo IoT y los análisis con IA.</p>
            </div>
            <Button onClick={() => setShowForm(true)} className="gap-2"><Plus className="w-4 h-4" />Registrar primera finca</Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {farms.map((farm) => (
              <div key={farm.id}
                className="rounded-2xl border border-gray-100 bg-white hover:border-green-200 transition-all duration-200 group overflow-hidden"
                style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                <div className="px-5 pt-5 pb-4 border-b border-gray-100 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center shrink-0">
                      <Sprout className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-gray-900 tracking-tight truncate">{farm.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                        <p className="text-xs text-gray-400 font-medium truncate">
                          {farm.municipality ? `${farm.municipality}, ` : ""}{farm.department}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(farm.id)} disabled={deleteId === farm.id}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all shrink-0">
                    {deleteId === farm.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
                <div className="px-5 py-4 flex flex-wrap gap-2">
                  {farm.crop_type && (
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg bg-green-50 text-green-700 border border-green-200">{farm.crop_type}</span>
                  )}
                  {farm.area_hectares != null && farm.area_hectares > 0 && (
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg bg-gray-50 text-gray-500 border border-gray-100">{farm.area_hectares} ha</span>
                  )}
                  {farm.altitude_masl != null && (
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg bg-gray-50 text-gray-400 border border-gray-100 flex items-center gap-1">
                      <Mountain className="w-3 h-3" />{farm.altitude_masl} msnm
                    </span>
                  )}
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg border ${farm.is_active ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-400 border-gray-100"}`}>
                    {farm.is_active ? "Activa" : "Inactiva"}
                  </span>
                </div>
                <div className="px-5 pb-4">
                  <p className="text-[11px] text-gray-400 font-mono">{farm.latitude.toFixed(4)}, {farm.longitude.toFixed(4)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
