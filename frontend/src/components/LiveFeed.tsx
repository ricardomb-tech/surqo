"use client"

import React from "react"
import { useWebSocket } from "@/lib/websocket"
import type { SensorReading } from "@/types"

interface LiveFeedProps {
  farmId?: string
}

const metrics = [
  { key: "soil_moisture_pct" as keyof SensorReading, label: "Suelo", unit: "%" },
  { key: "soil_temp_c" as keyof SensorReading, label: "Temp. suelo", unit: "°C" },
  { key: "air_temp_c" as keyof SensorReading, label: "Temp. aire", unit: "°C" },
  { key: "air_humidity_pct" as keyof SensorReading, label: "Humedad", unit: "%" },
  { key: "vpd_kpa" as keyof SensorReading, label: "VPD", unit: "kPa" },
  { key: "uv_index" as keyof SensorReading, label: "UV", unit: "" },
]

export function LiveFeed({ farmId = "demo" }: LiveFeedProps) {
  const { data, connected } = useWebSocket<SensorReading>(farmId)

  return (
    <div className="glass rounded-xl border border-white/[0.07] p-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-surqo-text">Sensor ESP32</h3>
          <p className="text-xs text-surqo-text-muted mt-0.5">Feed en vivo</p>
        </div>
        <div className="flex items-center gap-2">
          {connected ? (
            <>
              <span className="live-dot" />
              <span className="text-xs font-medium text-surqo-green-bright">Live</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-surqo-text-muted" />
              <span className="text-xs text-surqo-text-muted">Offline</span>
            </>
          )}
        </div>
      </div>

      {data ? (
        <>
          <div className="grid grid-cols-2 gap-2">
            {metrics.map((m) => {
              const raw = data[m.key]
              const val = raw !== null && raw !== undefined ? Number(raw).toFixed(1) : null
              return (
                <div key={m.key} className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-2.5">
                  <p className="text-[10px] text-surqo-text-muted uppercase tracking-wide mb-1">{m.label}</p>
                  <p className="text-sm font-semibold text-surqo-text data-value">
                    {val !== null ? `${val}${m.unit}` : "—"}
                  </p>
                </div>
              )
            })}
          </div>

          <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between">
            <span className="text-[10px] text-surqo-text-muted font-mono">{data.device_id}</span>
            <span className="text-[10px] text-surqo-text-muted">
              {data.created_at ? new Date(data.created_at).toLocaleTimeString("es-CO") : ""}
              {data.battery_mv ? ` · ${data.battery_mv}mV` : ""}
            </span>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <div className="w-10 h-10 rounded-full border border-surqo-green/20 bg-surqo-green/5 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-surqo-green/50">
              <path d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"/>
            </svg>
          </div>
          <p className="text-xs text-surqo-text-muted text-center">
            {connected ? "Esperando datos del sensor..." : "Sin conexión al sensor"}
          </p>
        </div>
      )}
    </div>
  )
}
