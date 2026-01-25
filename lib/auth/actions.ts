"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function signInWithGoogle(formData: FormData) {
  const flow = (formData.get("flow") as string) || "login" // "login" | "signup"
  const origin = (headers() as any).get("origin") || ""
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?flow=${flow}`,
      scopes: "email profile",
    },
  })

  if (error || !data?.url) {
    redirect(`/auth/${flow === "signup" ? "sign-up" : "login"}?error=auth_callback_error`)
  }

  // Send the browser to Google
  redirect(data.url)
}
