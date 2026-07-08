"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { deviceAPI, farmAPI } from "@/lib/api"
import { getCached } from "@/lib/cache"
import type { Device, Farm } from "@/types"
import {
  Cpu, Plus, Loader2, Trash2, X, AlertCircle, CheckCircle2,
  Wifi, WifiOff, Radio, Search, Keyboard,
} from "lucide-react"
import { Button } from "@/components/ui/Primitives"
import { PageSkeleton } from "@/components/Skeleton"

const ONLINE_WINDOW_MS = 30 * 60 * 1000  // 30 min sin reportar = desconectado

function statusOf(d: Device): { label: string; online: boolean } {
  if (!d.last_seen) return { label: "Nunca conectado", online: false }
  const ageMs = Date.now() - new Date(d.last_seen).getTime()
  return ageMs < ONLINE_WINDOW_MS
    ? { label: "En línea", online: true }
    : { label: `Visto ${relTime(ageMs)}`, online: false }
}

function relTime(ms: number): string {
  const min = Math.floor(ms / 60000)
  if (min < 1) return "hace segundos"
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h} h`
  return `hace ${Math.floor(h / 24)} d`
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>(() => getCached<Device[]>("devices") ?? [])
  const [farms, setFarms] = useState<Farm[]>(() => getCached<Farm[]>("farms") ?? [])
  const [loading, setLoading] = useState(() => getCached<Device[]>("devices") === null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [unclaimError, setUnclaimError] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)  // desvincular: pide confirmación

  // Flujo de conexión
  const [showModal, setShowModal] = useState(false)
  const [mode, setMode] = useState<"detect" | "manual">("detect")
  const [found, setFound] = useState<Device[]>([])
  const [farmId, setFarmId] = useState("")
  const [manualCode, setManualCode] = useState("")
  const [name, setName] = useState("")
  const [claiming, setClaiming] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Pinta al instante con la caché (si hay) y refresca en segundo plano
  const load = useCallback(async () => {
    try {
      const [d, f] = await Promise.all([deviceAPI.list(), farmAPI.list()])
      setDevices(d)
      setFarms(f)
      setFarmId((prev) => prev || (f[0]?.id ?? ""))
    } catch {
      // deja lo que ya había en pantalla (caché o vacío) ante un fallo transitorio
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Polling de detección automática mientras el modal está en modo "detect"
  useEffect(() => {
    if (!showModal || mode !== "detect") {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
      return
    }
    const poll = async () => {
      try { setFound(await deviceAPI.discoverable()) } catch { /* reintenta */ }
    }
    poll()
    pollRef.current = setInterval(poll, 3000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [showModal, mode])

  const farmName = (id: string | null) => farms.find((f) => f.id === id)?.name ?? "—"

  const openModal = () => {
    setMode("detect"); setFound([]); setError(null); setManualCode(""); setName("")
    setShowModal(true)
  }

  const claim = async (code: string) => {
    if (!farmId) { setError("Selecciona la finca a la que pertenece el nodo."); return }
    setError(null)
    setClaiming(code)
    try {
      const claimed = await deviceAPI.claim({ claim_code: code.trim().toUpperCase(), farm_id: farmId, name: name || undefined })
      // Optimista: lo agregamos ya mismo con lo que devolvió el servidor, sin esperar un reload completo
      setDevices((prev) => [claimed, ...prev.filter((d) => d.id !== claimed.id)])
      setShowModal(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo emparejar el nodo")
    } finally {
      setClaiming(null)
    }
  }

  const handleUnclaim = async (id: string) => {
    setDeleteId(id)
    setConfirmId(null)
    setUnclaimError(null)
    // Optimista: lo quitamos de la vista ya mismo; si falla, lo regresamos.
    const previous = devices
    setDevices((d) => d.filter((x) => x.id !== id))
    try {
      await deviceAPI.unclaim(id)
    } catch {
      setDevices(previous)  // rollback
      setUnclaimError("No se pudo desvincular el nodo. Intenta de nuevo.")
    } finally { setDeleteId(null) }
  }

  if (loading) return <PageSkeleton />

  return (
    <div className="min-h-screen pb-16">
      <header className="h-16 flex items-center justify-between px-6 border-b sticky top-0 z-30"
        style={{ background: "#ffffff", borderColor: "#e8f0e8" }}>
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-green-700" />
          <span className="text-xs font-bold tracking-[0.15em] uppercase text-green-700">Hardware</span>
          <span className="mx-2 text-gray-300">/</span>
          <span className="font-semibold text-gray-700 text-sm">Mis dispositivos</span>
        </div>
        <Button onClick={openModal} className="gap-2" disabled={farms.length === 0}>
          <Plus className="w-4 h-4" />Conectar nodo
        </Button>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
        <h1 className="text-2xl font-black tracking-tight text-gray-900">Mis dispositivos</h1>

        {farms.length === 0 && (
          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
            <p className="text-sm font-medium text-amber-800">
              Primero registra una finca en la sección <strong>Fincas</strong> — el nodo se conecta con ella.
            </p>
          </div>
        )}

        {unclaimError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-600 font-medium flex-1">{unclaimError}</p>
            <button onClick={() => setUnclaimError(null)} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Cómo conectar */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Cómo conectar un nodo nuevo</p>
          <ol className="space-y-2 text-sm text-gray-600">
            <li className="flex gap-2"><span className="font-black text-green-600">1.</span> Enciende el nodo. La 1ª vez crea una red WiFi <strong>Surqo-Setup-XXXX</strong>: conéctate desde el celular y elige tu WiFi.</li>
            <li className="flex gap-2"><span className="font-black text-green-600">2.</span> Toca <strong>“Conectar nodo”</strong> aquí y espera: el nodo aparece solo.</li>
            <li className="flex gap-2"><span className="font-black text-green-600">3.</span> Toca <strong>“Este es mi nodo”</strong> y listo — empieza a recibir datos.</li>
          </ol>
        </div>

        {/* Modal conectar */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
            <div className="w-full max-w-md rounded-3xl border border-gray-100 shadow-2xl overflow-hidden bg-white my-8">
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center text-green-700">
                    <Radio className="w-4 h-4" />
                  </div>
                  <h2 className="text-lg font-black tracking-tight text-gray-900">
                    {mode === "detect" ? "Detectar tu nodo" : "Escribir código"}
                  </h2>
                </div>
                <button onClick={() => setShowModal(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Selector de finca (común) */}
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Finca *</label>
                  <select value={farmId} onChange={(e) => setFarmId(e.target.value)} className="w-full">
                    {farms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>

                {mode === "detect" ? (
                  <>
                    {found.length === 0 ? (
                      <div className="flex flex-col items-center text-center py-8 gap-3">
                        <div className="relative">
                          <Search className="w-8 h-8 text-green-500" />
                          <Loader2 className="w-14 h-14 text-green-200 animate-spin absolute -top-3 -left-3" />
                        </div>
                        <p className="text-sm font-bold text-gray-700 mt-2">Buscando tu nodo…</p>
                        <p className="text-xs text-gray-400 font-medium max-w-[240px]">
                          Enciende el nodo y espera unos segundos. Aparecerá aquí en cuanto se conecte.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                          {found.length === 1 ? "Nodo detectado" : "Nodos detectados"}
                        </p>
                        {found.map((d) => (
                          <div key={d.id} className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-mono font-bold text-green-800 tracking-widest">{d.claim_code}</p>
                              <p className="text-xs text-green-600 font-medium">
                                {d.last_seen ? `Conectado ${relTime(Date.now() - new Date(d.last_seen).getTime())}` : "Recién conectado"}
                              </p>
                            </div>
                            <Button onClick={() => claim(d.claim_code)} disabled={claiming !== null} className="gap-1.5 shrink-0">
                              {claiming === d.claim_code ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                              Es mío
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    <button onClick={() => { setMode("manual"); setError(null) }}
                      className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors pt-1">
                      <Keyboard className="w-3.5 h-3.5" />¿No aparece? Escribe el código manualmente
                    </button>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Código del nodo *</label>
                      <input
                        placeholder="Ej: A3F2C1"
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                        maxLength={12}
                        className="w-full font-mono tracking-[0.3em] text-center text-lg"
                        autoFocus
                      />
                      <p className="text-xs text-gray-400 font-medium mt-1.5">Lo muestra la pantalla de configuración del nodo.</p>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Nombre (opcional)</label>
                      <input placeholder="Ej: Nodo lote norte" value={name} onChange={(e) => setName(e.target.value)} className="w-full" />
                    </div>
                    <div className="flex gap-3">
                      <Button type="button" variant="outline" className="flex-1" onClick={() => { setMode("detect"); setError(null) }}>Volver</Button>
                      <Button onClick={() => claim(manualCode)} className="flex-1 gap-2" disabled={claiming !== null || !manualCode.trim()}>
                        {claiming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        Emparejar
                      </Button>
                    </div>
                  </>
                )}

                {error && (
                  <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-600 font-medium">{error}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Lista de dispositivos */}
        {devices.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-20 flex flex-col items-center gap-5 text-center">
            <div className="w-16 h-16 rounded-2xl bg-green-50 border border-green-200 flex items-center justify-center">
              <Cpu className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-lg">Sin dispositivos conectados</p>
              <p className="text-sm text-gray-400 font-medium mt-1">Enciende un nodo y tócalo cuando aparezca para empezar a recibir datos.</p>
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {devices.map((d) => {
              const st = statusOf(d)
              return (
                <div key={d.id}
                  className="rounded-2xl border border-gray-100 bg-white hover:border-green-200 transition-all duration-200 group overflow-hidden"
                  style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                  <div className="px-5 pt-5 pb-4 border-b border-gray-100 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center shrink-0">
                        <Cpu className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-gray-900 tracking-tight truncate">{d.name || `Nodo ${d.claim_code}`}</p>
                        <p className="text-xs text-gray-400 font-medium truncate">{farmName(d.farm_id)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="px-5 py-4 space-y-3">
                    <div className="flex items-center gap-2">
                      {st.online
                        ? <Wifi className="w-4 h-4 text-green-500" />
                        : <WifiOff className="w-4 h-4 text-gray-300" />}
                      <span className={`text-xs font-bold ${st.online ? "text-green-600" : "text-gray-400"}`}>{st.label}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg bg-gray-50 text-gray-500 border border-gray-100 font-mono">
                        {d.claim_code}
                      </span>
                      {d.firmware_version && (
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg bg-gray-50 text-gray-500 border border-gray-100">
                          v{d.firmware_version}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-300 font-mono truncate">{d.device_mac}</p>

                    {/* Desvincular — visible, con confirmación */}
                    <div className="pt-2 border-t border-gray-100">
                      {confirmId === d.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-500 flex-1">¿Desvincular este nodo?</span>
                          <button onClick={() => handleUnclaim(d.id)} disabled={deleteId === d.id}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-red-500 hover:bg-red-600 transition-colors flex items-center gap-1.5">
                            {deleteId === d.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                            Sí, desvincular
                          </button>
                          <button onClick={() => setConfirmId(null)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-100 transition-colors">
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmId(d.id)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />Desvincular nodo
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
