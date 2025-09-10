import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Flame } from "lucide-react"
import ContextComposer from "@/components/forum/context-composer"
import PostCard from "@/components/forum/post-card"

export default async function ForumPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Ensure profile exists
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (!profile) {
    redirect("/setup-profile")
  }

  // Lightweight server-side pulls; deeper queries happen on client pages as needed
  // Only show general topics, exclude trips and meetups which have their own pages
  const { data: latestTopics } = await supabase
    .from("forum_topics")
    .select("id, title, category, created_at, author_family_name, author_id")
    .neq("category", "trips")
    .neq("category", "meetups")
    .order("created_at", { ascending: false })
    .limit(6)

  return (
    <>

      <ContextComposer />

      <div className="space-y-3">
        {(latestTopics || []).map((t) => (
          <PostCard
            key={t.id}
            id={String(t.id)}
            title={t.title}
            author={t.author_family_name || "Family"}
            authorId={t.author_id}
            date={new Date(t.created_at).toLocaleDateString()}
            category={t.category}
            crosslinks={{ overlaps: 3, meetups: 1, guides: 2 }}
          />
        ))}
        {(!latestTopics || latestTopics.length === 0) && (
          <Card>
            <CardContent className="p-4 text-sm text-gray-600">
              No discussions yet. Start one above!
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}


