"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Loader2, Bot, User, Lightbulb, Zap, Camera, X, ImagePlus } from "lucide-react"
import { getAccessToken } from "@/lib/auth"
import type { Analysis } from "@/types"

interface Message {
  role: "user" | "assistant"
  content: string
  image?: string // data URL for preview
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://surqo-api.fly.dev"

const SUGGESTIONS = [
  "¿Cuándo y cuánto debo regar?",
  "¿Hay riesgo de hongos o plagas esta semana?",
  "¿Cuándo y qué abono le echo?",
  "¿Cómo sé si la planta tiene falta de nutrientes?",
  "¿Qué hago si las hojas se están poniendo amarillas?",
]

interface Props {
  analysis: Analysis
}

function fileToBase64(file: File): Promise<{ base64: string; mime: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const [header, base64] = result.split(",")
      const mime = header.match(/data:([^;]+)/)?.[1] ?? "image/jpeg"
      resolve({ base64, mime })
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function AnalysisChat({ analysis }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [totalTokens, setTotalTokens] = useState(0)
  const [pendingImage, setPendingImage] = useState<{ base64: string; mime: string; preview: string } | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return
    // Compress if over 1MB
    const { base64, mime } = await fileToBase64(file)
    const preview = `data:${mime};base64,${base64}`
    setPendingImage({ base64, mime, preview })
  }

  const send = async (text: string) => {
    if ((!text.trim() && !pendingImage) || loading) return
    const userMsg: Message = {
      role: "user",
      content: text.trim() || "Analiza esta imagen de mi cultivo",
      image: pendingImage?.preview,
    }
    setMessages((m) => [...m, userMsg])
    setInput("")
    const imageToSend = pendingImage
    setPendingImage(null)
    setLoading(true)

    try {
      const token = await getAccessToken()
      const res = await fetch(`${API_BASE}/api/v1/analysis/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          analysis_id: analysis.id !== "demo" ? analysis.id : null,
          message: userMsg.content,
          history: messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
          image_base64: imageToSend?.base64 ?? null,
          image_mime: imageToSend?.mime ?? "image/jpeg",
        }),
      })
      if (!res.ok) throw new Error("Error del servidor")
      const data = await res.json()
      setMessages((m) => [...m, { role: "assistant", content: data.response }])
      setTotalTokens((t) => t + (data.input_tokens ?? 0) + (data.output_tokens ?? 0))
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
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-900">Agrónomo IA · SURQO</p>
          <p className="text-[11px] text-purple-500 font-medium">Experto en cultivos · {analysis.farm_name}</p>
        </div>
        {totalTokens > 0 && (
          <span className="text-[10px] font-bold text-purple-300 flex items-center gap-0.5 shrink-0">
            <Zap className="w-2.5 h-2.5" />{totalTokens.toLocaleString()} tokens
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="px-4 py-4 space-y-3 max-h-96 overflow-y-auto">
        {messages.length === 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 justify-center mb-2">
              <Camera className="w-3.5 h-3.5 text-purple-400" />
              <p className="text-xs text-gray-400 font-medium">Puedes subir una foto de tu cultivo para diagnóstico</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors text-left">
                  <Lightbulb className="w-3 h-3 shrink-0" />{s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2.5 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${m.role === "user" ? "bg-green-100" : "bg-purple-100"}`}>
              {m.role === "user" ? <User className="w-3.5 h-3.5 text-green-700" /> : <Bot className="w-3.5 h-3.5 text-purple-600" />}
            </div>
            <div className={`max-w-[80%] space-y-1.5 ${m.role === "user" ? "items-end flex flex-col" : ""}`}>
              {m.image && (
                <img src={m.image} alt="foto cultivo" className="rounded-xl max-h-48 object-cover border border-green-200" />
              )}
              <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === "user" ? "bg-green-600 text-white rounded-tr-sm" : "bg-gray-100 text-gray-800 rounded-tl-sm"
              }`}>
                {m.content}
              </div>
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

      {/* Image preview */}
      {pendingImage && (
        <div className="px-4 pb-2 flex items-center gap-2">
          <div className="relative">
            <img src={pendingImage.preview} alt="preview" className="h-16 w-16 object-cover rounded-lg border border-purple-200" />
            <button onClick={() => setPendingImage(null)}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600">
              <X className="w-3 h-3" />
            </button>
          </div>
          <p className="text-xs text-gray-500 font-medium">Foto lista para enviar</p>
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-4">
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = "" }} />
        <form onSubmit={(e) => { e.preventDefault(); send(input) }}
          className="flex gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus-within:border-purple-300 focus-within:ring-1 focus-within:ring-purple-200 transition-all">
          <button type="button" onClick={() => fileRef.current?.click()}
            className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-700 hover:bg-green-200 transition-colors shrink-0"
            title="Subir foto del cultivo">
            <ImagePlus className="w-3.5 h-3.5" />
          </button>
          <input value={input} onChange={(e) => setInput(e.target.value)}
            placeholder={pendingImage ? "Describe qué quieres saber de la foto…" : "Pregunta o sube una foto de tu cultivo…"}
            className="flex-1 text-sm bg-transparent outline-none text-gray-800 placeholder-gray-400"
            disabled={loading} />
          <button type="submit" disabled={(!input.trim() && !pendingImage) || loading}
            className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white hover:bg-purple-700 transition-colors disabled:opacity-40 shrink-0">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </form>
        <p className="text-[10px] text-gray-400 text-center mt-1.5">
          Experto en café, maíz, plátano, cacao, tomate, aguacate y más · Sube foto para diagnóstico visual
        </p>
      </div>
    </div>
  )
}
