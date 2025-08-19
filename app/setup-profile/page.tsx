import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import FamilyProfileForm from "@/components/family-profile-form"

export default async function SetupProfilePage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if family profile already exists
  const { data: family } = await supabase.from("families").select("*").eq("user_id", user.id).single()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <FamilyProfileForm existingFamily={family} />
    </div>
  )
}
