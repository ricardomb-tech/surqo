"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Loader2, Bot, User, Lightbulb } from "lucide-react"
import { getAccessToken } from "@/lib/auth"
import type { Analysis } from "@/types"

interface Message { role: "user" | "assistant"; content: string }

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://surqo-api.fly.dev"

const SUGGESTIONS = [
  "¿Cuándo y cuánto debo regar?",
  "¿Hay riesgo de hongos o plagas esta semana?",
  "¿Qué significa el estrés hídrico?",
  "¿Cómo afecta el VPD a mi cultivo?",
  "Dame más detalles sobre la primera recomendación",
]

interface Props {
  analysis: Analysis
}

export default function AnalysisChat({ analysis }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  const send = async (text: string) => {
    if (!text.trim() || loading) return
    const userMsg: Message = { role: "user", content: text.trim() }
    setMessages((m) => [...m, userMsg])
    setInput("")
    setLoading(true)

    try {
      const token = await getAccessToken()
      const res = await fetch(`${API_BASE}/api/v1/analysis/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          analysis_id: analysis.id !== "demo" ? analysis.id : null,
          message: text.trim(),
          history: messages.slice(-8).map((m) => ({ role: m.role, content: m.content })),
        }),
      })
      if (!res.ok) throw new Error("Error del servidor")
      const data = await res.json()
      setMessages((m) => [...m, { role: "assistant", content: data.response }])
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Lo siento, no pude conectarme. Intenta de nuevo." }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-purple-100 bg-white overflow-hidden" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-purple-100 flex items-center gap-3 bg-purple-50/50">
        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
          <Bot className="w-4 h-4 text-purple-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">Pregúntale a la IA</p>
          <p className="text-[11px] text-purple-500 font-medium">Contexto: análisis de {analysis.farm_name}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="px-4 py-4 space-y-3 max-h-80 overflow-y-auto">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-xs text-gray-400 font-medium text-center mb-3">Preguntas sugeridas</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors text-left"
                >
                  <Lightbulb className="w-3 h-3 shrink-0" />
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2.5 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
              m.role === "user" ? "bg-green-100" : "bg-purple-100"
            }`}>
              {m.role === "user"
                ? <User className="w-3.5 h-3.5 text-green-700" />
                : <Bot className="w-3.5 h-3.5 text-purple-600" />
              }
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
              m.role === "user"
                ? "bg-green-600 text-white rounded-tr-sm"
                : "bg-gray-100 text-gray-800 rounded-tl-sm"
            }`}>
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2.5">
            <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-2.5 flex items-center gap-1.5">
              {[0, 150, 300].map((d) => (
                <div key={d} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-4">
        <form
          onSubmit={(e) => { e.preventDefault(); send(input) }}
          className="flex gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus-within:border-purple-300 focus-within:ring-1 focus-within:ring-purple-200 transition-all"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu pregunta sobre el análisis…"
            className="flex-1 text-sm bg-transparent outline-none text-gray-800 placeholder-gray-400"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white hover:bg-purple-700 transition-colors disabled:opacity-40 shrink-0"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </form>
      </div>
    </div>
  )
}
