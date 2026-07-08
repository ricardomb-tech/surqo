import type { Analysis, Alert, Device, Farm, KPIs, SensorReading, TimeseriesPoint } from "@/types"
import { getAccessToken } from "@/lib/auth"

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://surqo-api.fly.dev").replace(/^﻿/, "").trim()

async function fetchJSON<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await getAccessToken()
  const resp = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers ?? {}),
    },
  })
  if (!resp.ok) {
    const body = await resp.json().catch(() => null)
    const detail = body?.detail
    let message: string
    if (typeof detail === "string") {
      message = detail
    } else if (detail && typeof detail === "object") {
      // Errores estructurados (ej. cuota agotada) traen { message, code, ... }
      message = detail.message || detail.code || `Error ${resp.status}`
    } else {
      message = `Error ${resp.status}`
    }
    const e = new Error(message) as Error & { status?: number; detail?: unknown }
    e.status = resp.status
    e.detail = detail
    throw e
  }
  // 204 No Content (p.ej. DELETE) no trae cuerpo JSON
  if (resp.status === 204 || resp.headers.get("content-length") === "0") {
    return undefined as T
  }
  return resp.json()
}

// Farms
export const farmAPI = {
  list: () => fetchJSON<Farm[]>("/api/v1/farms/"),
  get: (id: string) => fetchJSON<Farm>(`/api/v1/farms/${id}`),
  create: (data: Partial<Farm>) =>
    fetchJSON<Farm>("/api/v1/farms/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  kpis: (id: string) => fetchJSON<KPIs>(`/api/v1/farms/${id}/kpis`),
}

// Analysis
export const analysisAPI = {
  analyze: (data: {
    farm_name: string
    lat: number
    lon: number
    crop_type: string
    farm_id?: string
    alert_email?: string
  }) =>
    fetchJSON<Analysis>("/api/v1/analysis/analyze", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  history: (farmId: string) =>
    fetchJSON<Analysis[]>(`/api/v1/analysis/history/${farmId}`),
  get: (id: string) => fetchJSON<Analysis>(`/api/v1/analysis/${id}`),
}

// Sensors
export const sensorAPI = {
  latest: (deviceId: string) =>
    fetchJSON<SensorReading>(`/api/v1/sensors/latest/${deviceId}`),
  timeseries: (farmId: string, hours = 24, metric = "soil_moisture_pct") =>
    fetchJSON<TimeseriesPoint[]>(
      `/api/v1/sensors/timeseries/${farmId}?hours=${hours}&metric=${metric}`
    ),
  stats: (farmId: string) =>
    fetchJSON<Record<string, unknown>>(`/api/v1/sensors/stats/${farmId}`),
}

// Alerts
export const alertAPI = {
  active: (farmId?: string) =>
    fetchJSON<Alert[]>(
      `/api/v1/alerts/active${farmId ? `?farm_id=${farmId}` : ""}`
    ),
  history: (farmId?: string) =>
    fetchJSON<Alert[]>(
      `/api/v1/alerts/history${farmId ? `?farm_id=${farmId}` : ""}`
    ),
  resolve: (id: string) =>
    fetchJSON<Alert>(`/api/v1/alerts/${id}/resolve`, {
      method: "PATCH",
      body: JSON.stringify({ resolved: true }),
    }),
}

// Devices (nodos ESP32)
export const deviceAPI = {
  list: () => fetchJSON<Device[]>("/api/v1/devices/"),
  discoverable: () => fetchJSON<Device[]>("/api/v1/devices/discoverable"),
  claim: (data: { claim_code: string; farm_id: string; name?: string }) =>
    fetchJSON<Device>("/api/v1/devices/claim", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  rename: (id: string, name: string) =>
    fetchJSON<Device>(`/api/v1/devices/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    }),
  unclaim: (id: string) =>
    fetchJSON<void>(`/api/v1/devices/${id}`, { method: "DELETE" }),
}

// KPIs
export const kpiAPI = {
  farm: (farmId: string) => fetchJSON<KPIs>(`/api/v1/kpis/farm/${farmId}`),
  vpdHistory: (farmId: string) =>
    fetchJSON<{ timestamp: string; vpd_kpa: number }[]>(
      `/api/v1/kpis/farm/${farmId}/vpd-history`
    ),
  pestRisk: (farmId: string) =>
    fetchJSON<Record<string, unknown>>(`/api/v1/kpis/farm/${farmId}/pest-risk`),
}
