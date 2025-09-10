import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import SimpleDashboard from "@/components/simple-dashboard"

export default async function Dashboard() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

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
