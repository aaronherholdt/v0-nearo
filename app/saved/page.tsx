import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import SavedThreadsPage from "@/components/saved-threads-page"

export default async function SavedPage() {
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

  // Fetch saved threads
  const { data: savedThreads } = await supabase
    .from("saved_threads")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return <SavedThreadsPage user={user} profile={profile} savedThreads={savedThreads || []} />
}
