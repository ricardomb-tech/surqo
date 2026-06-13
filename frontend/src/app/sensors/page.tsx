"use client"

import { useState, useEffect } from "react"
import { LiveFeed } from "@/components/LiveFeed"
import { RequireAuth } from "@/components/RequireAuth"
import { farmAPI } from "@/lib/api"
import type { Farm } from "@/types"
import {
  Cpu, Wifi, Terminal, Loader2, Copy, Check,
  AlertCircle, CheckCircle2, ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/Primitives"

const STEPS = [
  {
    n: "01",
    title: "Configura config.h",
    desc: "WiFi SSID + password, host MQTT de HiveMQ Cloud y el Farm ID de tu finca.",
  },
  {
    n: "02",
    title: "Flashea el firmware",
    desc: "PlatformIO: pio run --target upload desde /firmware/surqo_node",
  },
  {
    n: "03",
    title: "Verifica la conexión",
    desc: "Abre el Serial Monitor a 115200 baud. Deberías ver ✅ Publicado por MQTT",
  },
]

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} className="p-1 rounded text-surqo-text-muted hover:text-surqo-green transition-colors">
      {copied ? <Check className="w-3.5 h-3.5 text-surqo-green" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  )
}

function SensorsContent() {
  const [farm, setFarm] = useState<Farm | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    farmAPI.list()
      .then((f) => { if (f.length) setFarm(f[0]) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-7 h-7 text-surqo-green animate-spin" />
    </div>
  )

  const farmId = farm?.id ?? "tu-farm-uuid"
  const simCmd = `python simulator.py --farm-id ${farmId} --interval 30 --mode mqtt`

  return (
    <div className="min-h-screen pt-20 pb-16 bg-surqo-bg">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* ── HEADER ── */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Wifi className="w-4 h-4 text-surqo-green" />
            <span className="text-xs font-bold tracking-[0.15em] uppercase text-surqo-green-bright">
              Infraestructura IoT
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-surqo-text">Sensores y Nodos</h1>
          <p className="text-sm text-surqo-text-secondary font-medium mt-0.5">
            Telemetría en tiempo real vía WebSocket · MQTT TLS 8883
          </p>
        </div>

        {/* ── STATUS CARD ── */}
        <div className={`glass rounded-2xl border p-5 flex items-center gap-4 ${
          farm ? "border-surqo-green/20" : "border-dashed border-white/[0.10]"
        }`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            farm ? "bg-surqo-green/10 text-surqo-green" : "bg-white/[0.04] text-surqo-text-muted"
          }`}>
            <Cpu className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            {farm ? (
              <>
                <div className="flex items-center gap-2 mb-0.5">
                  <CheckCircle2 className="w-4 h-4 text-surqo-green" />
                  <p className="font-bold text-surqo-text text-sm">{farm.name}</p>
                  <span className="text-[10px] font-bold text-surqo-green-bright bg-surqo-green/10 border border-surqo-green/20 px-2 py-0.5 rounded">
                    Finca activa
                  </span>
                </div>
                <p className="text-xs text-surqo-text-muted font-mono">{farm.crop_type} · ID: {farm.id.slice(0, 16)}…</p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-0.5">
                  <AlertCircle className="w-4 h-4 text-surqo-text-muted" />
                  <p className="font-bold text-surqo-text text-sm">Sin finca registrada</p>
                </div>
                <p className="text-xs text-surqo-text-muted">Registra tu finca primero para activar el stream de datos</p>
              </>
            )}
          </div>
          {!farm && (
            <Button size="sm" className="shrink-0 gap-1.5 h-9" onClick={() => (window.location.href = "/farms")}>
              <ArrowRight className="w-3.5 h-3.5" />
              Registrar finca
            </Button>
          )}
        </div>

        {/* ── LIVE FEED + GUIDE ── */}
        <div className="grid lg:grid-cols-5 gap-6">

          {/* Live Feed — 3/5 */}
          <div className="lg:col-span-3 glass rounded-2xl border border-white/[0.07] overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-surqo-green/10 flex items-center justify-center text-surqo-green">
                <Wifi className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-surqo-text text-sm">Live Feed</p>
                <p className="text-[11px] text-surqo-text-muted font-bold uppercase tracking-widest">
                  Nodo ESP32 · WebSocket
                </p>
              </div>
            </div>
            <div className="p-4">
              {farm
                ? <LiveFeed farmId={farm.id} />
                : (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                    <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                      <Wifi className="w-6 h-6 text-surqo-text-muted opacity-40" />
                    </div>
                    <p className="text-sm text-surqo-text-muted font-medium">Sin finca — registra una para activar el stream</p>
                  </div>
                )
              }
            </div>
          </div>

          {/* Guide — 2/5 */}
          <div className="lg:col-span-2 space-y-4">

            {/* Deployment steps */}
            <div className="glass rounded-2xl border border-white/[0.07] overflow-hidden">
              <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-3">
                <Terminal className="w-4 h-4 text-surqo-green" />
                <p className="font-bold text-surqo-text text-sm">Guía de despliegue</p>
              </div>
              <div className="p-5 space-y-5">
                {STEPS.map((s) => (
                  <div key={s.n} className="flex gap-4">
                    <span className="text-2xl font-black text-surqo-green/15 tabular-nums leading-none shrink-0 mt-0.5">
                      {s.n}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-surqo-text">{s.title}</p>
                      <p className="text-xs text-surqo-text-muted font-medium mt-0.5 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Simulator command */}
            <div className="glass rounded-2xl border border-surqo-sky/20 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-surqo-sky/10 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-surqo-sky" />
                <p className="text-xs font-bold text-surqo-sky uppercase tracking-widest">Sin hardware</p>
              </div>
              <div className="p-5">
                <p className="text-xs text-surqo-text-secondary font-medium mb-3">
                  Usa el simulador para generar datos de prueba:
                </p>
                <div className="bg-black/30 rounded-xl p-3 flex items-start gap-2 border border-white/[0.06]">
                  <code className="text-[11px] text-surqo-green font-mono flex-1 break-all leading-relaxed">
                    {simCmd}
                  </code>
                  <CopyButton text={simCmd} />
                </div>
              </div>
            </div>

            {/* Farm ID */}
            {farm && (
              <div className="glass rounded-2xl border border-white/[0.07] p-5">
                <p className="text-xs font-bold text-surqo-text-muted uppercase tracking-widest mb-2">Farm ID para config.h</p>
                <div className="bg-black/30 rounded-xl p-3 flex items-center gap-2 border border-white/[0.06]">
                  <code className="text-[11px] text-surqo-text font-mono flex-1 truncate">{farm.id}</code>
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

export default function SensorsPage() {
  return <RequireAuth><SensorsContent /></RequireAuth>
}
