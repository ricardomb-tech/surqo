"use client"

import { useState } from "react"
import { Button, Card } from "@/components/ui/Primitives"
import { LiveFeed } from "@/components/LiveFeed"
import { Cpu, Wifi, Terminal, ExternalLink, Zap, Info } from "lucide-react"

export default function SensorsPage() {
  const [farmId, setFarmId] = useState(process.env.NEXT_PUBLIC_DEMO_FARM_ID || "demo-farm-123")
  const [inputId, setInputId] = useState("")

  return (
    <div className="min-h-screen pt-28 pb-20">
      <div className="max-w-4xl mx-auto px-4">
        
        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surqo-green/10 border border-surqo-green/20 text-surqo-green-bright text-xs font-bold uppercase tracking-widest">
            <Wifi className="w-3 h-3" />
            Infraestructura IoT
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-gradient leading-tight">
            Monitoreo de Hardware
          </h1>
          <p className="text-surqo-text-secondary max-w-2xl mx-auto font-medium">
            Gestión de nodos ESP32 y stream de telemetría en tiempo real vía WebSockets seguros (WSS).
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* Main Connection Panel */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-surqo-green/10 flex items-center justify-center text-surqo-green">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black tracking-tight">Conexión de Nodo</h3>
                    <p className="text-[10px] text-surqo-text-muted font-bold uppercase tracking-widest">Estado: Operativo</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputId}
                  onChange={(e) => setInputId(e.target.value)}
                  placeholder="UUID de la finca (Ej: 550e8400...)"
                  className="flex-1"
                />
                <Button
                  onClick={() => setFarmId(inputId)}
                  variant="primary"
                >
                  Conectar
                </Button>
              </div>
            </Card>

            {farmId ? (
              <div className="animate-fade-up">
                <LiveFeed farmId={farmId} />
              </div>
            ) : (
              <Card className="p-12 text-center bg-black/5 dark:bg-white/5 border-dashed">
                <div className="w-16 h-16 rounded-full bg-surqo-text-muted/10 flex items-center justify-center mx-auto mb-4">
                  <Wifi className="w-8 h-8 text-surqo-text-muted" />
                </div>
                <h4 className="text-lg font-bold mb-1">Sin Conexión Activa</h4>
                <p className="text-sm text-surqo-text-secondary font-medium">
                  Ingresa un identificador válido para iniciar el túnel de datos.
                </p>
              </Card>
            )}
          </div>

          {/* Setup Instructions */}
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

              <div className="mt-8 pt-6 border-t border-black/5 dark:border-white/5">
                <div className="p-4 rounded-xl bg-surqo-sky/10 border border-surqo-sky/20 flex items-start gap-3">
                  <Info className="w-4 h-4 text-surqo-sky mt-0.5" />
                  <p className="text-[11px] text-surqo-sky font-bold leading-relaxed">
                    ¿No tienes hardware? Ejecuta el simulador local:
                    <code className="block mt-1 bg-surqo-sky/10 p-1.5 rounded font-mono text-[10px]">
                      python simulator.py --farm-id {farmId || "UUID"}
                    </code>
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 group cursor-pointer hover:border-surqo-green/30 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-surqo-green" />
                  <span className="font-bold text-sm tracking-tight">Documentación Técnica</span>
                </div>
                <ExternalLink className="w-4 h-4 text-surqo-text-muted group-hover:text-surqo-green transition-colors" />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
