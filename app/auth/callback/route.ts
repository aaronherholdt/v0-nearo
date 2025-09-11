// app/auth/callback/route.ts
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get("code")
  const next = url.searchParams.get("next") ?? "/dashboard"

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })

    try {
      // Exchange code for session
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error("OAuth error:", error)
        return NextResponse.redirect(new URL("/auth/login?error=oauth_error", url.origin))
      }

      // Verify session was created
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        console.error("No session after OAuth")
        return NextResponse.redirect(new URL("/auth/login?error=no_session", url.origin))
      }
    } catch (error) {
      console.error("Callback error:", error)
      return NextResponse.redirect(new URL("/auth/login?error=callback_failed", url.origin))
    }
  }

  // Add a small delay to ensure cookies are set
  return NextResponse.redirect(new URL(next, url.origin))
}
