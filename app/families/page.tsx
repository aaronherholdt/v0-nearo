import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import FamilyList from "@/components/family-list"
import IconPageShell from "@/components/icon-page-shell"

export default async function FamiliesPage() {
  const supabase = await createClient()
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
    <IconPageShell contentClassName="flex flex-col">
      <div className="max-w-7xl mx-auto px-4 py-8 w-full">
        <h1 className="text-2xl font-bold mb-6">Families Near You</h1>
        <FamilyList />
      </div>
    </IconPageShell>
  )
}
