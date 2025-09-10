import ContextComposer from "@/components/forum/context-composer"
import PostCard from "@/components/forum/post-card"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function TripsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: topics } = await supabase
    .from("forum_topics")
    .select("id, title, category, created_at, author_family_name, author_id, meta")
    .eq("category", "trips")
    .order("created_at", { ascending: false })
    .limit(20)

  return (
    <>
      <ContextComposer />
      <div className="space-y-3">
        {(topics || []).map((t) => (
          <PostCard
            key={t.id}
            id={String(t.id)}
            title={t.title}
            author={t.author_family_name || "Family"}
            authorId={String(t.author_id)}
            date={new Date(t.created_at).toLocaleDateString()}
            category={t.category}
            cityLabel={t.meta?.city_id || null}
            crosslinks={{ overlaps: 3, meetups: 2 }}
          />
        ))}
        {(!topics || topics.length === 0) && (
          <div className="text-sm text-gray-600 p-4 border rounded-md">No trip discussions yet. Try a starter like "Anyone in Rome in June?"</div>
        )}
      </div>
    </>
  )
}


