// lib/auth/actions.ts
'use server'
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createServerActionClient } from "@supabase/auth-helpers-nextjs"

export async function signInWithGoogle() {
  const supabase = createServerActionClient({ cookies })
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  const next = "/dashboard"

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${base}/auth/callback?next=${encodeURIComponent(next)}`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      }
    }
  })

  if (error) {
    console.error("OAuth start error:", error)
    redirect("/auth/login?error=oauth_start_failed")
  }

  if (!data.url) {
    redirect("/auth/login?error=no_oauth_url")
  }

  redirect(data.url)
}
