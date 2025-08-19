import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { IconMapPin, IconSearch, IconX } from "@tabler/icons-react"
import Link from "next/link"
import DiscoveryFilters from "@/components/discovery-filters"
import FamilyTravelCard from "@/components/family-travel-card"

interface DiscoverPageProps {
  searchParams: {
    location?: string
    start_date?: string
    end_date?: string
    min_age?: string
    max_age?: string
    interests?: string
    homeschool_style?: string
  }
}

export default async function DiscoverPage({ searchParams }: DiscoverPageProps) {
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

  // Build query for travel plans with filters
  let query = supabase
    .from("travel_plans")
    .select(`
      *,
      families (
        id,
        family_name,
        father_name,
        mother_name,
        children,
        interests,
        bio,
        homeschool_style,
        family_photo_url
      )
    `)
    .neq("family_id", family.id)
    .eq("is_active", true)
    .gte("end_date", new Date().toISOString().split("T")[0]) // Only future/current trips

  if (Object.keys(searchParams).length === 0) {
    // Get user's travel plans to show relevant families by default
    const { data: myTravelPlans } = await supabase
      .from("travel_plans")
      .select("destination")
      .eq("family_id", family.id)
      .eq("is_active", true)

    if (myTravelPlans && myTravelPlans.length > 0) {
      const myLocations = myTravelPlans.map((plan) => plan.destination).filter(Boolean)
      if (myLocations.length > 0) {
        // Show families traveling to similar locations
        query = query.or(myLocations.map((location) => `destination.ilike.%${location}%`).join(","))
      }
    }
  } else {
    // Apply user filters when searching
    if (searchParams.location) {
      query = query.ilike("destination", `%${searchParams.location}%`)
    }

    if (searchParams.start_date) {
      query = query.gte("start_date", searchParams.start_date)
    }

    if (searchParams.end_date) {
      query = query.lte("end_date", searchParams.end_date)
    }
  }

  const { data: travelPlans } = await query.order("start_date", { ascending: true })

  // Filter by family criteria (kids ages, interests, homeschool style)
  let filteredPlans = travelPlans || []

  if (searchParams.min_age || searchParams.max_age) {
    const minAge = searchParams.min_age ? Number.parseInt(searchParams.min_age) : 0
    const maxAge = searchParams.max_age ? Number.parseInt(searchParams.max_age) : 100

    filteredPlans = filteredPlans.filter((plan) => {
      const children = plan.families?.children || []
      return children.some((child: any) => {
        const age = Number.parseInt(child.age)
        return age >= minAge && age <= maxAge
      })
    })
  }

  if (searchParams.interests) {
    const searchInterests = searchParams.interests
      .toLowerCase()
      .split(",")
      .map((i) => i.trim())
    filteredPlans = filteredPlans.filter((plan) => {
      const familyInterests = plan.families?.interests || []
      return searchInterests.some((searchInterest) =>
        familyInterests.some((familyInterest: string) => familyInterest.toLowerCase().includes(searchInterest)),
      )
    })
  }

  if (searchParams.homeschool_style) {
    filteredPlans = filteredPlans.filter((plan) => plan.families?.homeschool_style === searchParams.homeschool_style)
  }

  // Get existing matches to avoid showing already connected families
  const { data: existingMatches } = await supabase
    .from("matches")
    .select("family1_id, family2_id")
    .or(`family1_id.eq.${family.id},family2_id.eq.${family.id}`)

  const matchedFamilyIds = new Set(existingMatches?.flatMap((match) => [match.family1_id, match.family2_id]) || [])

  // Filter out already matched families
  const availablePlans = filteredPlans.filter((plan) => !matchedFamilyIds.has(plan.families?.id))

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
              <Link href="/travel-plans" className="text-gray-600 hover:text-gray-900">
                Travel Plans
              </Link>
              <Link href="/matches" className="text-gray-600 hover:text-gray-900">
                Matches
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Discover Families</h1>
          <p className="text-lg text-gray-600 mt-1">
            {Object.keys(searchParams).length === 0
              ? "Browse families traveling to destinations similar to yours, or search for specific locations"
              : "Find homeschooling families traveling to destinations around the world"}
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <DiscoveryFilters searchParams={searchParams} />
        </div>

        {/* Results */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {availablePlans.length} {availablePlans.length === 1 ? "family" : "families"} found
            </p>
            {Object.keys(searchParams).length > 0 && (
              <Button variant="outline" size="sm" asChild>
                <Link href="/discover">
                  <IconX size={16} className="mr-2" />
                  Clear Filters
                </Link>
              </Button>
            )}
          </div>
        </div>

        {availablePlans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availablePlans.map((plan) => (
              <FamilyTravelCard key={plan.id} travelPlan={plan} family={plan.families} currentFamilyId={family.id} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <IconSearch size={96} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {Object.keys(searchParams).length === 0
                ? "No families found in similar destinations"
                : "No families found"}
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {Object.keys(searchParams).length > 0
                ? "Try adjusting your search filters to find more families"
                : "Try searching for specific destinations or check back later as more families join"}
            </p>
            {Object.keys(searchParams).length > 0 && (
              <Button className="bg-emerald-600 hover:bg-emerald-700" asChild>
                <Link href="/discover">
                  <IconSearch size={16} className="mr-2" />
                  Browse All Families
                </Link>
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
