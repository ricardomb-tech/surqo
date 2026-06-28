"use client"

import { useState, useEffect, useCallback } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { Sprout, Loader2, Zap, CheckCircle2 } from "lucide-react"
import { Button, Card } from "@/components/ui/Primitives"
import { useAuth } from "@/components/AuthProvider"
import { getAccessToken } from "@/lib/auth"
import ColombiaLocationSelector from "@/components/ColombiaLocationSelector"
import "leaflet/dist/leaflet.css"

const FarmMapSelector = dynamic(() => import("@/components/FarmMapSelector"), { ssr: false })

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://surqo-api.fly.dev"

const CROPS = [
  "Maíz", "Yuca", "Plátano", "Café", "Arroz",
  "Algodón", "Sorgo", "Soya", "Cacao", "Caña de azúcar",
  "Aguacate", "Palma de aceite", "Ñame", "Otro",
]

interface MapData {
  latitude: number
  longitude: number
  area_hectares: number | null
  altitude_masl: number | null
  boundary_points: { lat: number; lng: number }[]
}

export default function OnboardingPage() {
  const router = useRouter()
  const { user, loading, refreshPlanLimits } = useAuth()

  const [name, setName] = useState("")
  const [cropType, setCropType] = useState("Maíz")
  const [department, setDepartment] = useState("")
  const [municipality, setMunicipality] = useState("")
  const [mapData, setMapData] = useState<MapData | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) router.replace("/login")
  }, [loading, user, router])

  const handleMapData = useCallback((data: MapData) => {
    setMapData(data)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    if (!mapData || mapData.boundary_points.length < 3) {
      setError("Marca al menos 3 puntos en el mapa para definir los límites de tu finca.")
      setSubmitting(false)
      return
    }
    if (!department) {
      setError("Selecciona el departamento donde se encuentra tu finca.")
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
          name,
          crop_type: cropType,
          latitude: mapData.latitude,
          longitude: mapData.longitude,
          area_hectares: mapData.area_hectares,
          altitude_masl: mapData.altitude_masl,
          department,
          municipality: municipality || null,
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
              <label htmlFor="name" className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                <Sprout className="w-4 h-4 text-surqo-green" />
                Nombre de la finca *
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Finca El Porvenir"
                className="w-full"
                required
              />
            </div>

            {/* Crop type */}
            <div>
              <label htmlFor="crop_type" className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                <Sprout className="w-4 h-4 text-surqo-green" />
                Tipo de cultivo principal
              </label>
              <select
                id="crop_type"
                value={cropType}
                onChange={(e) => setCropType(e.target.value)}
                className="w-full"
              >
                {CROPS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Location selectors */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Ubicación</p>
              <ColombiaLocationSelector
                department={department}
                municipality={municipality}
                onDepartmentChange={setDepartment}
                onMunicipalityChange={setMunicipality}
                required
              />
            </div>

            {/* Interactive map */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                Límites de la finca en el mapa *
              </p>
              <FarmMapSelector onData={handleMapData} />
            </div>

            {/* Summary of captured data */}
            {mapData && mapData.boundary_points.length >= 3 && (
              <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-3 grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-green-800">
                <span>Lat: <strong>{mapData.latitude}</strong></span>
                <span>Lng: <strong>{mapData.longitude}</strong></span>
                {mapData.area_hectares !== null && <span>Área: <strong>{mapData.area_hectares} ha</strong></span>}
                {mapData.altitude_masl !== null && <span>Altitud: <strong>{mapData.altitude_masl} msnm</strong></span>}
              </div>
            )}

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full h-12 text-base" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Registrando…
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
