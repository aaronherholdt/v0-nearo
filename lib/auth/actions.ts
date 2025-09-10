// lib/auth/actions.ts
'use server'
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function signInWithGoogle() {
  const supabase = createClient()
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${base}/auth/callback?next=/dashboard` }
  })
  if (error) redirect("/auth/login?error=oauth_start_failed")
  redirect(data.url) // <-- crucial
}
