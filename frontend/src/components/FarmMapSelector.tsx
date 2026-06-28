"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { MapPin, Trash2, Loader2, Navigation, RotateCcw, CheckCircle2 } from "lucide-react"

interface Point { lat: number; lng: number }

interface FarmMapData {
  latitude: number
  longitude: number
  area_hectares: number | null
  altitude_masl: number | null
  boundary_points: Point[]
}

interface Props {
  onData: (data: FarmMapData) => void
}

// Leaflet is client-only — imported dynamically to avoid SSR issues
let L: typeof import("leaflet") | null = null

export default function FarmMapSelector({ onData }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<import("leaflet").Map | null>(null)
  const polygonRef = useRef<import("leaflet").Polygon | null>(null)
  const markersRef = useRef<import("leaflet").Marker[]>([])
  const centroidMarkerRef = useRef<import("leaflet").Marker | null>(null)

  const [points, setPoints] = useState<Point[]>([])
  const [locating, setLocating] = useState(false)
  const [fetchingAlt, setFetchingAlt] = useState(false)
  const [area, setArea] = useState<number | null>(null)
  const [centroid, setCentroid] = useState<Point | null>(null)
  const [altitude, setAltitude] = useState<number | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [tip, setTip] = useState("Usa 'Ir a mi ubicación' y luego haz clic en el mapa para marcar los límites de tu finca.")

  // Calculate polygon area (hectares) and centroid from points
  const calcAreaAndCentroid = useCallback((pts: Point[]) => {
    if (pts.length < 3) { setArea(null); setCentroid(null); return }
    // Shoelace formula for area in degrees, convert to m² then ha
    let a = 0
    const n = pts.length
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n
      a += pts[i].lng * pts[j].lat
      a -= pts[j].lng * pts[i].lat
    }
    const areaDeg = Math.abs(a) / 2

    // Convert degrees² to m² using approximate meters per degree at centroid lat
    const avgLat = pts.reduce((s, p) => s + p.lat, 0) / n
    const metersPerDegLat = 111320
    const metersPerDegLng = 111320 * Math.cos((avgLat * Math.PI) / 180)
    const areaM2 = areaDeg * metersPerDegLat * metersPerDegLng
    const areaHa = areaM2 / 10000

    setArea(parseFloat(areaHa.toFixed(4)))

    const cLat = pts.reduce((s, p) => s + p.lat, 0) / n
    const cLng = pts.reduce((s, p) => s + p.lng, 0) / n
    setCentroid({ lat: parseFloat(cLat.toFixed(6)), lng: parseFloat(cLng.toFixed(6)) })
  }, [])

  const fetchAltitude = useCallback(async (lat: number, lng: number) => {
    setFetchingAlt(true)
    try {
      const res = await fetch(
        `https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lng}`
      )
      if (res.ok) {
        const data = await res.json()
        const elev = data?.results?.[0]?.elevation
        if (typeof elev === "number") setAltitude(Math.round(elev))
      }
    } catch {
      // altitude is optional, skip silently
    } finally {
      setFetchingAlt(false)
    }
  }, [])

  // Notify parent whenever data changes
  useEffect(() => {
    if (!centroid) return
    onData({
      latitude: centroid.lat,
      longitude: centroid.lng,
      area_hectares: area,
      altitude_masl: altitude,
      boundary_points: points,
    })
  }, [centroid, area, altitude, points, onData])

  useEffect(() => {
    if (centroid) {
      fetchAltitude(centroid.lat, centroid.lng)
    }
  }, [centroid, fetchAltitude])

  // Init Leaflet map
  useEffect(() => {
    if (mapInstanceRef.current || !mapRef.current) return

    import("leaflet").then((leaflet) => {
      L = leaflet
      // Fix default marker icons
      delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      })

      const map = L.map(mapRef.current!, { zoomControl: true, attributionControl: false })
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map)
      map.setView([4.5709, -74.2973], 6) // Colombia center

      map.on("click", (e: import("leaflet").LeafletMouseEvent) => {
        const pt: Point = { lat: parseFloat(e.latlng.lat.toFixed(6)), lng: parseFloat(e.latlng.lng.toFixed(6)) }
        setPoints((prev) => {
          const next = [...prev, pt]
          redrawPolygon(map, next)
          return next
        })
        setTip("Sigue marcando puntos o presiona 'Limpiar' para empezar de nuevo.")
      })

      mapInstanceRef.current = map
      setMapReady(true)
    })

    return () => {
      mapInstanceRef.current?.remove()
      mapInstanceRef.current = null
    }
  }, [])

  const redrawPolygon = (map: import("leaflet").Map, pts: Point[]) => {
    if (!L) return
    // Remove old markers
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []
    polygonRef.current?.remove()
    centroidMarkerRef.current?.remove()

    pts.forEach((p, i) => {
      const marker = L!.circleMarker([p.lat, p.lng], {
        radius: 6, color: "#16a34a", fillColor: "#22c55e", fillOpacity: 1, weight: 2,
      }).addTo(map)
      marker.bindTooltip(`Punto ${i + 1}`, { permanent: false })
      markersRef.current.push(marker as unknown as import("leaflet").Marker)
    })

    if (pts.length >= 3) {
      polygonRef.current = L.polygon(pts.map((p) => [p.lat, p.lng] as [number, number]), {
        color: "#16a34a", fillColor: "#22c55e", fillOpacity: 0.2, weight: 2,
      }).addTo(map)

      // Centroid marker
      const cLat = pts.reduce((s, p) => s + p.lat, 0) / pts.length
      const cLng = pts.reduce((s, p) => s + p.lng, 0) / pts.length
      const centerIcon = L.divIcon({
        html: `<div style="background:#15803d;color:white;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:bold;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)">C</div>`,
        iconSize: [20, 20], iconAnchor: [10, 10],
      })
      centroidMarkerRef.current = L.marker([cLat, cLng], { icon: centerIcon })
        .addTo(map)
        .bindTooltip("Centro de la finca", { permanent: false })
    }
  }

  // Update area + centroid whenever points change
  useEffect(() => {
    calcAreaAndCentroid(points)
    if (mapInstanceRef.current) {
      redrawPolygon(mapInstanceRef.current, points)
    }
  }, [points, calcAreaAndCentroid])

  const goToMyLocation = () => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        mapInstanceRef.current?.setView([latitude, longitude], 16)
        setLocating(false)
        setTip("¡Encontrado! Ahora haz clic en el mapa para marcar los límites de tu finca.")
      },
      () => {
        setLocating(false)
        setTip("No se pudo obtener la ubicación. Navega manualmente al mapa y marca los puntos.")
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const clearPoints = () => {
    setPoints([])
    setArea(null)
    setCentroid(null)
    setAltitude(null)
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []
    polygonRef.current?.remove()
    centroidMarkerRef.current?.remove()
    setTip("Puntos eliminados. Haz clic en el mapa para empezar de nuevo.")
  }

  const removeLastPoint = () => {
    setPoints((prev) => prev.slice(0, -1))
  }

  return (
    <div className="space-y-2">
      {/* Controls */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={goToMyLocation}
          disabled={locating || !mapReady}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors disabled:opacity-50"
        >
          {locating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
          Ir a mi ubicación
        </button>
        <button
          type="button"
          onClick={removeLastPoint}
          disabled={points.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors disabled:opacity-40"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Deshacer punto
        </button>
        <button
          type="button"
          onClick={clearPoints}
          disabled={points.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Limpiar
        </button>
      </div>

      {/* Map */}
      <div
        ref={mapRef}
        className="w-full rounded-xl border border-gray-200 overflow-hidden"
        style={{ height: 340, cursor: "crosshair" }}
      />

      {/* Tip */}
      <p className="text-[11px] text-slate-500 font-medium flex items-start gap-1">
        <MapPin className="w-3 h-3 mt-0.5 shrink-0 text-green-600" />
        {tip}
      </p>

      {/* Status panel */}
      {points.length > 0 && (
        <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-3 space-y-1.5">
          <p className="text-xs font-bold text-green-800 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Datos capturados del mapa
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] font-medium text-green-700">
            <span>Puntos marcados: <strong>{points.length}</strong></span>
            {area !== null && <span>Área: <strong>{area} ha</strong></span>}
            {centroid && <span>Latitud: <strong>{centroid.lat}</strong></span>}
            {centroid && <span>Longitud: <strong>{centroid.lng}</strong></span>}
            {fetchingAlt && <span className="col-span-2 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" />Obteniendo altitud…</span>}
            {!fetchingAlt && altitude !== null && <span>Altitud: <strong>{altitude} msnm</strong></span>}
          </div>
          {points.length < 3 && (
            <p className="text-[11px] text-amber-600 font-medium">Marca al menos 3 puntos para calcular el área.</p>
          )}
        </div>
      )}
    </div>
  )
}
