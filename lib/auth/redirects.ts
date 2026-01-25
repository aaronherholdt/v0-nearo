"use server"

import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Determines where an authenticated user should land based on whether
 * they've created a basic profile.
 */
export async function getPostAuthRedirectPath(
  supabase: SupabaseClient<any, "public", any>
) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return "/auth/login"
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle()

  if (error && error.code !== "PGRST116") {
    console.error("Failed to determine profile completion status", error)
  }

  return profile ? "/forum" : "/setup-profile"
}

