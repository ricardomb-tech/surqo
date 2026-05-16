import { createBrowserClient } from "@supabase/ssr"

// createBrowserClient sincroniza la sesión en cookies además de localStorage,
// lo que permite que el middleware SSR lea la sesión del servidor.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
