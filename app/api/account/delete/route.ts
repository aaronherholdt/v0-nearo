import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js"

// flip this to false if you want to *only* soft delete and keep login intact
const HARD_DELETE_AUTH_USER = true

export async function POST() {
  const supabase = await createClient()

  // verify user
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // 1) scrub data via RPC (bypasses RLS via SECURITY DEFINER)
  const { error: rpcErr } = await supabase.rpc("soft_delete_user", { p_uid: user.id })
  if (rpcErr) {
    return NextResponse.json({ error: rpcErr.message }, { status: 500 })
  }

  // 2) (optional) hard delete auth user so they cannot log back in
  if (HARD_DELETE_AUTH_USER) {
    const admin = createSupabaseAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // server-only env var
    )
    const { error: delErr } = await admin.auth.admin.deleteUser(user.id)
    if (delErr) {
      // If delete fails, the account is still scrubbed/hidden, so we return 200 anyway.
      // You can log delErr.message to your observability tool.
    }
  }

  return NextResponse.json({ ok: true })
}
