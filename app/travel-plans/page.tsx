import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { IconMapPin, IconPlus, IconCalendar, IconEdit } from "@tabler/icons-react"
import Link from "next/link"
import { format } from "date-fns"

export default async function TravelPlansPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get family profile
  const { data: family } = await supabase.from("families").select("*").eq("user_id", user.id).single()

  if (!family) {
    redirect("/setup-profile")
  }

  // Get travel plans
  const { data: travelPlans } = await supabase
    .from("travel_plans")
    .select("*")
    .eq("family_id", family.id)
    .order("start_date", { ascending: true })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <IconMapPin size={32} className="text-emerald-600 mr-2" />
                <span className="text-2xl font-bold text-emerald-600">FamilyConnect</span>
              </Link>
            </div>
            <nav className="flex items-center space-x-4">
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
              <Link href="/matches" className="text-gray-600 hover:text-gray-900">
                Matches
              </Link>
              <Link href="/discover" className="text-gray-600 hover:text-gray-900">
                Discover
              </Link>
              <Link href="/messages" className="text-gray-600 hover:text-gray-900">
                Messages
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Travel Plans</h1>
            <p className="text-lg text-gray-600 mt-1">Manage your family's travel itinerary</p>
          </div>
          <Button className="bg-emerald-600 hover:bg-emerald-700" asChild>
            <Link href="/travel-plans/new">
              <IconPlus size={16} className="mr-2" />
              Add Travel Plan
            </Link>
          </Button>
        </div>

        {/* Travel Plans Grid */}
        {travelPlans && travelPlans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {travelPlans.map((plan) => (
              <Card key={plan.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center">
                        <IconMapPin size={20} className="text-emerald-600 mr-2" />
                        {plan.title}
                      </CardTitle>
                      <CardDescription className="mt-1">{plan.destination}</CardDescription>
                    </div>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/travel-plans/${plan.id}/edit`}>
                          <IconEdit size={16} />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <IconCalendar size={16} className="mr-2" />
                      {format(new Date(plan.start_date), "MMM d")} - {format(new Date(plan.end_date), "MMM d, yyyy")}
                    </div>
                    {plan.description && <p className="text-sm text-gray-700 line-clamp-3">{plan.description}</p>}
                    <div className="flex justify-between items-center pt-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          plan.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {plan.is_active ? "Active" : "Inactive"}
                      </span>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/travel-plans/${plan.id}`}>View Details</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <IconMapPin size={96} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No travel plans yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Start by adding your first travel destination to connect with other homeschooling families
            </p>
            <Button className="bg-emerald-600 hover:bg-emerald-700" asChild>
              <Link href="/travel-plans/new">
                <IconPlus size={16} className="mr-2" />
                Add Your First Travel Plan
              </Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
