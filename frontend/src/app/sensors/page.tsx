"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/Primitives"
import { LiveFeed } from "@/components/LiveFeed"
import { Cpu, Wifi, Terminal, Zap, Info, Loader2 } from "lucide-react"
import { RequireAuth } from "@/components/RequireAuth"
import { farmAPI } from "@/lib/api"
import type { Farm } from "@/types"

function SensorsContent() {
  const [farm, setFarm] = useState<Farm | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    farmAPI.list()
      .then((farms) => { if (farms.length > 0) setFarm(farms[0]) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-surqo-green animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-28 pb-20">
      <div className="max-w-4xl mx-auto px-4">

        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surqo-green/10 border border-surqo-green/20 text-surqo-green-bright text-xs font-bold uppercase tracking-widest">
            <Wifi className="w-3 h-3" />
            Infraestructura IoT
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-gradient leading-tight">
            Monitoreo de Hardware
          </h1>
          <p className="text-surqo-text-secondary max-w-2xl mx-auto font-medium">
            Stream de telemetría en tiempo real vía WebSockets seguros (WSS).
          </p>
          {farm && (
            <p className="text-sm text-surqo-green-bright font-bold">
              Finca: {farm.name}
            </p>
          )}
        </div>

        <div className="grid lg:grid-cols-12 gap-8">

          <div className="lg:col-span-7 space-y-6">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-surqo-green/10 flex items-center justify-center text-surqo-green">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black tracking-tight">Conexión de Nodo</h3>
                  <p className="text-[10px] text-surqo-text-muted font-bold uppercase tracking-widest">
                    {farm ? "Finca detectada" : "Sin finca registrada"}
                  </p>
                </div>
              </div>

              {farm ? (
                <div className="text-sm text-surqo-text-secondary font-medium bg-surqo-green/5 border border-surqo-green/20 rounded-xl px-4 py-3">
                  Conectado a: <span className="font-bold text-surqo-text">{farm.name}</span>
                  <span className="text-surqo-text-muted ml-2">· ID: {farm.id.slice(0, 8)}…</span>
                </div>
              ) : (
                <p className="text-sm text-surqo-text-muted">
                  No tienes fincas registradas. Ve a <a href="/onboarding" className="text-surqo-green font-bold underline">Onboarding</a> para comenzar.
                </p>
              )}
            </Card>

            {farm ? (
              <div className="animate-fade-up">
                <LiveFeed farmId={farm.id} />
              </div>
            ) : (
              <Card className="p-12 text-center bg-black/5 border-dashed">
                <div className="w-16 h-16 rounded-full bg-surqo-text-muted/10 flex items-center justify-center mx-auto mb-4">
                  <Wifi className="w-8 h-8 text-surqo-text-muted" />
                </div>
                <h4 className="text-lg font-bold mb-1">Sin Conexión Activa</h4>
                <p className="text-sm text-surqo-text-secondary font-medium">
                  Registra una finca para activar el stream de datos.
                </p>
              </Card>
            )}
          </div>

          <div className="lg:col-span-5 space-y-6">
            <Card className="p-6 bg-surqo-green/[0.02]">
              <div className="flex items-center gap-3 mb-6">
                <Terminal className="w-5 h-5 text-surqo-green" />
                <h3 className="font-black tracking-tight">Guía de Despliegue</h3>
              </div>

              <div className="space-y-6">
                {[
                  { step: "01", text: "Configura WiFi y MQTT en config.h", desc: "Usa credenciales de HiveMQ Cloud" },
                  { step: "02", text: "Compila y flashea el firmware", desc: "Directorio: /firmware/surqo_node" },
                  { step: "03", text: "Verifica el handshake TLS", desc: "Puerto 8883 (MQTTS)" },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <span className="text-xl font-black text-surqo-green/20 tabular-nums">{item.step}</span>
                    <div>
                      <p className="text-sm font-bold text-surqo-text mb-0.5">{item.text}</p>
                      <p className="text-[11px] text-surqo-text-muted font-medium">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-black/5">
                <div className="p-4 rounded-xl bg-surqo-sky/10 border border-surqo-sky/20 flex items-start gap-3">
                  <Info className="w-4 h-4 text-surqo-sky mt-0.5" />
                  <p className="text-[11px] text-surqo-sky font-bold leading-relaxed">
                    ¿No tienes hardware? Ejecuta el simulador:
                    <code className="block mt-1 bg-surqo-sky/10 p-1.5 rounded font-mono text-[10px]">
                      python simulator.py --farm-id {farm?.id || "UUID"}
                    </code>
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 group cursor-pointer hover:border-surqo-green/30 transition-all">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-surqo-green" />
                <span className="font-bold text-sm tracking-tight">Documentación Técnica</span>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SensorsPage() {
  return (
    <RequireAuth>
      <SensorsContent />
    </RequireAuth>
  )
}
