import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import TravelPlanForm from "@/components/travel-plan-form"
import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EditTravelPlanPageProps {
  params: {
    id: string
  }
}

export default async function EditTravelPlanPage({ params }: EditTravelPlanPageProps) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get family profile
  const { data: family } = await supabase.from("families").select("id").eq("user_id", user.id).single()

  if (!family) {
    redirect("/setup-profile")
  }

  // Get travel plan
  const { data: travelPlan } = await supabase
    .from("travel_plans")
    .select("*")
    .eq("id", params.id)
    .eq("family_id", family.id)
    .single()

  if (!travelPlan) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-center">
          <Button variant="ghost" asChild className="mb-4">
            <Link href={`/travel-plans/${params.id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Travel Plan
            </Link>
          </Button>
          <Button variant="ghost" asChild className="mb-4 cursor-pointer">
            <Link href="/">
              Move to Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
        <TravelPlanForm
          initialData={{
            title: travelPlan.title,
            description: travelPlan.description || "",
            destination: travelPlan.destination,
            latitude: travelPlan.latitude,
            longitude: travelPlan.longitude,
            start_date: travelPlan.start_date,
            end_date: travelPlan.end_date,
            is_active: travelPlan.is_active,
          }}
        />
      </div>
    </div>
  )
}
