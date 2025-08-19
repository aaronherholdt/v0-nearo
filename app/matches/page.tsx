import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { IconMapPin, IconUsers, IconHeart, IconX, IconMessageCircle, IconClock } from "@tabler/icons-react"
import Link from "next/link"
import { format } from "date-fns"
import { acceptMatch, declineMatch } from "@/lib/actions"

export default async function MatchesPage() {
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

  // Get existing matches
  const { data: existingMatches } = await supabase
    .from("matches")
    .select(`
      *,
      family1:families!matches_family1_id_fkey (
        family_name,
        father_name,
        mother_name,
        children,
        interests,
        bio
      ),
      family2:families!matches_travel_plan2_id_fkey (
        family_name,
        father_name,
        mother_name,
        children,
        interests,
        bio
      ),
      travel_plan1:travel_plans!matches_travel_plan1_id_fkey (
        title,
        destination,
        start_date,
        end_date
      ),
      travel_plan2:travel_plans!matches_travel_plan2_id_fkey (
        title,
        destination,
        start_date,
        end_date
      )
    `)
    .or(`family1_id.eq.${family.id},family2_id.eq.${family.id}`)
    .order("created_at", { ascending: false })

  // Get potential matches (families with overlapping travel plans that aren't already matched)
  const { data: myTravelPlans } = await supabase
    .from("travel_plans")
    .select("*")
    .eq("family_id", family.id)
    .eq("is_active", true)

  let potentialMatches: any[] = []

  if (myTravelPlans && myTravelPlans.length > 0) {
    for (const myPlan of myTravelPlans) {
      const { data: overlappingPlans } = await supabase
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
            bio
          )
        `)
        .neq("family_id", family.id)
        .eq("is_active", true)
        .lte("start_date", myPlan.end_date)
        .gte("end_date", myPlan.start_date)

      if (overlappingPlans) {
        for (const otherPlan of overlappingPlans) {
          // Check if match already exists
          const matchExists = existingMatches?.some(
            (match) =>
              (match.family1_id === family.id && match.family2_id === otherPlan.families?.id) ||
              (match.family2_id === family.id && match.family1_id === otherPlan.families?.id),
          )

          if (!matchExists) {
            potentialMatches.push({
              myPlan,
              otherPlan,
              otherFamily: otherPlan.families,
            })
          }
        }
      }
    }
  }

  // Remove duplicates based on family ID
  potentialMatches = potentialMatches.filter(
    (match, index, self) => index === self.findIndex((m) => m.otherFamily?.id === match.otherFamily?.id),
  )

  // Separate matches by status
  const pendingMatches = existingMatches?.filter((match) => match.status === "pending") || []
  const acceptedMatches = existingMatches?.filter((match) => match.status === "accepted") || []
  const declinedMatches = existingMatches?.filter((match) => match.status === "declined") || []

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Matches</h1>
          <p className="text-lg text-gray-600 mt-1">
            Automatic recommendations based on your travel plans •
            <Link href="/discover" className="text-emerald-600 hover:text-emerald-700 ml-1">
              Search manually in Discover →
            </Link>
          </p>
          {potentialMatches.length > 0 && (
            <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-emerald-800 font-medium">
                🎉 Great! We found {potentialMatches.length} families you can connect with for your trip
              </p>
              <p className="text-emerald-700 text-sm mt-1">
                Review the matches below and send connection requests to families you'd like to meet
              </p>
            </div>
          )}
        </div>

        <Tabs defaultValue="potential" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="potential" className="flex items-center cursor-pointer">
              <IconHeart size={16} className="mr-2" />
              Potential ({potentialMatches.length})
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center cursor-pointer">
              <IconClock size={16} className="mr-2" />
              Pending ({pendingMatches.length})
            </TabsTrigger>
            <TabsTrigger value="connected" className="flex items-center cursor-pointer">
              <IconMessageCircle size={16} className="mr-2" />
              Connected ({acceptedMatches.length})
            </TabsTrigger>
            <TabsTrigger value="declined" className="flex items-center cursor-pointer">
              <IconX size={16} className="mr-2" />
              Declined ({declinedMatches.length})
            </TabsTrigger>
          </TabsList>

          {/* Potential Matches */}
          <TabsContent value="potential" className="space-y-6">
            {potentialMatches.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {potentialMatches.map((match, index) => (
                  <MatchCard
                    key={`${match.otherFamily?.id}-${index}`}
                    myPlan={match.myPlan}
                    otherPlan={match.otherPlan}
                    otherFamily={match.otherFamily}
                    myFamilyId={family.id}
                    showActions={true}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Heart}
                title="No potential matches yet"
                description="Add more travel plans or check back later as more families join"
              />
            )}
          </TabsContent>

          {/* Pending Matches */}
          <TabsContent value="pending" className="space-y-6">
            {pendingMatches.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pendingMatches.map((match) => {
                  const otherFamily = match.family1_id === family.id ? match.family2 : match.family1
                  const otherPlan = match.travel_plan1_id ? match.travel_plan2 : match.travel_plan1
                  const myPlan = match.travel_plan1_id ? match.travel_plan1 : match.travel_plan2

                  return (
                    <MatchCard
                      key={match.id}
                      myPlan={myPlan}
                      otherPlan={otherPlan}
                      otherFamily={otherFamily}
                      myFamilyId={family.id}
                      matchId={match.id}
                      status="pending"
                      showActions={false}
                    />
                  )
                })}
              </div>
            ) : (
              <EmptyState
                icon={Clock}
                title="No pending matches"
                description="Matches you've sent will appear here while waiting for responses"
              />
            )}
          </TabsContent>

          {/* Connected Matches */}
          <TabsContent value="connected" className="space-y-6">
            {acceptedMatches.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {acceptedMatches.map((match) => {
                  const otherFamily = match.family1_id === family.id ? match.family2 : match.family1
                  const otherPlan = match.travel_plan1_id ? match.travel_plan2 : match.travel_plan1
                  const myPlan = match.travel_plan1_id ? match.travel_plan1 : match.travel_plan2

                  return (
                    <MatchCard
                      key={match.id}
                      myPlan={myPlan}
                      otherPlan={otherPlan}
                      otherFamily={otherFamily}
                      myFamilyId={family.id}
                      matchId={match.id}
                      status="accepted"
                      showActions={false}
                    />
                  )
                })}
              </div>
            ) : (
              <EmptyState
                icon={MessageCircle}
                title="No connected families yet"
                description="Accepted matches will appear here so you can start planning meetups"
              />
            )}
          </TabsContent>

          {/* Declined Matches */}
          <TabsContent value="declined" className="space-y-6">
            {declinedMatches.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {declinedMatches.map((match) => {
                  const otherFamily = match.family1_id === family.id ? match.family2 : match.family1
                  const otherPlan = match.travel_plan1_id ? match.travel_plan2 : match.travel_plan1
                  const myPlan = match.travel_plan1_id ? match.travel_plan1 : match.travel_plan2

                  return (
                    <MatchCard
                      key={match.id}
                      myPlan={myPlan}
                      otherPlan={otherPlan}
                      otherFamily={otherFamily}
                      myFamilyId={family.id}
                      matchId={match.id}
                      status="declined"
                      showActions={false}
                    />
                  )
                })}
              </div>
            ) : (
              <EmptyState
                icon={X}
                title="No declined matches"
                description="Matches you've declined will appear here for reference"
              />
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

interface MatchCardProps {
  myPlan: any
  otherPlan: any
  otherFamily: any
  myFamilyId: string
  matchId?: string
  status?: string
  showActions: boolean
}

function MatchCard({ myPlan, otherPlan, otherFamily, myFamilyId, matchId, status, showActions }: MatchCardProps) {
  const parentNames = [otherFamily?.father_name, otherFamily?.mother_name].filter(Boolean).join(" & ")

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{otherFamily?.family_name}</CardTitle>
            <CardDescription>{parentNames}</CardDescription>
          </div>
          {status && (
            <Badge variant={status === "accepted" ? "default" : status === "pending" ? "secondary" : "outline"}>
              {status}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3">
          <div className="bg-emerald-50 p-3 rounded-lg">
            <h4 className="font-medium text-emerald-800 mb-1">Your Trip</h4>
            <p className="text-sm text-emerald-700">{myPlan?.title}</p>
            <p className="text-xs text-emerald-600">{myPlan?.destination}</p>
            <p className="text-xs text-emerald-600">
              {format(new Date(myPlan?.start_date), "MMM d")} - {format(new Date(myPlan?.end_date), "MMM d")}
            </p>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-1">Their Trip</h4>
            <p className="text-sm text-blue-700">{otherPlan?.title}</p>
            <p className="text-xs text-blue-600">{otherPlan?.destination}</p>
            <p className="text-xs text-blue-600">
              {format(new Date(otherPlan?.start_date), "MMM d")} - {format(new Date(otherPlan?.end_date), "MMM d")}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center">
            <IconUsers size={16} className="mr-1" />
            {otherFamily?.children?.length || 0} kids
            {otherFamily?.children && otherFamily.children.length > 0 && (
              <span className="ml-1">(ages {otherFamily.children.map((child: any) => child.age).join(", ")})</span>
            )}
          </div>
        </div>

        {otherFamily?.interests && otherFamily.interests.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Interests:</p>
            <div className="flex flex-wrap gap-1">
              {otherFamily.interests.slice(0, 4).map((interest: string, index: number) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {interest}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {otherFamily?.bio && <p className="text-sm text-gray-600 line-clamp-2">{otherFamily.bio}</p>}

        {showActions && (
          <div className="flex space-x-2 pt-2">
            <form action={acceptMatch} className="flex-1">
              <input type="hidden" name="family1_id" value={myFamilyId} />
              <input type="hidden" name="family2_id" value={otherFamily?.id} />
              <input type="hidden" name="travel_plan1_id" value={myPlan?.id} />
              <input type="hidden" name="travel_plan2_id" value={otherPlan?.id} />
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
                <IconHeart size={16} className="mr-2" />
                Connect
              </Button>
            </form>
            <form action={declineMatch}>
              <input type="hidden" name="family1_id" value={myFamilyId} />
              <input type="hidden" name="family2_id" value={otherFamily?.id} />
              <input type="hidden" name="travel_plan1_id" value={myPlan?.id} />
              <input type="hidden" name="travel_plan2_id" value={otherPlan?.id} />
              <Button type="submit" variant="outline" size="sm">
                <IconX size={16} />
              </Button>
            </form>
          </div>
        )}

        {status === "accepted" && (
          <Button className="w-full bg-blue-600 hover:bg-blue-700" asChild>
            <Link href={`/messages/${matchId}`}>
              <IconMessageCircle size={16} className="mr-2" />
              Send Message
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

interface EmptyStateProps {
  icon: any
  title: string
  description: string
}

function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <Icon size={96} className="text-gray-300 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 max-w-md mx-auto">{description}</p>
    </div>
  )
}
