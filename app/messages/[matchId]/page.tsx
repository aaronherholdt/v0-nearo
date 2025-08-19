import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, ArrowLeft, Users, Calendar, MessageCircle } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import MessageInput from "@/components/message-input"
import MessageBubble from "@/components/message-bubble"

interface ConversationPageProps {
  params: {
    matchId: string
  }
}

export default async function ConversationPage({ params }: ConversationPageProps) {
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

  // Get match details
  const { data: match } = await supabase
    .from("matches")
    .select(`
      *,
      family1:families!matches_family1_id_fkey (
        id,
        family_name,
        father_name,
        mother_name,
        children,
        interests,
        bio
      ),
      family2:families!matches_family2_id_fkey (
        id,
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
        end_date,
        description
      ),
      travel_plan2:travel_plans!matches_travel_plan2_id_fkey (
        title,
        destination,
        start_date,
        end_date,
        description
      )
    `)
    .eq("id", params.matchId)
    .eq("status", "accepted")
    .or(`family1_id.eq.${family.id},family2_id.eq.${family.id}`)
    .single()

  if (!match) {
    notFound()
  }

  // Get messages for this match
  const { data: messages } = await supabase
    .from("messages")
    .select(`
      *,
      sender_family:families!messages_sender_family_id_fkey (
        family_name
      )
    `)
    .eq("match_id", params.matchId)
    .order("created_at", { ascending: true })

  const otherFamily = match.family1_id === family.id ? match.family2 : match.family1
  const myTravelPlan = match.family1_id === family.id ? match.travel_plan1 : match.travel_plan2
  const otherTravelPlan = match.family1_id === family.id ? match.travel_plan2 : match.travel_plan1

  const parentNames = [otherFamily?.father_name, otherFamily?.mother_name].filter(Boolean).join(" & ")

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
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/messages">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Messages
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Chat Area */}
          <div className="lg:col-span-3">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-emerald-600" />
                  Conversation with {otherFamily?.family_name}
                </CardTitle>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages && messages.length > 0 ? (
                  messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isOwnMessage={message.sender_family_id === family.id}
                      senderName={message.sender_family?.family_name || "Unknown"}
                    />
                  ))
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Start the conversation!</h3>
                      <p className="text-gray-600 max-w-md">
                        Say hello to {otherFamily?.family_name} and start planning your meetup in{" "}
                        {otherTravelPlan?.destination}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>

              {/* Message Input */}
              <div className="border-t p-4">
                <MessageInput matchId={params.matchId} familyId={family.id} />
              </div>
            </Card>
          </div>

          {/* Family & Travel Info Sidebar */}
          <div className="space-y-6">
            {/* Other Family Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{otherFamily?.family_name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">{parentNames}</p>
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="h-4 w-4 mr-2" />
                  {otherFamily?.children?.length || 0} kids
                  {otherFamily?.children && otherFamily.children.length > 0 && (
                    <span className="ml-1">
                      (ages {otherFamily.children.map((child: any) => child.age).join(", ")})
                    </span>
                  )}
                </div>

                {otherFamily?.interests && otherFamily.interests.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Interests:</p>
                    <div className="flex flex-wrap gap-1">
                      {otherFamily.interests.map((interest: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {otherFamily?.bio && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">About:</p>
                    <p className="text-sm text-gray-600">{otherFamily.bio}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Travel Plans */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Travel Plans
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-emerald-50 p-3 rounded-lg">
                  <h4 className="font-medium text-emerald-800 mb-1">Your Trip</h4>
                  <p className="text-sm text-emerald-700">{myTravelPlan?.title}</p>
                  <p className="text-xs text-emerald-600">{myTravelPlan?.destination}</p>
                  <p className="text-xs text-emerald-600">
                    {format(new Date(myTravelPlan?.start_date), "MMM d")} -{" "}
                    {format(new Date(myTravelPlan?.end_date), "MMM d, yyyy")}
                  </p>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-1">Their Trip</h4>
                  <p className="text-sm text-blue-700">{otherTravelPlan?.title}</p>
                  <p className="text-xs text-blue-600">{otherTravelPlan?.destination}</p>
                  <p className="text-xs text-blue-600">
                    {format(new Date(otherTravelPlan?.start_date), "MMM d")} -{" "}
                    {format(new Date(otherTravelPlan?.end_date), "MMM d, yyyy")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
