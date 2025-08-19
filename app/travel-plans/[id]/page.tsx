import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Calendar, Edit, ArrowLeft, ArrowRight, Users } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

interface TravelPlanPageProps {
  params: {
    id: string
  }
}

export default async function TravelPlanPage({ params }: TravelPlanPageProps) {
  if (params.id === "new") {
    redirect("/travel-plans/new")
  }

  console.log("[v0] TravelPlanPage called with ID:", params.id)

  const supabase = createClient()

  let user
  try {
    const { data: userData, error: authError } = await supabase.auth.getUser()
    if (authError) {
      console.log("[v0] Auth error:", authError)
      redirect("/auth/login")
    }
    user = userData.user
  } catch (error) {
    console.log("[v0] Auth fetch failed:", error)
    redirect("/auth/login")
  }

  if (!user) {
    redirect("/auth/login")
  }

  let family
  try {
    const { data: familyData, error: familyError } = await supabase
      .from("families")
      .select("*")
      .eq("user_id", user.id)
      .single()
    if (familyError) {
      console.log("[v0] Family fetch error:", familyError)
      redirect("/setup-profile")
    }
    family = familyData
  } catch (error) {
    console.log("[v0] Family fetch failed:", error)
    redirect("/setup-profile")
  }

  if (!family) {
    redirect("/setup-profile")
  }

  let travelPlan
  try {
    const { data: planData, error: planError } = await supabase
      .from("travel_plans")
      .select("*")
      .eq("id", params.id)
      .eq("family_id", family.id)
      .single()

    if (planError || !planData) {
      console.log("[v0] Travel plan fetch error:", planError)
      notFound()
    }
    travelPlan = planData
  } catch (error) {
    console.log("[v0] Travel plan fetch failed:", error)
    notFound()
  }

  let potentialMatches = []
  try {
    const { data: matchesData } = await supabase
      .from("travel_plans")
      .select(`
        *,
        families (
          family_name,
          father_name,
          mother_name,
          children,
          interests
        )
      `)
      .neq("family_id", family.id)
      .eq("is_active", true)
      .lte("start_date", travelPlan.end_date)
      .gte("end_date", travelPlan.start_date)

    potentialMatches = matchesData || []
  } catch (error) {
    console.log("[v0] Matches fetch failed:", error)
    // Continue without matches if this fails
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <MapPin className="h-8 w-8 text-emerald-600 mr-2" />
                <span className="text-2xl font-bold text-emerald-600">FamilyConnect</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-center">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/travel-plans">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Travel Plans
            </Link>
          </Button>
          <Button variant="ghost" asChild className="mb-4 cursor-pointer">
            <Link href="/">
              Move to Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Travel Plan Details */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl flex items-center">
                      <MapPin className="h-6 w-6 text-emerald-600 mr-2" />
                      {travelPlan.title}
                    </CardTitle>
                    <CardDescription className="text-lg mt-1">{travelPlan.destination}</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={travelPlan.is_active ? "default" : "secondary"}>
                      {travelPlan.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/travel-plans/${travelPlan.id}/edit`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-5 w-5 mr-2" />
                  <span className="font-medium">
                    {format(new Date(travelPlan.start_date), "MMMM d, yyyy")} -{" "}
                    {format(new Date(travelPlan.end_date), "MMMM d, yyyy")}
                  </span>
                </div>

                {travelPlan.description && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{travelPlan.description}</p>
                  </div>
                )}

                {(travelPlan.latitude !== 0 || travelPlan.longitude !== 0) && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Coordinates</h3>
                    <p className="text-gray-600">
                      Latitude: {travelPlan.latitude}, Longitude: {travelPlan.longitude}
                    </p>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Created</h3>
                  <p className="text-gray-600">{format(new Date(travelPlan.created_at), "MMMM d, yyyy 'at' h:mm a")}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Potential Matches Sidebar */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Potential Matches
                </CardTitle>
                <CardDescription>Families traveling to similar locations during overlapping dates</CardDescription>
              </CardHeader>
              <CardContent>
                {potentialMatches && potentialMatches.length > 0 ? (
                  <div className="space-y-4">
                    {potentialMatches.slice(0, 5).map((match) => (
                      <div key={match.id} className="border rounded-lg p-3 hover:bg-gray-50">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900">{match.families?.family_name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {match.families?.children?.length || 0} kids
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 mb-1">{match.title}</p>
                        <p className="text-sm text-gray-500 mb-2">{match.destination}</p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(match.start_date), "MMM d")} - {format(new Date(match.end_date), "MMM d")}
                        </p>
                        {(match.families?.father_name || match.families?.mother_name) && (
                          <p className="text-xs text-gray-600 mb-1">
                            Parents:{" "}
                            {[match.families?.father_name, match.families?.mother_name].filter(Boolean).join(" & ")}
                          </p>
                        )}
                        {match.families?.interests && match.families.interests.length > 0 && (
                          <div className="mt-2">
                            <div className="flex flex-wrap gap-1">
                              {match.families.interests.slice(0, 3).map((interest, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {interest}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        <Button size="sm" className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700">
                          Connect
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No matching families found yet</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Check back later as more families add their travel plans
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
