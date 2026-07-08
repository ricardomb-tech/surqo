"use client"

import { useEffect, useState, useCallback } from "react"
import { deviceAPI, farmAPI } from "@/lib/api"
import type { Device, Farm } from "@/types"
import {
  Cpu, Plus, Loader2, Trash2, X, AlertCircle, CheckCircle2,
  Wifi, WifiOff, Radio,
} from "lucide-react"
import { Button } from "@/components/ui/Primitives"

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
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h} h`
  return `hace ${Math.floor(h / 24)} d`
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [farms, setFarms] = useState<Farm[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [code, setCode] = useState("")
  const [farmId, setFarmId] = useState("")
  const [name, setName] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [d, f] = await Promise.all([deviceAPI.list(), farmAPI.list()])
      setDevices(d)
      setFarms(f)
      if (f.length && !farmId) setFarmId(f[0].id)
    } catch {
      setDevices([])
    } finally {
      setLoading(false)
    }
  }, [farmId])

  useEffect(() => { load() }, [load])

  const farmName = (id: string | null) =>
    farms.find((f) => f.id === id)?.name ?? "—"

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!code.trim()) { setError("Escribe el código que muestra el nodo."); return }
    if (!farmId) { setError("Selecciona la finca a la que pertenece el nodo."); return }
    setSubmitting(true)
    try {
      await deviceAPI.claim({ claim_code: code.trim().toUpperCase(), farm_id: farmId, name: name || undefined })
      setShowForm(false)
      setCode(""); setName("")
      await load()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo emparejar el nodo")
    } finally {
      setSubmitting(false)
    }
  }

  const handleUnclaim = async (id: string) => {
    setDeleteId(id)
    try { await deviceAPI.unclaim(id); await load() }
    finally { setDeleteId(null) }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-7 h-7 text-green-700 animate-spin" />
    </div>
  )

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
        <Button onClick={() => setShowForm(true)} className="gap-2" disabled={farms.length === 0}>
          <Plus className="w-4 h-4" />Emparejar nodo
        </Button>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
        <h1 className="text-2xl font-black tracking-tight text-gray-900">Mis dispositivos</h1>

        {farms.length === 0 && (
          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
            <p className="text-sm font-medium text-amber-800">
              Primero registra una finca en la sección <strong>Fincas</strong> — el nodo se empareja con ella.
            </p>
          </div>
        )}

        {/* Cómo emparejar */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Cómo conectar un nodo nuevo</p>
          <ol className="space-y-2 text-sm text-gray-600">
            <li className="flex gap-2"><span className="font-black text-green-600">1.</span> Enciende el nodo. Crea una red WiFi <strong>Surqo-Setup-XXXX</strong>.</li>
            <li className="flex gap-2"><span className="font-black text-green-600">2.</span> Conéctate a esa red desde tu celular y escribe el WiFi de tu casa/finca.</li>
            <li className="flex gap-2"><span className="font-black text-green-600">3.</span> El nodo muestra un <strong>código de 6 caracteres</strong>. Escríbelo aquí con “Emparejar nodo”.</li>
          </ol>
        </div>

        {/* Modal emparejar */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
            <div className="w-full max-w-md rounded-3xl border border-gray-100 shadow-2xl overflow-hidden bg-white my-8">
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center text-green-700">
                    <Radio className="w-4 h-4" />
                  </div>
                  <h2 className="text-lg font-black tracking-tight text-gray-900">Emparejar nodo</h2>
                </div>
                <button onClick={() => { setShowForm(false); setError(null) }}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleClaim} className="p-6 space-y-5">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Código del nodo *</label>
                  <input
                    placeholder="Ej: A3F2C1"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    maxLength={12}
                    className="w-full font-mono tracking-[0.3em] text-center text-lg"
                    autoFocus
                  />
                  <p className="text-xs text-gray-400 font-medium mt-1.5">Lo muestra la pantalla de configuración del nodo.</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Finca *</label>
                  <select value={farmId} onChange={(e) => setFarmId(e.target.value)} className="w-full">
                    {farms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Nombre (opcional)</label>
                  <input placeholder="Ej: Nodo lote norte" value={name} onChange={(e) => setName(e.target.value)} className="w-full" />
                </div>

                {error && (
                  <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-600 font-medium">{error}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => { setShowForm(false); setError(null) }}>Cancelar</Button>
                  <Button type="submit" className="flex-1 gap-2" disabled={submitting}>
                    {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    Emparejar
                  </Button>
                </div>
              </form>
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
              <p className="font-bold text-gray-900 text-lg">Sin dispositivos emparejados</p>
              <p className="text-sm text-gray-400 font-medium mt-1">Enciende un nodo y empareja su código para empezar a recibir datos.</p>
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
                    <button onClick={() => handleUnclaim(d.id)} disabled={deleteId === d.id}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all shrink-0"
                      title="Desvincular">
                      {deleteId === d.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
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
