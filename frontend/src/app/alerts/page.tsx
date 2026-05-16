"use client"

import { useState } from "react"
import { Button, Card } from "@/components/ui/Primitives"
import { AlertBadge } from "@/components/AlertBadge"
import { ShieldAlert, History, Filter, Search, CheckCircle2 } from "lucide-react"

export default function AlertsPage() {
  const [filter, setFilter] = useState("all")

  return (
    <div className="min-h-screen pt-10 pb-20">
      <div className="max-w-5xl mx-auto px-4">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surqo-danger/10 border border-surqo-danger/20 text-surqo-danger text-xs font-bold uppercase tracking-widest">
              <ShieldAlert className="w-3 h-3" />
              Gestión de Riesgos
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-gradient leading-tight">
              Protocolos de Alerta
            </h1>
            <p className="text-surqo-text-secondary max-w-xl font-medium">
              Histórico y gestión de eventos críticos detectados por el sistema de monitoreo inteligente.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="w-4 h-4" />
              Filtrar
            </Button>
            <Button variant="primary" size="sm" className="gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Resolver Todo
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* Active Alerts List */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-black tracking-tight flex items-center gap-2">
                <History className="w-5 h-5 text-surqo-green" />
                Eventos Recientes
              </h3>
              <span className="text-[10px] font-bold text-surqo-text-muted uppercase tracking-widest bg-black/5 dark:bg-white/5 px-2 py-1 rounded-md">
                2 Alertas Activas
              </span>
            </div>

            <div className="space-y-4">
              <AlertBadge 
                severity="critical" 
                message="Déficit Hídrico Severo - Sector Sur" 
                time="Hace 12 minutos"
                alert={{
                  id: "1",
                  title: "Déficit Hídrico Severo - Sector Sur",
                  severity: "critical",
                  description: "La humedad del suelo ha caído por debajo del 30% mientras la temperatura ambiente supera los 32°C.",
                  recommended_action: "Iniciar ciclo de riego de emergencia inmediatamente.",
                  created_at: new Date().toISOString(),
                  is_resolved: false
                }}
              />
              <AlertBadge 
                severity="warning" 
                message="Anomalía en Sensor de Humedad Aire" 
                time="Hace 1 hora"
                alert={{
                  id: "2",
                  title: "Anomalía en Sensor de Humedad Aire",
                  severity: "warning",
                  description: "Lecturas intermitentes detectadas en el nodo SURQO-X02. Posible interferencia de señal.",
                  recommended_action: "Verificar posición de la antena del nodo.",
                  created_at: new Date(Date.now() - 3600000).toISOString(),
                  is_resolved: false
                }}
              />
              
              {/* Resolved Alerts */}
              <div className="pt-8 opacity-60">
                <h4 className="text-xs font-bold text-surqo-text-muted uppercase tracking-widest mb-4">Resueltas recientemente</h4>
                <AlertBadge 
                  severity="info" 
                  message="Mantenimiento Programado Completado" 
                  time="Ayer, 18:45"
                  alert={{
                    id: "3",
                    title: "Mantenimiento Programado Completado",
                    severity: "info",
                    description: "Se ha actualizado el firmware de todos los nodos a la versión 2.4.1.",
                    created_at: new Date(Date.now() - 86400000).toISOString(),
                    is_resolved: true
                  }}
                />
              </div>
            </div>
          </div>

          {/* Stats & Search */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="p-6">
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surqo-text-muted" />
                <input 
                  type="text" 
                  placeholder="Buscar alertas..." 
                  className="w-full pl-10"
                />
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-surqo-text-muted uppercase tracking-widest">Resumen Semanal</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-surqo-danger/5 border border-surqo-danger/10">
                    <p className="text-2xl font-black text-surqo-danger">3</p>
                    <p className="text-[10px] font-bold text-surqo-danger/60 uppercase">Críticas</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-surqo-warning/5 border border-surqo-warning/10">
                    <p className="text-2xl font-black text-surqo-warning">12</p>
                    <p className="text-[10px] font-bold text-surqo-warning/60 uppercase">Advertencias</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-surqo-green/[0.02]">
              <h4 className="text-sm font-black mb-3 tracking-tight">Reporte de Incidencias</h4>
              <p className="text-xs text-surqo-text-secondary leading-relaxed mb-4">
                Genera un informe PDF con todos los eventos y acciones tomadas durante el último mes.
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Exportar Reporte
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
