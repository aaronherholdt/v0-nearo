import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import ContextComposer from "@/components/forum/context-composer"
import PostCard from "@/components/forum/post-card"

type ForumPageProps = {
  searchParams: { tab?: string }
}

type HomeTab = "feed" | "discussion"

export default async function ForumPage({ searchParams }: ForumPageProps) {
  const supabase = await createClient()
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

  const tabParam = searchParams?.tab
  const activeTab: HomeTab = tabParam === "discussion" ? "discussion" : "feed"

  // Lightweight server-side pulls; deeper queries happen on client pages as needed
  let topicsQuery = supabase
    .from("forum_topics")
    .select(`
      id,
      title,
      body,
      category,
      kind,
      created_at,
      author_family_name,
      author_id,
      meta,
      likes:topic_likes(count),
      replies:forum_replies(count)
    `)

  if (activeTab === "discussion") {
    topicsQuery = topicsQuery.eq("kind", "discussion").in("category", ["general"])
  } else {
    topicsQuery = topicsQuery.eq("kind", "feed").in("category", ["general"])
  }

  const { data: topics } = await topicsQuery
    .order("created_at", { ascending: false })
    .limit(6)

  const composerTitle = activeTab === "feed" ? "Post something" : "Start a discussion"
  const composerSection = activeTab === "discussion" ? "Discussion" : "General"
  const emptyMessage =
    activeTab === "discussion"
      ? "No discussions yet. Start one above!"
      : "No feed posts yet. Share something above!"

  return (
    <>
      <ContextComposer
        titleOverride={composerTitle}
        compact
        sectionOverride={composerSection}
      />

      <div className="space-y-3">
        {activeTab === "discussion" && (
          <Card>
            <CardContent className="p-3 text-sm text-gray-600">
              Looking to chat about anything travel or relocation related? Keep it here.
              Trips and meetups have dedicated spaces so your plans stay tidy.
            </CardContent>
          </Card>
        )}

        {(topics || []).map((t) => {
          const meta = (t as any)?.meta ?? {}
          const media = Array.isArray(meta?.media) ? meta.media : undefined
          const linkPreview = meta?.link_preview ?? undefined
          const cityLabel = meta?.city_id ?? null
          const likes = Array.isArray((t as any)?.likes) ? (t as any).likes?.[0]?.count ?? 0 : 0
          const replies = Array.isArray((t as any)?.replies) ? (t as any).replies?.[0]?.count ?? 0 : 0
          return (
            <PostCard
              key={t.id}
              id={String(t.id)}
              title={t.title}
              author={t.author_family_name || "Family"}
              authorId={t.author_id}
              date={new Date(t.created_at).toLocaleDateString()}
              category={t.category}
              body={t.body}
              kind={(t as any)?.kind ?? (activeTab === "discussion" ? "discussion" : "feed")}
              media={media}
              linkPreview={linkPreview}
              replyCount={replies}
              likeCount={likes}
              cityLabel={cityLabel}
            />
          )
        })}
        {(!topics || topics.length === 0) && (
          <Card>
            <CardContent className="p-4 text-sm text-gray-600">
              {emptyMessage}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}
