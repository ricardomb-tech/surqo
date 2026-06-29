"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Camera, CheckCircle2, Eye, EyeOff, ImagePlus,
  Loader2, Lock, Phone, Save, User, AlertCircle, Sprout,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { getAccessToken } from "@/lib/auth"
import { useAuth } from "@/components/AuthProvider"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://surqo-api.fly.dev"
const LIME = "#86E66A"

interface FarmSummary {
  id: string
  name: string
  crop_type: string
  area_hectares: number | null
  municipality: string | null
  department: string | null
}

interface Profile {
  user_id: string
  email: string
  full_name: string | null
  phone: string | null
  bio: string | null
  avatar_url: string | null
  cover_url: string | null
  plan: string
  is_paid: boolean
  analyses_used: number
  analyses_limit: number | null
  analyses_remaining: number | null
  tokens_used: number
  tokens_limit: number | null
  farms_count: number
  farms: FarmSummary[]
  created_at: string
}

async function uploadToSupabase(file: File, path: string): Promise<string> {
  const { error } = await supabase.storage.from("profiles").upload(path, file, { upsert: true })
  if (error) throw new Error(error.message)
  const { data } = supabase.storage.from("profiles").getPublicUrl(path)
  return data.publicUrl
}

function AvatarDisplay({ url, name, size = 96 }: { url?: string | null; name?: string | null; size?: number }) {
  const [loaded, setLoaded] = useState(false)
  const [errored, setErrored] = useState(false)
  const initial = (name ?? "U")[0].toUpperCase()
  const showFallback = !url || errored

  return (
    <div className="rounded-full border-4 border-white shadow-lg overflow-hidden relative"
      style={{ width: size, height: size, flexShrink: 0 }}>
      {/* Fallback / placeholder */}
      <div className={`absolute inset-0 flex items-center justify-center font-black text-white transition-opacity duration-300 ${loaded && !errored ? "opacity-0" : "opacity-100"}`}
        style={{ background: "linear-gradient(135deg, #2d6e10, #86E66A)", fontSize: size * 0.35 }}>
        {showFallback ? initial : null}
      </div>
      {/* Imagen real */}
      {url && !errored && (
        <img
          src={url}
          alt="avatar"
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
        />
      )}
    </div>
  )
}

