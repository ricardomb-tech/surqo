import { useEffect, useRef, useState, useCallback } from "react"
import { getAccessToken } from "@/lib/auth"

const WS_BASE = (process.env.NEXT_PUBLIC_WS_URL || "wss://surqo-api.fly.dev").replace(/^﻿/, "").trim()
const MAX_RETRIES = 5
const BASE_DELAY_MS = 3_000

export function useWebSocket<T = unknown>(farmId: string | null) {
  const [data, setData] = useState<T | null>(null)
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const retries = useRef(0)
  const unmounted = useRef(false)

  const connect = useCallback(async () => {
    if (!farmId || unmounted.current) return

    let token: string | null = null
    try {
      token = await getAccessToken()
    } catch {
      return
    }
    if (!token || unmounted.current) return

    const url = `${WS_BASE}/api/v1/sensors/ws/live/${farmId}?token=${encodeURIComponent(token)}`
    let ws: WebSocket
    try {
      ws = new WebSocket(url)
    } catch {
      return
    }
    wsRef.current = ws

    // Timeout de conexión: si en 8s no abre, cerramos
    const openTimer = setTimeout(() => {
      if (ws.readyState !== WebSocket.OPEN) ws.close()
    }, 8_000)

    ws.onopen = () => {
      clearTimeout(openTimer)
      retries.current = 0
      if (!unmounted.current) setConnected(true)
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.type === "sensor_reading" || msg.type === "initial") {
          if (!unmounted.current) setData(msg.data as T)
        }
      } catch {
        // ignorar mensajes malformados
      }
    }

    ws.onclose = () => {
      clearTimeout(openTimer)
      if (unmounted.current) return
      setConnected(false)
      if (retries.current < MAX_RETRIES) {
        // backoff exponencial: 3s, 6s, 12s, 24s, 48s
        const delay = BASE_DELAY_MS * Math.pow(2, retries.current)
        retries.current += 1
        reconnectTimer.current = setTimeout(connect, delay)
      }
      // después de MAX_RETRIES, deja de reintentar silenciosamente
    }

    ws.onerror = () => { ws.close() }
  }, [farmId])

  useEffect(() => {
    unmounted.current = false
    retries.current = 0
    connect()
    return () => {
      unmounted.current = true
      reconnectTimer.current && clearTimeout(reconnectTimer.current)
      wsRef.current?.close()
    }
  }, [connect])

  return { data, connected }
}
