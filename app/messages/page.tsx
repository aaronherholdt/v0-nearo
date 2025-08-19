import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { IconMapPin, IconMessageCircle, IconUsers } from "@tabler/icons-react"
import Link from "next/link"
import { format } from "date-fns"

export default async function MessagesPage() {
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

  // Get accepted matches with latest message info
  const { data: conversations } = await supabase
    .from("matches")
    .select(`
      *,
      family1:families!matches_family1_id_fkey (
        family_name,
        father_name,
        mother_name,
        children
      ),
      family2:families!matches_family2_id_fkey (
        family_name,
        father_name,
        mother_name,
        children
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
      ),
      messages (
        id,
        content,
        created_at,
        sender_family_id
      )
    `)
    .eq("status", "accepted")
    .or(`family1_id.eq.${family.id},family2_id.eq.${family.id}`)
    .order("created_at", { ascending: false })

  // Process conversations to get latest message and other family info
  const processedConversations =
    conversations?.map((match) => {
      const otherFamily = match.family1_id === family.id ? match.family2 : match.family1
      const myTravelPlan = match.family1_id === family.id ? match.travel_plan1 : match.travel_plan2
      const otherTravelPlan = match.family1_id === family.id ? match.travel_plan2 : match.travel_plan1

      // Get latest message
      const latestMessage =
        match.messages && match.messages.length > 0
          ? match.messages.sort(
              (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
            )[0]
          : null

      // Count unread messages (messages from other family)
      const unreadCount = match.messages?.filter((msg: any) => msg.sender_family_id !== family.id).length || 0

      return {
        matchId: match.id,
        otherFamily,
        myTravelPlan,
        otherTravelPlan,
        latestMessage,
        unreadCount,
        matchCreated: match.created_at,
      }
    }) || []

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
              <Link href="/discover" className="text-gray-600 hover:text-gray-900">
                Discover
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          <p className="text-lg text-gray-600 mt-1">Chat with connected homeschooling families</p>
        </div>

        {processedConversations.length > 0 ? (
          <div className="space-y-4">
            {processedConversations.map((conversation) => {
              const parentNames = [conversation.otherFamily?.father_name, conversation.otherFamily?.mother_name]
                .filter(Boolean)
                .join(" & ")

              return (
                <Card key={conversation.matchId} className="hover:shadow-md transition-shadow cursor-pointer">
                  <Link href={`/messages/${conversation.matchId}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                              <IconUsers size={20} className="mr-2 text-emerald-600" />
                              {conversation.otherFamily?.family_name}
                            </h3>
                            {conversation.unreadCount > 0 && (
                              <Badge className="bg-emerald-600">{conversation.unreadCount} new</Badge>
                            )}
                          </div>

                          <p className="text-sm text-gray-600 mb-3">
                            {parentNames} • {conversation.otherFamily?.children?.length || 0} kids
                          </p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                            <div className="bg-emerald-50 p-3 rounded-lg">
                              <p className="text-sm font-medium text-emerald-800">{conversation.myTravelPlan?.title}</p>
                              <p className="text-xs text-emerald-600">{conversation.myTravelPlan?.destination}</p>
                              <p className="text-xs text-emerald-600">
                                {format(new Date(conversation.myTravelPlan?.start_date), "MMM d")} -{" "}
                                {format(new Date(conversation.myTravelPlan?.end_date), "MMM d")}
                              </p>
                            </div>
                            <div className="bg-blue-50 p-3 rounded-lg">
                              <p className="text-sm font-medium text-blue-800">{conversation.otherTravelPlan?.title}</p>
                              <p className="text-xs text-blue-600">{conversation.otherTravelPlan?.destination}</p>
                              <p className="text-xs text-blue-600">
                                {format(new Date(conversation.otherTravelPlan?.start_date), "MMM d")} -{" "}
                                {format(new Date(conversation.otherTravelPlan?.end_date), "MMM d")}
                              </p>
                            </div>
                          </div>

                          {conversation.latestMessage ? (
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-gray-700 truncate flex-1 mr-4">
                                {conversation.latestMessage.sender_family_id === family.id ? "You: " : ""}
                                {conversation.latestMessage.content}
                              </p>
                              <p className="text-xs text-gray-500 whitespace-nowrap">
                                {format(new Date(conversation.latestMessage.created_at), "MMM d, h:mm a")}
                              </p>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-gray-500 italic">No messages yet - start the conversation!</p>
                              <p className="text-xs text-gray-500 whitespace-nowrap">
                                Connected {format(new Date(conversation.matchCreated), "MMM d")}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="ml-4">
                          <IconMessageCircle size={24} className="text-gray-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <IconMessageCircle size={96} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No conversations yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Connect with other families through the matches page to start chatting about your travel plans
            </p>
            <Button className="bg-emerald-600 hover:bg-emerald-700" asChild>
              <Link href="/matches">
                <IconUsers size={16} className="mr-2" />
                Find Matches
              </Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
