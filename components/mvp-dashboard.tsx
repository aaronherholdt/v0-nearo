"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  MapPin,
  Users,
  MessageCircle,
  Plus,
  Search,
  Shield,
  Edit,
  CheckCircle,
  Circle,
  ExternalLink,
  Calendar,
} from "lucide-react"
import { IconBell } from "@tabler/icons-react"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import TopSummary from "@/components/dashboard/TopSummary"
import PlaceRow from "@/components/place-row"
import SettingsSheet from "@/components/settings-sheet"
import Link from "next/link"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { fetchNotifications, markAllAsRead } from "@/utils/notifications"
import AvatarMenu from "@/components/avatar-menu"

interface DashboardProps {
  user: any
  family: any
}

interface TravelPlan {
  id: string
  title: string
  destination: string
  start_date: string
  end_date: string
  description: string
  latitude: number
  longitude: number
  is_active: boolean
  family_id: string
}

interface RecommendedPlace {
  destination: string
  count: number
  families: string[]
}

interface RecommendedFamily {
  id: string
  family_name: string
  family_photo_url?: string
  children: any[]
  interests: string[]
  homeschool_style: string
  travel_plans: TravelPlan[]
  match_score: number
}

export default function MVPDashboard({ user, family }: DashboardProps) {
  const [userTravelPlans, setUserTravelPlans] = useState<TravelPlan[]>([])
  const [recommendedPlaces, setRecommendedPlaces] = useState<{
    upcoming: RecommendedPlace[]
    next: RecommendedPlace[]
    future: RecommendedPlace[]
  }>({ upcoming: [], next: [], future: [] })
  const [recommendedFamilies, setRecommendedFamilies] = useState<{
    upcoming: RecommendedFamily[]
    next: RecommendedFamily[]
    future: RecommendedFamily[]
  }>({ upcoming: [], next: [], future: [] })
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function loadNotifications() {
      try {
        const userId = user?.id;
        if (!userId) return;
        
        const notifs = await fetchNotifications(userId);
        setNotifications(notifs);
        setUnreadCount(notifs.filter(n => !n.is_read).length);
      } catch (err) {
        console.error("Error loading notifications:", err);
      }
    }

    if (user?.id) {
      loadNotifications();
    }
  }, [user?.id]);

  useEffect(() => {
    async function fetchUserData() {
      if (!family?.id) return

      try {
        console.log("[v0] Fetching travel plans for family:", family.id)

        // Fetch user's travel plans
        const { data: travelPlans, error: travelError } = await supabase
          .from("travel_plans")
          .select("*")
          .eq("family_id", family.id)
          .eq("is_active", true)
          .order("start_date", { ascending: true })

        if (travelError) {
          console.error("[v0] Error fetching travel plans:", travelError)
          return
        }

        console.log("[v0] Found travel plans:", travelPlans?.length || 0)
        setUserTravelPlans(travelPlans || [])

        await fetchCachedRecommendations(family.id)
      } catch (error) {
        console.error("[v0] Error in fetchUserData:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()

    const subscription = supabase
      .channel("recommendation_updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "recommendation_cache",
          filter: `family_id=eq.${family?.id}`,
        },
        (payload) => {
          console.log("[v0] Recommendation cache updated:", payload)
          // Refetch recommendations when cache is updated
          fetchCachedRecommendations(family.id)
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "travel_plans",
          filter: `family_id=eq.${family?.id}`,
        },
        (payload) => {
          console.log("[v0] Travel plans updated:", payload)
          // Refetch travel plans when they change
          fetchUserData()
        },
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [family?.id, supabase])

  async function fetchCachedRecommendations(familyId: string) {
    try {
      console.log("[v0] Fetching cached recommendations for family:", familyId)

      const { data: existingRecs, error: checkError } = await supabase
        .from("recommendation_cache")
        .select("id")
        .eq("family_id", familyId)
        .limit(1)

      if (checkError) {
        console.error("[v0] Error checking existing recommendations:", checkError)
      }

      // If no recommendations exist, generate them
      if (!existingRecs || existingRecs.length === 0) {
        console.log("[v0] No cached recommendations found, generating new ones...")
        try {
          const response = await fetch("/api/generate-recommendations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ familyId }),
          })

          if (response.ok) {
            console.log("[v0] Successfully generated recommendations")
            // Wait a moment for the cache to be populated
            await new Promise((resolve) => setTimeout(resolve, 1000))
          }
        } catch (error) {
          console.error("[v0] Error generating recommendations:", error)
        }
      }

      // Fetch family recommendations from cache without trying to join tables
      const { data: familyRecs, error: familyError } = await supabase
        .from("recommendation_cache")
        .select("target_id, score, reasons")
        .eq("family_id", familyId)
        .eq("recommendation_type", "family_matches")
        .gt("valid_until", new Date().toISOString())
        .order("score", { ascending: false })
        .limit(9) // 3 per trip type

      if (familyError) {
        console.error("[v0] Error fetching family recommendations:", familyError)
      }

      let familyDetails = []
      if (familyRecs && familyRecs.length > 0) {
        const familyIds = familyRecs.map((rec) => rec.target_id).filter((id) => id)

        if (familyIds.length > 0) {
          const { data: families, error: familiesError } = await supabase
            .from("families")
            .select("id, family_name, family_photo_url, children, interests, homeschool_style")
            .in("id", familyIds)

          if (familiesError) {
            console.error("[v0] Error fetching family details:", familiesError)
          } else {
            familyDetails = families || []
          }
        }
      }

      // Fetch place recommendations from cache
      const { data: placeRecs, error: placeError } = await supabase
        .from("recommendation_cache")
        .select("*")
        .eq("family_id", familyId)
        .eq("recommendation_type", "place")
        .gt("valid_until", new Date().toISOString())
        .order("score", { ascending: false })
        .limit(9) // 3 per trip type

      if (placeError) {
        console.error("[v0] Error fetching place recommendations:", placeError)
      }

      // Transform cached data into the expected format
      const transformedFamilies = {
        upcoming: [],
        next: [],
        future: [],
      }

      const transformedPlaces = {
        upcoming: [],
        next: [],
        future: [],
      }

      if (familyRecs && familyDetails.length > 0) {
        const tripTypes = ["upcoming", "next", "future"]
        familyRecs.forEach((rec, index) => {
          const tripType = tripTypes[Math.floor(index / 3)] || "upcoming"
          const familyDetail = familyDetails.find((f) => f.id === rec.target_id)

          if (familyDetail && transformedFamilies[tripType].length < 3) {
            transformedFamilies[tripType].push({
              ...familyDetail,
              match_score: rec.score,
              travel_plans: [], // Will be populated if needed
            })
          }
        })
      }

      // Transform place recommendations
      if (placeRecs && placeRecs.length > 0) {
        const tripTypes = ["upcoming", "next", "future"]
        placeRecs.forEach((rec, index) => {
          const tripType = tripTypes[Math.floor(index / 3)] || "upcoming"
          if (transformedPlaces[tripType].length < 3) {
            transformedPlaces[tripType].push({
              destination: rec.reasons?.name || "Unknown Place",
              count: 1,
              families: [rec.reasons?.description || ""],
            })
          }
        })
      }

      setRecommendedFamilies(transformedFamilies)
      setRecommendedPlaces(transformedPlaces)

      console.log("[v0] Updated recommendations from cache:", {
        families: Object.values(transformedFamilies).flat().length,
        places: Object.values(transformedPlaces).flat().length,
      })
    } catch (error) {
      console.error("[v0] Error fetching cached recommendations:", error)
    }
  }

  const hasActiveTrip = userTravelPlans.length > 0
  const hasCompletedProfile =
    family?.family_name && (family?.father_name || family?.mother_name) && family?.children?.length > 0
  const hasMatches = Object.values(recommendedFamilies).some((families) => families.length > 0)

  const [nextTrip] = useState({
    destination: family?.next_trip?.destination || null,
    dates: family?.next_trip?.dates || null,
    daysLeft: family?.next_trip?.days_left || null,
  })

  const [showCreateTripTooltip, setShowCreateTripTooltip] = useState(false)

  const childrenDisplay = family?.children 
    ? family.children.map((child: any) => {
        const gender = child.gender === 'boy' ? 'boy' : 'girl';
        return `${gender} ${child.age}`;
      }).join(", ") 
    : "No children"
  const parentNames =
    family?.father_name && family?.mother_name
      ? `${family.father_name} & ${family.mother_name}`
      : family?.father_name || family?.mother_name || "Parent"

  const isNewUser = hasCompletedProfile && !hasActiveTrip

  useEffect(() => {
    if (isNewUser) {
      const timer = setTimeout(() => setShowCreateTripTooltip(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [isNewUser])

  const onboardingSteps = [
    { id: 1, title: "Create your family profile", completed: hasCompletedProfile, icon: CheckCircle },
    { id: 2, title: "Add a travel plan", completed: hasActiveTrip, icon: hasActiveTrip ? CheckCircle : Circle },
    { id: 3, title: "Connect with families", completed: hasMatches, icon: hasMatches ? CheckCircle : Circle },
  ]

  const completedSteps = onboardingSteps.filter((step) => step.completed).length

  const [safetyTasks] = useState([
    { id: 1, title: "Complete ID check", completed: true, link: "/safety/id-verification" },
    { id: 2, title: "Read meeting tips", completed: false, link: "/safety/meeting-tips" },
    { id: 3, title: "Enable check-in", completed: false, link: "/safety/check-in-setup" },
  ])

  const completedSafetyTasks = safetyTasks.filter((task) => task.completed).length

  const renderPlaceRecommendations = (places: RecommendedPlace[], tripType: string) => {
    if (places.length === 0) {
      return (
        <div className="text-center py-2">
          <p className="text-xs text-gray-500">No recommendations yet</p>
        </div>
      )
    }

    return (
      <div className="space-y-2">
        {places.slice(0, 2).map((place, index) => (
          <PlaceRow
            key={index}
            name={place.destination}
            // Extract place type from description if available
            type={place.families?.[0] || `${place.count} families visited`}
          />
        ))}
      </div>
    )
  }

  const renderFamilyRecommendations = (families: RecommendedFamily[], tripType: string) => {
    if (families.length === 0) {
      return (
        <div className="text-center py-2">
          <p className="text-xs text-gray-500">No matches yet</p>
        </div>
      )
    }

    const topFamily = families[0]
    return (
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Avatar className="h-6 w-6">
            {topFamily.family_photo_url ? (
              <AvatarImage src={topFamily.family_photo_url || "/placeholder.svg"} alt={topFamily.family_name} />
            ) : null}
            <AvatarFallback className="bg-purple-100 text-purple-700 text-xs">
              {topFamily.family_name[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-xs truncate">{topFamily.family_name}</p>
            <p className="text-xs text-gray-600">
              {topFamily.children?.length || 0} kids, {topFamily.match_score}% match
            </p>
          </div>
        </div>
        <Button size="sm" variant="outline" className="text-xs w-full bg-transparent cursor-pointer">
          View Match
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <MapPin className="h-6 w-6 text-emerald-600 mr-2" />
              <span className="text-xl font-bold text-emerald-600">FamilyConnect</span>
            </div>
            <div className="hidden md:flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2">
              <Search className="h-4 w-4 text-gray-500" />
              <input
                placeholder="Search families, places..."
                className="bg-transparent border-none outline-none text-sm w-64"
              />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="relative cursor-pointer" title="Notifications" aria-label="Open notifications">
                  <IconBell className="w-6 h-6 cursor-pointer" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="w-64 rounded bg-white shadow-lg p-2 text-sm z-50"
                  align="end"
                  sideOffset={8}
                >
                  {notifications.length === 0 ? (
                    <div className="p-2 text-gray-500">No notifications</div>
                  ) : (
                    <>
                      {notifications.map((n: any) => (
                        <DropdownMenu.Item
                          key={n.id}
                          className={`px-2 py-1 rounded hover:bg-gray-100 ${!n.is_read ? "font-semibold" : ""}`}
                          onSelect={() => {
                            // Navigate to n.link if provided
                            if (n.link) {
                              window.location.href = n.link;
                            }
                            // Optionally mark this notification as read here
                          }}
                        >
                          {n.message}
                          <div className="text-xs text-gray-400">{new Date(n.created_at).toLocaleString()}</div>
                        </DropdownMenu.Item>
                      ))}
                      <DropdownMenu.Separator className="my-1 border-t border-gray-200" />
                      <DropdownMenu.Item
                        className="px-2 py-1 text-center text-blue-600 hover:bg-gray-100"
                        onSelect={async () => {
                          if (user?.id) {
                            await markAllAsRead(user.id);
                            // update local state
                            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
                            setUnreadCount(0);
                          }
                        }}
                      >
                        Mark all as read
                      </DropdownMenu.Item>
                    </>
                  )}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
            <SettingsSheet user={user} family={family} />
            <AvatarMenu user={user} family={family} />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {completedSteps < 3 && (
          <Card className="mb-6 border-emerald-200 bg-emerald-50">
            <CardHeader>
              <CardTitle className="flex items-center text-emerald-800">
                <Users className="h-5 w-5 mr-2" />
                Get Started with FamilyConnect
              </CardTitle>
              <CardDescription className="text-emerald-700">
                Complete these steps to start connecting with homeschooling families during your travels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {onboardingSteps.map((step) => {
                  const Icon = step.icon
                  return (
                    <div key={step.id} className="flex items-center space-x-3">
                      <Icon className={`h-5 w-5 ${step.completed ? "text-emerald-600" : "text-gray-400"}`} />
                      <span
                        className={`${step.completed ? "text-emerald-800 line-through" : "text-emerald-700 font-medium"}`}
                      >
                        {step.title}
                      </span>
                      {step.id === 2 && !step.completed && (
                        <Link href="/travel-plans/new">
                          <Button size="sm" className="ml-auto bg-emerald-600 hover:bg-emerald-700 cursor-pointer">
                            Start Now
                          </Button>
                        </Link>
                      )}
                    </div>
                  )
                })}
              </div>
              <div className="mt-4 bg-white rounded-lg p-3">
                <div className="flex justify-between text-sm text-emerald-700 mb-2">
                  <span>Progress</span>
                  <span>{completedSteps}/3 completed</span>
                </div>
                <div className="w-full bg-emerald-200 rounded-full h-2">
                  <div
                    className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(completedSteps / 3) * 100}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Header Strip */}
        <div className="bg-gradient-to-r from-emerald-500 to-blue-500 rounded-lg p-6 text-white mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">Welcome, {family?.family_name || "Family"}!</h1>
              <p className="text-emerald-100">
                {hasActiveTrip
                  ? `🎯 ${userTravelPlans.length} active trip${userTravelPlans.length > 1 ? "s" : ""} • ${Object.values(recommendedFamilies).flat().length} family matches found • Real-time recommendations active`
                  : "🎯 Start by creating a trip to unlock family matches and personalized recommendations"}
              </p>
              {!hasActiveTrip && (
                <div className="mt-3 p-3 bg-white/10 rounded-lg border border-white/20">
                  <p className="text-emerald-100 text-sm font-medium">✨ Everything depends on having a travel plan:</p>
                  <ul className="text-emerald-200 text-sm mt-1 space-y-1">
                    <li>• See families traveling to your destinations</li>
                    <li>• Get personalized place recommendations</li>
                    <li>• Connect with families during overlapping dates</li>
                  </ul>
                </div>
              )}
            </div>
            <Link href="/setup-profile">
              <Button variant="secondary" size="sm" className="cursor-pointer">
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </Link>
          </div>
        </div>

        {/* Family Profile Summary */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <Avatar className="h-16 w-16">
                {family?.family_photo_url ? (
                  <AvatarImage
                    src={family.family_photo_url || "/placeholder.svg"}
                    alt={`${family.family_name} photo`}
                  />
                ) : null}
                <AvatarFallback className="bg-emerald-100 text-emerald-700 text-lg">
                  {family?.family_name?.[0] || "F"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-2">{family?.family_name}</h2>
                <p className="text-gray-600 mb-2">Parents: {parentNames}</p>
                <p className="text-gray-600 mb-2">Children: {childrenDisplay}</p>
                {family?.home_location_name && (
                  <p className="text-gray-600 mb-2">
                    Home: {family.home_location_name} • Radius: {family.radius_preference || 50} miles
                  </p>
                )}
                {family?.homeschool_style && (
                  <Badge variant="outline" className="mr-2">
                    {family.homeschool_style}
                  </Badge>
                )}
                {family?.interests && family.interests.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {family.interests.slice(0, 3).map((interest: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {family?.bio && <p className="text-gray-700 mt-4 italic">"{family.bio}"</p>}
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Recommendations */}
          <div className="lg:col-span-2">
            {/* Dashboard Headers */}
            <TopSummary />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">

              {/* Row 2 - Upcoming Trip */}
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-purple-600" />
                    Upcoming Trip
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {hasActiveTrip && userTravelPlans[0] ? (
                    <div className="space-y-2">
                      <p className="font-medium text-sm">{userTravelPlans[0].title}</p>
                      <p className="text-xs text-gray-600">{userTravelPlans[0].destination}</p>
                      <Badge variant="outline" className="text-xs">
                        {Math.ceil(
                          (new Date(userTravelPlans[0].start_date).getTime() - new Date().getTime()) /
                            (1000 * 60 * 60 * 24),
                        )}{" "}
                        days
                      </Badge>
                      <p className="text-xs text-gray-500">
                        {new Date(userTravelPlans[0].start_date).toLocaleDateString()} -{" "}
                        {new Date(userTravelPlans[0].end_date).toLocaleDateString()}
                      </p>
                      <Link href={`/travel-plans/${userTravelPlans[0].id}`}>
                        <Button size="sm" variant="outline" className="text-xs w-full bg-transparent cursor-pointer">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="text-center py-2">
                      <p className="text-xs text-gray-500">No upcoming trips</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-orange-600" />
                    Places for Upcoming Trip
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {hasActiveTrip && userTravelPlans[0] ? (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-600">For {userTravelPlans[0].destination}:</p>
                      {renderPlaceRecommendations(recommendedPlaces.upcoming, "upcoming")}
                    </div>
                  ) : (
                    <div className="text-center py-2">
                      <p className="text-xs text-gray-500">Plan a trip to see relevant places</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center">
                    <Users className="h-4 w-4 mr-2 text-purple-600" />
                    Families for Upcoming Trip
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {hasActiveTrip && userTravelPlans[0] ? (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-600">Traveling to {userTravelPlans[0].destination}:</p>
                      {renderFamilyRecommendations(recommendedFamilies.upcoming, "upcoming")}
                    </div>
                  ) : (
                    <div className="text-center py-2">
                      <p className="text-xs text-gray-500">Plan a trip to see matching families</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Row 3 - Next Trip */}
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-purple-600" />
                    Next Trip
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {userTravelPlans.length > 1 ? (
                    <div className="space-y-2">
                      <p className="font-medium text-sm">{userTravelPlans[1].title}</p>
                      <p className="text-xs text-gray-600">{userTravelPlans[1].destination}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(userTravelPlans[1].start_date).toLocaleDateString()}
                      </p>
                      <Link href={`/travel-plans/${userTravelPlans[1].id}`}>
                        <Button size="sm" variant="outline" className="text-xs w-full bg-transparent cursor-pointer">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="text-center py-2">
                      <p className="text-xs text-gray-500 mb-2">Plan your next adventure</p>
                      <Link href="/travel-plans/new">
                        <Button size="sm" variant="outline" className="text-xs bg-transparent cursor-pointer">
                          <Plus className="h-3 w-3 mr-1" />
                          Add Trip
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-orange-600" />
                    Places for Next Trip
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {userTravelPlans.length > 1 ? (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-600">For {userTravelPlans[1].destination}:</p>
                      {renderPlaceRecommendations(recommendedPlaces.next, "next")}
                    </div>
                  ) : (
                    <div className="text-center py-2">
                      <p className="text-xs text-gray-500">Plan next trip to see places</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center">
                    <Users className="h-4 w-4 mr-2 text-purple-600" />
                    Families for Next Trip
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {userTravelPlans.length > 1 ? (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-600">Traveling to {userTravelPlans[1].destination}:</p>
                      {renderFamilyRecommendations(recommendedFamilies.next, "next")}
                    </div>
                  ) : (
                    <div className="text-center py-2">
                      <p className="text-xs text-gray-500">Plan next trip to see families</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Row 4 - Future Trip */}
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-purple-600" />
                    Future Trip
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {userTravelPlans.length > 2 ? (
                    <div className="space-y-2">
                      <p className="font-medium text-sm">{userTravelPlans[2].title}</p>
                      <p className="text-xs text-gray-600">{userTravelPlans[2].destination}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(userTravelPlans[2].start_date).toLocaleDateString()}
                      </p>
                      <Link href={`/travel-plans/${userTravelPlans[2].id}`}>
                        <Button size="sm" variant="outline" className="text-xs w-full bg-transparent cursor-pointer">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="text-center py-2">
                      <p className="text-xs text-gray-500 mb-2">Plan future adventures</p>
                      <Link href="/travel-plans/new">
                        <Button size="sm" variant="outline" className="text-xs bg-transparent cursor-pointer">
                          <Plus className="h-3 w-3 mr-1" />
                          Add Trip
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-orange-600" />
                    Places for Future Trip
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {userTravelPlans.length > 2 ? (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-600">For {userTravelPlans[2].destination}:</p>
                      {renderPlaceRecommendations(recommendedPlaces.future, "future")}
                    </div>
                  ) : (
                    <div className="text-center py-2">
                      <p className="text-xs text-gray-500">Plan future trip to see places</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center">
                    <Users className="h-4 w-4 mr-2 text-purple-600" />
                    Families for Future Trip
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {userTravelPlans.length > 2 ? (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-600">Traveling to {userTravelPlans[2].destination}:</p>
                      {renderFamilyRecommendations(recommendedFamilies.future, "future")}
                    </div>
                  ) : (
                    <div className="text-center py-2">
                      <p className="text-xs text-gray-500">Plan future trip to see families</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Column - Requests & Safety */}
          <div className="space-y-6">
            {/* Requests & Messages */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageCircle className="h-5 w-5 mr-2 text-orange-600" />
                  Requests & Messages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">No messages yet</p>
                  <p className="text-sm text-gray-400 mb-4">Start connecting with families to see messages here</p>
                </div>
                <Link href="/messages">
                  <Button variant="outline" className="w-full mt-4 bg-transparent cursor-pointer" size="sm">
                    View All Messages
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-green-600" />
                    Safety Checklist
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {completedSafetyTasks}/{safetyTasks.length}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Complete all tasks to earn a Verified badge and build trust with other families
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {safetyTasks.map((task) => (
                    <Link key={task.id} href={task.link}>
                      <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                        <div className="flex items-center space-x-3">
                          {task.completed ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Circle className="h-4 w-4 text-gray-400" />
                          )}
                          <span
                            className={`text-sm ${task.completed ? "line-through text-gray-500" : "text-gray-700"}`}
                          >
                            {task.title}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {task.completed ? (
                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                              Done
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              Pending
                            </Badge>
                          )}
                          <ExternalLink className="h-3 w-3 text-gray-400" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Safety Progress</span>
                    <span>{Math.round((completedSafetyTasks / safetyTasks.length) * 100)}% complete</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(completedSafetyTasks / safetyTasks.length) * 100}%` }}
                    />
                  </div>
                  {completedSafetyTasks === safetyTasks.length && (
                    <div className="flex items-center justify-center mt-2 text-green-700">
                      <Shield className="h-4 w-4 mr-1" />
                      <span className="text-sm font-medium">Verified Family!</span>
                    </div>
                  )}
                </div>

                <Link href="/safety" className="cursor-pointer">
                  <Button variant="outline" className="w-full mt-4 bg-transparent cursor-pointer" size="sm">
                    <Shield className="h-4 w-4 mr-2" />
                    Safety Center
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
