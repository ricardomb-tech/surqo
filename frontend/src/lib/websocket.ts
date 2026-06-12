import { useEffect, useRef, useState, useCallback } from "react"

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || "wss://surqo-api.fly.dev"

export function useWebSocket<T = unknown>(farmId: string | null) {
  const [data, setData] = useState<T | null>(null)
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const connect = useCallback(() => {
    if (!farmId) return
    const url = `${WS_BASE}/api/v1/sensors/ws/live/${farmId}`

    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      setConnected(true)
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.type === "sensor_reading" || msg.type === "initial") {
          setData(msg.data as T)
        }
      } catch {
        // Ignorar mensajes malformados
      }
    }

    ws.onclose = () => {
      setConnected(false)
      // Reconectar en 3s
      reconnectTimer.current = setTimeout(connect, 3000)
    }

    ws.onerror = () => {
      ws.close()
    }
  }, [farmId])

  useEffect(() => {
    connect()
    return () => {
      reconnectTimer.current && clearTimeout(reconnectTimer.current)
      wsRef.current?.close()
    }
  }, [connect])

  return { data, connected }
}
