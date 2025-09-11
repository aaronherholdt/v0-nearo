import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { redirect } from "next/navigation"
import SimpleDashboard from "@/components/simple-dashboard"

export default async function Dashboard() {
  const supabase = createServerComponentClient({ cookies })

  // First check session
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect("/auth/login")
  }

  // Then get user from session
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if profile exists
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (!profile) {
    redirect("/setup-profile")
  }

  return <SimpleDashboard user={user} profile={profile} />
}
