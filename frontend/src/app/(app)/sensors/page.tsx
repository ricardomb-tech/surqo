"use client"

import { useState, useEffect } from "react"
import { LiveFeed } from "@/components/LiveFeed"
import { farmAPI } from "@/lib/api"
import type { Farm } from "@/types"
import {
  Cpu, Wifi, Terminal, Loader2, Copy, Check,
  AlertCircle, CheckCircle2, ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/Primitives"

const STEPS = [
  { n: "01", title: "Configura config.h", desc: "WiFi SSID + password, host MQTT de HiveMQ Cloud y el Farm ID de tu finca." },
  { n: "02", title: "Flashea el firmware", desc: "PlatformIO: pio run --target upload desde /firmware/surqo_node" },
  { n: "03", title: "Verifica la conexión", desc: "Abre el Serial Monitor a 115200 baud. Deberías ver ✅ Publicado por MQTT" },
]

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  return (
    <button onClick={copy} className="p-1 rounded text-gray-400 hover:text-green-600 transition-colors">
      {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  )
}

export default function SensorsPage() {
  const [farm, setFarm] = useState<Farm | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    farmAPI.list().then((f) => { if (f.length) setFarm(f[0]) }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-7 h-7 text-green-700 animate-spin" />
    </div>
  )

  const farmId = farm?.id ?? "tu-farm-uuid"
  const simCmd = `python simulator.py --farm-id ${farmId} --interval 30 --mode mqtt`

  return (
    <div className="min-h-screen pb-16">
      {/* Top bar */}
      <header className="h-16 flex items-center px-6 border-b sticky top-0 z-30"
        style={{ background: "#ffffff", borderColor: "#e8f0e8" }}>
        <div className="flex items-center gap-2">
          <Wifi className="w-4 h-4 text-green-700" />
          <span className="text-xs font-bold tracking-[0.15em] uppercase text-green-700">Infraestructura IoT</span>
          <span className="mx-2 text-gray-300">/</span>
          <span className="font-semibold text-gray-700 text-sm">Sensores y Nodos</span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900">Sensores y Nodos</h1>
          <p className="text-sm text-gray-500 font-medium mt-0.5">Telemetría en tiempo real vía WebSocket · MQTT TLS 8883</p>
        </div>

        {/* Status card */}
        <div className={`rounded-2xl border p-5 flex items-center gap-4 bg-white ${farm ? "border-green-200" : "border-dashed border-gray-200"}`}
          style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${farm ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-400"}`}>
            <Cpu className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            {farm ? (
              <>
                <div className="flex items-center gap-2 mb-0.5">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <p className="font-bold text-gray-900 text-sm">{farm.name}</p>
                  <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded">Finca activa</span>
                </div>
                <p className="text-xs text-gray-400 font-mono">{farm.crop_type} · ID: {farm.id.slice(0, 16)}…</p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-0.5">
                  <AlertCircle className="w-4 h-4 text-gray-400" />
                  <p className="font-bold text-gray-900 text-sm">Sin finca registrada</p>
                </div>
                <p className="text-xs text-gray-400">Registra tu finca primero para activar el stream de datos</p>
              </>
            )}
          </div>
          {!farm && (
            <Button size="sm" className="shrink-0 gap-1.5 h-9" onClick={() => (window.location.href = "/farms")}>
              <ArrowRight className="w-3.5 h-3.5" />Registrar finca
            </Button>
          )}
        </div>

        {/* Live Feed + Guide */}
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 rounded-2xl border border-gray-100 overflow-hidden bg-white"
            style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-700">
                <Wifi className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">Live Feed</p>
                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">Nodo ESP32 · WebSocket</p>
              </div>
            </div>
            <div className="p-4">
              {farm ? <LiveFeed farmId={farm.id} /> : (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                  <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                    <Wifi className="w-6 h-6 text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-400 font-medium">Sin finca — registra una para activar el stream</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl border border-gray-100 overflow-hidden bg-white" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                <Terminal className="w-4 h-4 text-green-700" />
                <p className="font-bold text-gray-900 text-sm">Guía de despliegue</p>
              </div>
              <div className="p-5 space-y-5">
                {STEPS.map((s) => (
                  <div key={s.n} className="flex gap-4">
                    <span className="text-2xl font-black text-green-100 tabular-nums leading-none shrink-0 mt-0.5">{s.n}</span>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{s.title}</p>
                      <p className="text-xs text-gray-400 font-medium mt-0.5 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-blue-100 overflow-hidden bg-white" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
              <div className="px-5 py-3.5 border-b border-blue-50 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">Sin hardware</p>
              </div>
              <div className="p-5">
                <p className="text-xs text-gray-500 font-medium mb-3">Usa el simulador para generar datos de prueba:</p>
                <div className="bg-gray-50 rounded-xl p-3 flex items-start gap-2 border border-gray-100">
                  <code className="text-[11px] text-green-700 font-mono flex-1 break-all leading-relaxed">{simCmd}</code>
                  <CopyButton text={simCmd} />
                </div>
              </div>
            </div>

            {farm && (
              <div className="rounded-2xl border border-gray-100 bg-white p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Farm ID para config.h</p>
                <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-2 border border-gray-100">
                  <code className="text-[11px] text-gray-700 font-mono flex-1 truncate">{farm.id}</code>
                  <CopyButton text={farm.id} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
