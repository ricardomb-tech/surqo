"use client"

import { useEffect, useRef, useState } from "react"
import { Navigation, Loader2, MapPin } from "lucide-react"

interface Props {
  lat: string
  lng: string
  onChange: (lat: string, lng: string) => void
}

let L: typeof import("leaflet") | null = null

export default function PointMapSelector({ lat, lng, onChange }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<import("leaflet").Map | null>(null)
  const markerRef = useRef<import("leaflet").Marker | null>(null)
  const [locating, setLocating] = useState(false)
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    if (mapInstanceRef.current || !mapRef.current) return

    import("leaflet").then((leaflet) => {
      L = leaflet
      delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      })

      const initialLat = parseFloat(lat) || 4.5709
      const initialLng = parseFloat(lng) || -74.2973
      const map = L.map(mapRef.current!, { zoomControl: true, attributionControl: false })
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map)
      map.setView([initialLat, initialLng], lat ? 14 : 6)

      // If coords already exist, place marker
      if (lat && lng && !isNaN(parseFloat(lat))) {
        markerRef.current = L.marker([parseFloat(lat), parseFloat(lng)]).addTo(map)
      }

      map.on("click", (e: import("leaflet").LeafletMouseEvent) => {
        const la = e.latlng.lat.toFixed(6)
        const lo = e.latlng.lng.toFixed(6)
        markerRef.current?.remove()
        markerRef.current = L!.marker([parseFloat(la), parseFloat(lo)]).addTo(map)
        onChange(la, lo)
      })

      mapInstanceRef.current = map
      setMapReady(true)
    })

    return () => {
      mapInstanceRef.current?.remove()
      mapInstanceRef.current = null
    }
  }, [])

  // Keep marker in sync when lat/lng change externally
  useEffect(() => {
    if (!mapInstanceRef.current || !L || !lat || !lng) return
    const la = parseFloat(lat), lo = parseFloat(lng)
    if (isNaN(la) || isNaN(lo)) return
    markerRef.current?.remove()
    markerRef.current = L.marker([la, lo]).addTo(mapInstanceRef.current)
    mapInstanceRef.current.setView([la, lo], Math.max(mapInstanceRef.current.getZoom(), 12))
  }, [lat, lng])

  const goToMyLocation = () => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const la = pos.coords.latitude.toFixed(6)
        const lo = pos.coords.longitude.toFixed(6)
        mapInstanceRef.current?.setView([parseFloat(la), parseFloat(lo)], 16)
        markerRef.current?.remove()
        if (L && mapInstanceRef.current) {
          markerRef.current = L.marker([parseFloat(la), parseFloat(lo)]).addTo(mapInstanceRef.current)
        }
        onChange(la, lo)
        setLocating(false)
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={goToMyLocation}
          disabled={locating || !mapReady}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors disabled:opacity-50"
        >
          {locating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
          Ir a mi ubicación
        </button>
        {lat && lng && !isNaN(parseFloat(lat)) && (
          <span className="text-[11px] text-green-700 font-mono bg-green-50 border border-green-200 px-2 py-1 rounded-md">
            {parseFloat(lat).toFixed(4)}, {parseFloat(lng).toFixed(4)}
          </span>
        )}
      </div>
      <div
        ref={mapRef}
        className="w-full rounded-xl border border-gray-200 overflow-hidden"
        style={{ height: 220, cursor: "crosshair" }}
      />
      <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
        <MapPin className="w-3 h-3 text-green-600 shrink-0" />
        Haz clic en el mapa para fijar la ubicación de tu finca.
      </p>
    </div>
  )
}
