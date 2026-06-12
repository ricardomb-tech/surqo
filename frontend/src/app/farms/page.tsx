"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Plus, Sprout, MapPin, Loader2, Trash2, X, Edit2 } from "lucide-react"
import { useAuth } from "@/components/AuthProvider"
import { Button, Card } from "@/components/ui/Primitives"
import { getAccessToken } from "@/lib/auth"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://surqo-api.onrender.com"

interface Farm {
  id: string
  name: string
  location: string
  crop_type: string
  area_ha: number
  owner_email: string
}

async function apiFetch(path: string, init?: RequestInit) {
  const token = await getAccessToken()
  return fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  })
}

export default function FarmsPage() {
  const router = useRouter()
  const { user, loading, planLimits, refreshPlanLimits } = useAuth()

  const [farms, setFarms] = useState<Farm[]>([])
  const [fetching, setFetching] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const [form, setForm] = useState({ name: "", location: "", crop_type: "", area_ha: "" })

  const loadFarms = useCallback(async () => {
    setFetching(true)
    try {
      const res = await apiFetch("/api/v1/farms/")
      if (res.ok) setFarms(await res.json())
    } finally {
      setFetching(false)
    }
  }, [])

  useEffect(() => {
    if (!loading && !user) router.replace("/login?redirectTo=/farms")
    if (!loading && user) loadFarms()
  }, [loading, user, router, loadFarms])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const res = await apiFetch("/api/v1/farms/", {
      method: "POST",
      body: JSON.stringify({
        ...form,
        area_ha: parseFloat(form.area_ha) || 0,
        latitude: null,
        longitude: null,
      }),
    })

    if (res.ok) {
      setShowForm(false)
      setForm({ name: "", location: "", crop_type: "", area_ha: "" })
      await Promise.all([loadFarms(), refreshPlanLimits()])
    } else {
      const data = await res.json().catch(() => ({}))
      if (res.status === 400) {
        setError("Solo puedes registrar 1 finca por cuenta. Edita tu finca existente para cambiar el cultivo.")
      } else {
        setError(data?.detail || "Error al crear la finca")
      }
      setSubmitting(false)
    }
    setSubmitting(false)
  }

  const handleDelete = async (farmId: string) => {
    setDeleteId(farmId)
    const res = await apiFetch(`/api/v1/farms/${farmId}`, { method: "DELETE" })
    if (res.ok) {
      await Promise.all([loadFarms(), refreshPlanLimits()])
    }
    setDeleteId(null)
  }

  const atLimit = (planLimits?.farms.used ?? 0) >= (planLimits?.farms.limit ?? 1)

  if (loading || fetching) {
    return (
      <div className="min-h-screen pt-28 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-surqo-green animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-28 pb-20">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-surqo-text mb-1">Mis Fincas</h1>
            {planLimits && (
              <p className="text-sm text-surqo-text-secondary font-medium">
                {planLimits.farms.used} de {planLimits.farms.limit} finca registrada
              </p>
            )}
          </div>
          {!atLimit && (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva finca
            </Button>
          )}
        </div>

        {/* Farm limit info */}
        {atLimit && (
          <div className="mb-6 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3">
            <Edit2 className="w-5 h-5 text-blue-500 shrink-0" />
            <div>
              <p className="text-sm font-bold text-blue-700">Finca registrada</p>
              <p className="text-xs text-blue-500 mt-0.5">Cada cuenta tiene 1 finca. Edita tu finca para cambiar el cultivo u otros datos.</p>
            </div>
          </div>
        )}

        {/* Create form modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <Card className="w-full max-w-md relative">
              <button
                onClick={() => { setShowForm(false); setError(null) }}
                className="absolute right-4 top-4 text-surqo-text-muted hover:text-surqo-text transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-black tracking-tight mb-6">Nueva Finca</h2>

              <form onSubmit={handleCreate} className="flex flex-col gap-4">
                <div>
                  <label>Nombre de la finca</label>
                  <input
                    placeholder="Ej: Finca El Paraíso"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    required
                    className="w-full"
                  />
                </div>
                <div>
                  <label>Ubicación</label>
                  <input
                    placeholder="Ej: Montería, Córdoba"
                    value={form.location}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                    required
                    className="w-full"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label>Tipo de cultivo</label>
                    <input
                      placeholder="Ej: Maíz"
                      value={form.crop_type}
                      onChange={(e) => setForm((f) => ({ ...f, crop_type: e.target.value }))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label>Área (ha)</label>
                    <input
                      type="number"
                      placeholder="0.0"
                      min="0"
                      step="0.1"
                      value={form.area_ha}
                      onChange={(e) => setForm((f) => ({ ...f, area_ha: e.target.value }))}
                      className="w-full"
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                    {error}
                  </p>
                )}

                <div className="flex gap-3 mt-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => { setShowForm(false); setError(null) }}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1" disabled={submitting}>
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Registrar
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* Farms grid */}
        {farms.length === 0 ? (
          <Card className="text-center py-16">
            <Sprout className="w-12 h-12 text-surqo-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-black text-surqo-text mb-2">Sin fincas registradas</h3>
            <p className="text-sm text-surqo-text-secondary mb-6 font-medium">Agrega tu primera finca para empezar a monitorear tus cultivos.</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Registrar primera finca
            </Button>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {farms.map((farm) => (
              <Card key={farm.id} className="group hover:border-surqo-green/20 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-surqo-green/10 border border-surqo-green/20 flex items-center justify-center">
                    <Sprout className="w-5 h-5 text-surqo-green" />
                  </div>
                  <button
                    onClick={() => handleDelete(farm.id)}
                    disabled={deleteId === farm.id}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-surqo-text-muted hover:text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    {deleteId === farm.id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>

                <h3 className="text-lg font-black text-surqo-text mb-1 tracking-tight">{farm.name}</h3>

                <div className="flex items-center gap-1.5 text-xs text-surqo-text-muted mb-3">
                  <MapPin className="w-3.5 h-3.5" />
                  {farm.location}
                </div>

                <div className="flex gap-2 flex-wrap">
                  {farm.crop_type && (
                    <span className="px-2.5 py-1 rounded-lg bg-surqo-green/10 text-surqo-green-bright text-xs font-bold border border-surqo-green/20">
                      {farm.crop_type}
                    </span>
                  )}
                  {farm.area_ha > 0 && (
                    <span className="px-2.5 py-1 rounded-lg bg-white/5 text-surqo-text-secondary text-xs font-semibold border border-white/10">
                      {farm.area_ha} ha
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
