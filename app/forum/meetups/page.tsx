import ContextComposer from "@/components/forum/context-composer"
import PostCard from "@/components/forum/post-card"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function MeetupsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  // Compute "today" for filtering upcoming meetups
  const today = new Date().toISOString().split("T")[0]  // "2025-11-13"

  // Get user's location information for filtering
  const { data: profile } = await supabase
    .from("profiles")
    .select("standard_city, standard_country")
    .eq("id", user.id)
    .single()
    
  // Get all meetups
  const { data: topics } = await supabase
    .from("forum_topics")
    .select("id, title, category, created_at, author_family_name, author_id, meta, meetup_date")
    .eq("category", "meetups")
    .eq("meetup_status", "upcoming")
    .gte("meetup_date", today)
    .order("meetup_date", { ascending: true })
    .limit(50)

  // Sort topics to prioritize those in the user's city
  const sortedTopics = [...(topics || [])].sort((a, b) => {
    // If user has a city set, prioritize meetups in that city
    if (profile?.standard_city) {
      const aInUserCity = a.meta?.city_id === profile.standard_city
      const bInUserCity = b.meta?.city_id === profile.standard_city

      if (aInUserCity && !bInUserCity) return -1
      if (!aInUserCity && bInUserCity) return 1
    }

    // Otherwise sort by meetup date (soonest first)
    const aDate = a.meetup_date || a.created_at
    const bDate = b.meetup_date || b.created_at
    return new Date(aDate).getTime() - new Date(bDate).getTime()
  })
  
  return (
    <>
      <ContextComposer />

      {profile?.standard_city && (
        <div className="mb-4 p-3 bg-emerald-50 rounded-md text-sm">
          <p className="text-emerald-800">
            Showing meetups near <strong>{profile.standard_city}</strong> first
          </p>
        </div>
      )}
      
      <div className="space-y-3">
        {sortedTopics.map((t) => (
          <PostCard
            key={t.id}
            id={String(t.id)}
            title={t.title}
            author={t.author_family_name || "Family"}
            authorId={String(t.author_id)}
            date={new Date(t.meetup_date || t.created_at).toLocaleDateString()}
            category={t.category}
            cityLabel={t.meta?.city_id || null}
            crosslinks={{ meetups: 2 }}
          />
        ))}
        {(!topics || topics.length === 0) && (
          <div className="text-sm text-gray-600 p-4 border rounded-md">No meetups yet. Try a starter like "Friday park day at 3pm?"</div>
        )}
      </div>
    </>
  )
}


