import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import TravelPlanForm from "@/components/travel-plan-form"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function NewTravelPlanPage() {
  console.log("[v0] NewTravelPlanPage called")

  const supabase = createClient()

  let user
  try {
    const { data: userData, error: authError } = await supabase.auth.getUser()
    if (authError) {
      console.log("[v0] New page auth error:", authError)
      redirect("/auth/login")
    }
    user = userData.user
  } catch (error) {
    console.log("[v0] New page auth fetch failed:", error)
    redirect("/auth/login")
  }

  if (!user) {
    redirect("/auth/login")
  }

  let family
  try {
    const { data: familyData, error: familyError } = await supabase
      .from("families")
      .select("id")
      .eq("user_id", user.id)
      .single()
    if (familyError || !familyData) {
      console.log("[v0] New page family error:", familyError)
      redirect("/setup-profile")
    }
    family = familyData
  } catch (error) {
    console.log("[v0] New page family fetch failed:", error)
    redirect("/setup-profile")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/travel-plans">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Travel Plans
            </Link>
          </Button>
        </div>
        <TravelPlanForm />
      </div>
    </div>
  )
}
