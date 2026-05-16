"use client"

import { supabase } from "./supabase"
import type { Session, User } from "@supabase/supabase-js"

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function getAccessToken(): Promise<string | null> {
  const session = await getSession()
  return session?.access_token ?? null
}

export async function signOut() {
  await supabase.auth.signOut()
}

export type { Session, User }
