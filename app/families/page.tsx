import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import FamilyList from "@/components/family-list"

export default async function FamiliesPage() {
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Families Near You</h1>
      <FamilyList />
    </div>
  )
}