export default function ProfilePage() {
  const { user } = useAuth()
  const router = useRouter()
  const avatarRef = useRef<HTMLInputElement>(null)
  const coverRef = useRef<HTMLInputElement>(null)

  const [profile, setProfile] = useState<Profile | null>(null)
  const [tab, setTab] = useState<"personal" | "security">("personal")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [coverLoaded, setCoverLoaded] = useState(false)

  // Form personal
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [bio, setBio] = useState("")

  // Form security
  const [currentPwd, setCurrentPwd] = useState("")
  const [newPwd, setNewPwd] = useState("")
  const [confirmPwd, setConfirmPwd] = useState("")
  const [showPwd, setShowPwd] = useState(false)
  const [pwdSaving, setPwdSaving] = useState(false)
  const [pwdSaved, setPwdSaved] = useState(false)
  const [pwdError, setPwdError] = useState("")

  useEffect(() => {
    if (!user) return
    getAccessToken().then((token) =>
      fetch(`${API_BASE}/api/v1/users/me`, { headers: { Authorization: `Bearer ${token}` } })
    ).then((r) => r.json()).then((data: Profile) => {
      setProfile(data)
      setFullName(data.full_name ?? "")
      setPhone(data.phone ?? "")
      setBio(data.bio ?? "")
    })
  }, [user])

  const patchProfile = async (fields: Partial<Profile>) => {
    const token = await getAccessToken()
    const res = await fetch(`${API_BASE}/api/v1/users/me`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(fields),
    })
    if (!res.ok) throw new Error("Error al guardar")
    const data = await res.json()
    setProfile(data)
    // Notificar al sidebar para que actualice nombre y avatar
    window.dispatchEvent(new CustomEvent("profile-updated", {
      detail: { full_name: data.full_name, avatar_url: data.avatar_url }
    }))
    return data
  }

  const handleSavePersonal = async () => {
    setSaving(true); setError(""); setSaved(false)
    try {
      await patchProfile({ full_name: fullName || null, phone: phone || null, bio: bio || null })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (file: File) => {
    if (!user) return
    setUploadingAvatar(true); setError("")
    try {
      const ext = file.name.split(".").pop() ?? "jpg"
      const url = await uploadToSupabase(file, `avatars/${user.id}.${ext}`)
      await patchProfile({ avatar_url: url })
    } catch (e: unknown) {
      setError("No se pudo subir la foto. Asegúrate de tener el bucket 'profiles' creado en Supabase.")
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleCoverUpload = async (file: File) => {
    if (!user) return
    setUploadingCover(true); setError("")
    try {
      const ext = file.name.split(".").pop() ?? "jpg"
      const url = await uploadToSupabase(file, `covers/${user.id}.${ext}`)
      setCoverLoaded(false)
      await patchProfile({ cover_url: url })
    } catch (e: unknown) {
      setError("No se pudo subir la portada. Asegúrate de tener el bucket 'profiles' creado en Supabase.")
    } finally {
      setUploadingCover(false)
    }
  }

  const handleChangePassword = async () => {
    setPwdError(""); setPwdSaved(false)
    if (!newPwd || newPwd.length < 8) { setPwdError("La contraseña debe tener al menos 8 caracteres"); return }
    if (newPwd !== confirmPwd) { setPwdError("Las contraseñas no coinciden"); return }
    setPwdSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPwd })
      if (error) throw error
      setPwdSaved(true)
      setCurrentPwd(""); setNewPwd(""); setConfirmPwd("")
      setTimeout(() => setPwdSaved(false), 4000)
    } catch (e: unknown) {
      setPwdError(e instanceof Error ? e.message : "Error al cambiar contraseña")
    } finally {
      setPwdSaving(false)
    }
  }

  if (!profile) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-6 h-6 animate-spin text-green-600" />
    </div>
  )

  const memberSince = new Date(profile.created_at).toLocaleDateString("es-CO", { month: "long", year: "numeric" })

  return (
    <div className="min-h-screen" style={{ background: "#f4f7f4" }}>
      {/* Cover */}
      <div className="relative h-48 sm:h-56 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0f2e10 0%, #1a4a1a 60%, #1f5a20 100%)" }}>
        {/* Skeleton shimmer mientras carga */}
        {profile.cover_url && !coverLoaded && (
          <div className="absolute inset-0 animate-pulse" style={{ background: "linear-gradient(90deg, #1a4a1a 25%, #2d6e10 50%, #1a4a1a 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
        )}
        {profile.cover_url && (
          <img
            src={profile.cover_url}
            alt="portada"
            onLoad={() => setCoverLoaded(true)}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${coverLoaded ? "opacity-100" : "opacity-0"}`}
          />
        )}
        <div className="absolute inset-0 bg-black/20" />

        {/* Botón cambiar portada */}
        <button onClick={() => coverRef.current?.click()}
          disabled={uploadingCover}
          className="absolute bottom-3 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all"
          style={{ background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,255,255,0.25)" }}>
          {uploadingCover ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
          Cambiar portada
        </button>
        <input ref={coverRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f); e.target.value = "" }} />
      </div>

      {/* Avatar + nombre */}
      <div className="px-6 sm:px-10">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 mb-8 pt-2">
          <div className="relative shrink-0">
            <AvatarDisplay url={profile.avatar_url} name={profile.full_name || profile.email} size={96} />
            <button onClick={() => avatarRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center shadow-md hover:bg-gray-50 transition-colors">
              {uploadingAvatar ? <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-500" /> : <Camera className="w-3.5 h-3.5 text-gray-600" />}
            </button>
            <input ref={avatarRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(f); e.target.value = "" }} />
          </div>

          <div className="flex-1 pb-1">
            <h1 className="text-xl font-black text-gray-900">{profile.full_name || profile.email.split("@")[0]}</h1>
            <p className="text-sm text-gray-500 font-medium">{profile.email}</p>
            <div className="flex flex-wrap gap-3 mt-1.5">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: profile.plan === "paid" ? "#fef3c7" : `${LIME}20`, color: profile.plan === "paid" ? "#92400e" : "#2d6e10" }}>
                Plan {profile.plan === "paid" ? "Premium" : "Gratuito"}
              </span>
              <span className="text-xs text-gray-400 font-medium">Miembro desde {memberSince}</span>
            </div>
          </div>

          {/* Stats rápidas */}
          <div className="flex gap-4 pb-1">
            <div className="text-center">
              <p className="text-xl font-black text-gray-900">{profile.farms_count}</p>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Fincas</p>
            </div>
            <div className="w-px bg-gray-200" />
            <div className="text-center">
              <p className="text-xl font-black text-gray-900">
                {profile.analyses_used}
                {profile.analyses_limit != null && <span className="text-sm font-medium text-gray-400">/{profile.analyses_limit}</span>}
              </p>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Análisis IA</p>
            </div>
            <div className="w-px bg-gray-200" />
            <div className="text-center">
              <p className="text-xl font-black text-gray-900">{(profile.tokens_used / 1000).toFixed(1)}k</p>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Tokens</p>
            </div>
          </div>
        </div>

        {/* Error global */}
        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />{error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-gray-200">
          {[
            { id: "personal", label: "Datos personales", icon: User },
            { id: "security", label: "Seguridad", icon: Lock },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id as "personal" | "security")}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all -mb-px ${
                tab === id
                  ? "border-green-600 text-green-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </div>

        {/* ── Tab: Personal ── */}
        {tab === "personal" && (
          <div className="max-w-xl space-y-5 pb-12">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Nombre completo</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={fullName} onChange={(e) => setFullName(e.target.value)}
                  placeholder="Tu nombre"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium outline-none focus:border-green-500 focus:ring-1 focus:ring-green-200 transition-all bg-white" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Correo electrónico</label>
              <input value={profile.email} disabled
                className="w-full px-4 py-2.5 rounded-xl border border-gray-100 text-sm font-medium bg-gray-50 text-gray-400 cursor-not-allowed" />
              <p className="text-[11px] text-gray-400 mt-1">El correo no se puede cambiar directamente</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Teléfono / WhatsApp</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={phone} onChange={(e) => setPhone(e.target.value)}
                  placeholder="+57 300 000 0000"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium outline-none focus:border-green-500 focus:ring-1 focus:ring-green-200 transition-all bg-white" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                Descripción <span className="text-gray-300 font-normal">({bio.length}/500)</span>
              </label>
              <div className="relative">
                <Sprout className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <textarea value={bio} onChange={(e) => setBio(e.target.value.slice(0, 500))}
                  placeholder="Cuéntanos sobre tu finca, cultivos o experiencia…"
                  rows={3}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium outline-none focus:border-green-500 focus:ring-1 focus:ring-green-200 transition-all bg-white resize-none" />
              </div>
            </div>

            <button onClick={handleSavePersonal} disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #2d6e10, #3d8e20)", boxShadow: "0 4px 12px rgba(45,110,16,0.3)" }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saving ? "Guardando…" : saved ? "¡Guardado!" : "Guardar cambios"}
            </button>

            {/* Mis fincas */}
            {profile.farms && profile.farms.length > 0 && (
              <div className="pt-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Mis fincas</h3>
                <div className="space-y-2">
                  {profile.farms.map((farm) => (
                    <div key={farm.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-white">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: `${LIME}25` }}>
                        <Sprout className="w-4 h-4" style={{ color: "#2d6e10" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{farm.name}</p>
                        <p className="text-xs text-gray-400 truncate">
                          {farm.crop_type}
                          {farm.area_hectares ? ` · ${farm.area_hectares} ha` : ""}
                          {farm.municipality ? ` · ${farm.municipality}` : ""}
                          {farm.department ? `, ${farm.department}` : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Uso del plan */}
            <div className="pt-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Uso del plan</h3>
              <div className="space-y-3">
                {profile.analyses_limit != null && (
                  <div>
                    <div className="flex justify-between text-xs font-medium text-gray-600 mb-1">
                      <span>Análisis IA</span>
                      <span>{profile.analyses_used} / {profile.analyses_limit}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, (profile.analyses_used / profile.analyses_limit) * 100)}%`,
                          background: profile.analyses_used >= profile.analyses_limit ? "#ef4444" : "linear-gradient(90deg, #2d6e10, #86E66A)"
                        }} />
                    </div>
                    {profile.analyses_remaining === 0 && (
                      <p className="text-[11px] text-red-500 mt-1 font-medium">Límite alcanzado — contacta al equipo para plan premium</p>
                    )}
                  </div>
                )}
                <div className="flex justify-between text-xs font-medium text-gray-600">
                  <span>Tokens usados</span>
                  <span>{profile.tokens_used.toLocaleString("es-CO")} {profile.tokens_limit ? `/ ${profile.tokens_limit.toLocaleString("es-CO")}` : ""}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Seguridad ── */}
        {tab === "security" && (
          <div className="max-w-xl space-y-5 pb-12">
            <div className="p-4 rounded-2xl border border-blue-100 bg-blue-50/50 text-sm text-blue-700 font-medium">
              Para cambiar tu contraseña debes estar conectado con tu cuenta actual.
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Nueva contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type={showPwd ? "text" : "password"} value={newPwd} onChange={(e) => setNewPwd(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm font-medium outline-none focus:border-green-500 focus:ring-1 focus:ring-green-200 transition-all bg-white" />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Confirmar contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type={showPwd ? "text" : "password"} value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)}
                  placeholder="Repite la contraseña"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium outline-none focus:border-green-500 focus:ring-1 focus:ring-green-200 transition-all bg-white" />
              </div>
            </div>

            {pwdError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0" />{pwdError}
              </div>
            )}
            {pwdSaved && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-200 text-sm text-green-700">
                <CheckCircle2 className="w-4 h-4 shrink-0" />Contraseña actualizada correctamente
              </div>
            )}

            <button onClick={handleChangePassword} disabled={pwdSaving || !newPwd}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #2d6e10, #3d8e20)", boxShadow: "0 4px 12px rgba(45,110,16,0.3)" }}>
              {pwdSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              {pwdSaving ? "Actualizando…" : "Cambiar contraseña"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
