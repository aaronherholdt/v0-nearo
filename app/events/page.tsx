import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Users, Edit } from "lucide-react"

export default async function EventsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/auth/login")
  }

  // Fetch user's created meetups
  const { data: createdMeetups } = await supabase
    .from("forum_topics")
    .select(`
      id, 
      title, 
      body,
      created_at,
      meta,
      author_id,
      author_family_name
    `)
    .eq("category", "meetups")
    .eq("author_id", user.id)
    .order("created_at", { ascending: false })

  // Fetch user's RSVPed meetups
  const { data: rsvps } = await supabase
    .from("meetup_rsvps")
    .select("meetup_id")
    .eq("user_id", user.id)

  const rsvpMeetupIds = rsvps?.map(rsvp => rsvp.meetup_id) || []
  
  // Filter out meetups that the user created (to avoid duplicates)
  const createdMeetupIds = (createdMeetups || []).map(meetup => meetup.id)
  const filteredRsvpIds = rsvpMeetupIds.filter(id => !createdMeetupIds.includes(id))
  
  // Fetch RSVPed meetup details
  const { data: rsvpedMeetups } = filteredRsvpIds.length > 0 ? await supabase
    .from("forum_topics")
    .select(`
      id, 
      title, 
      body,
      created_at,
      meta,
      author_id,
      author_family_name
    `)
    .in("id", filteredRsvpIds)
    .order("created_at", { ascending: false })
  : { data: [] }

  // For each meetup, get the RSVP count
  const addRsvpCounts = async (meetups) => {
    return Promise.all((meetups || []).map(async (meetup) => {
      const { count } = await supabase
        .from("meetup_rsvps")
        .select("id", { count: 'exact', head: true })
        .eq("meetup_id", meetup.id)
      
      return {
        ...meetup,
        rsvp_count: count || 0
      }
    }))
  }
  
  const createdMeetupsWithCounts = await addRsvpCounts(createdMeetups)
  const rsvpedMeetupsWithCounts = await addRsvpCounts(rsvpedMeetups)
  
  // Check if there are no events at all
  const hasNoEvents = createdMeetupsWithCounts.length === 0 && rsvpedMeetupsWithCounts.length === 0

  // If no events at all, show empty state
  if (hasNoEvents) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Your Events</h1>
        <Card>
          <CardContent className="p-6 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p className="text-gray-600 mb-4">You don't have any events yet.</p>
            <Link href="/forum/meetups">
              <Button className="bg-emerald-600 hover:bg-emerald-700">Browse Meetups</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Helper function to render meetup cards
  const renderMeetupCard = (meetup, isCreatedByUser = false) => (
    <Card key={meetup.id} className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg">{meetup.title}</CardTitle>
        <div className="text-sm text-gray-600">
          By {meetup.author_family_name || "Unknown"}
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="mb-4 line-clamp-2 text-sm text-gray-700">
          {meetup.body}
        </div>
        
        <div className="space-y-2">
          {meetup.meta?.place_id && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span>{meetup.meta.place_id}</span>
            </div>
          )}
          {meetup.meta?.time && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span>{meetup.meta.time}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-gray-500" />
            <span>{meetup.rsvp_count} {meetup.rsvp_count === 1 ? 'person' : 'people'} attending</span>
          </div>
        </div>
        
        <div className="mt-4 flex gap-2">
          <Link href={`/forum/thread/${meetup.id}`} className="flex-1">
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white transition-colors duration-200 cursor-pointer text-sm py-2 px-3 h-auto">View Details</Button>
          </Link>
          {isCreatedByUser && (
            <Link href={`/forum/thread/${meetup.id}/edit`} className="flex-shrink-0">
              <Button size="sm" variant="outline" className="cursor-pointer">
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Your Events</h1>
      
      {createdMeetupsWithCounts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Events You Created</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {createdMeetupsWithCounts.map(meetup => renderMeetupCard(meetup, true))}
          </div>
        </div>
      )}
      
      {rsvpedMeetupsWithCounts.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Events You're Attending</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rsvpedMeetupsWithCounts.map(meetup => renderMeetupCard(meetup, false))}
          </div>
        </div>
      )}
    </div>
  )
}
