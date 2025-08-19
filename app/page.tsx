import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import LandingPage from "@/components/landing-page"
import MVPDashboard from "@/components/mvp-dashboard"

export default async function Home() {
  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <h1 className="text-2xl font-bold mb-4">Connect Supabase to get started</h1>
      </div>
    )
  }

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <LandingPage />
  }

  // Check if family profile exists
  const { data: family } = await supabase.from("families").select("*").eq("user_id", user.id).single()

  if (!family) {
    redirect("/setup-profile")
  }

  return <MVPDashboard user={user} family={family} />
}
