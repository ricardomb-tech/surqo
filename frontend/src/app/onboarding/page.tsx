"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sprout, MapPin, Loader2, Zap, CheckCircle2 } from "lucide-react"
import { Button, Card } from "@/components/ui/Primitives"
import { useAuth } from "@/components/AuthProvider"
import { getAccessToken } from "@/lib/auth"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://surqo-api.fly.dev"

const CROPS = [
  "maíz", "yuca", "plátano", "café", "arroz",
  "algodón", "sorgo", "soya", "cacao", "caña de azúcar",
]

const DEPARTMENTS = [
  "Córdoba", "Antioquia", "Cundinamarca", "Valle del Cauca",
  "Bolívar", "Atlántico", "Magdalena", "Cesar", "Sucre",
  "Cauca", "Nariño", "Meta", "Huila", "Tolima", "Boyacá",
]

export default function OnboardingPage() {
  const router = useRouter()
  const { user, loading, refreshPlanLimits } = useAuth()

  const [form, setForm] = useState({
    name: "",
    crop_type: "maíz",
    latitude: "",
    longitude: "",
    area_hectares: "",
    department: "Córdoba",
    municipality: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) router.replace("/login")
  }, [loading, user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const lat = parseFloat(form.latitude)
    const lon = parseFloat(form.longitude)

    if (isNaN(lat) || lat < -90 || lat > 90) {
      setError("La latitud debe ser un número entre -90 y 90")
      setSubmitting(false)
      return
    }
    if (isNaN(lon) || lon < -180 || lon > 180) {
      setError("La longitud debe ser un número entre -180 y 180")
      setSubmitting(false)
      return
    }

    try {
      const token = await getAccessToken()
      const res = await fetch(`${API_BASE}/api/v1/farms/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name,
          crop_type: form.crop_type,
          latitude: lat,
          longitude: lon,
          area_hectares: form.area_hectares ? parseFloat(form.area_hectares) : null,
          department: form.department,
          municipality: form.municipality || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data?.detail?.message || data?.detail || "Error al registrar la finca")
        setSubmitting(false)
        return
      }

      await refreshPlanLimits()
      router.replace("/dashboard")
    } catch {
      setError("Error de conexión. Intenta de nuevo.")
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-surqo-green animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-slate-50 flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <Zap className="w-6 h-6 text-surqo-green" />
            <span className="text-xl font-black tracking-tighter text-gradient">SURQO</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-2">
            Registra tu finca
          </h1>
          <p className="text-slate-500 font-medium">
            Configura tu unidad productiva para empezar el monitoreo inteligente
          </p>
        </div>

        <Card className="shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Farm name */}
            <div>
              <label htmlFor="name" className="flex items-center gap-2">
                <Sprout className="w-4 h-4 text-surqo-green" />
                Nombre de la finca
              </label>
              <input
                id="name"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ej: Finca El Porvenir"
                className="w-full"
                required
              />
            </div>

            {/* Crop type */}
            <div>
              <label htmlFor="crop_type" className="flex items-center gap-2">
                <Sprout className="w-4 h-4 text-surqo-green" />
                Tipo de cultivo principal
              </label>
              <select
                id="crop_type"
                value={form.crop_type}
                onChange={(e) => setForm({ ...form, crop_type: e.target.value })}
                className="w-full"
              >
                {CROPS.map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Coordinates */}
            <div>
              <label className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-surqo-green" />
                Coordenadas GPS
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input
                    type="number"
                    step="any"
                    value={form.latitude}
                    onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                    placeholder="Latitud (Ej: 8.7575)"
                    className="w-full"
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1 font-medium">Norte: positivo · Sur: negativo</p>
                </div>
                <div>
                  <input
                    type="number"
                    step="any"
                    value={form.longitude}
                    onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                    placeholder="Longitud (Ej: -75.8891)"
                    className="w-full"
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1 font-medium">Este: positivo · Oeste: negativo</p>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-2 font-medium">
                Puedes obtener las coordenadas desde Google Maps → clic derecho sobre tu finca.
              </p>
            </div>

            {/* Area */}
            <div>
              <label htmlFor="area">Área de la finca (hectáreas) — opcional</label>
              <input
                id="area"
                type="number"
                step="0.1"
                min="0"
                value={form.area_hectares}
                onChange={(e) => setForm({ ...form, area_hectares: e.target.value })}
                placeholder="Ej: 5.5"
                className="w-full"
              />
            </div>

            {/* Location */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="department">Departamento</label>
                <select
                  id="department"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className="w-full"
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="municipality">Municipio — opcional</label>
                <input
                  id="municipality"
                  type="text"
                  value={form.municipality}
                  onChange={(e) => setForm({ ...form, municipality: e.target.value })}
                  placeholder="Ej: Montería"
                  className="w-full"
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full h-12 text-base" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Registrar finca y entrar al dashboard
                </>
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
