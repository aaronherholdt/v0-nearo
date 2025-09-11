import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import SimpleProfileForm from "@/components/simple-profile-form"

export default async function SetupProfilePage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if profile already exists
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <SimpleProfileForm existingProfile={profile} />
    </div>
  )
}