import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import SavedThreadsPage from "@/components/saved-threads-page"
import IconPageShell from "@/components/icon-page-shell"

export default async function SavedPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if profile exists
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (!profile) {
    redirect("/setup-profile")
  }

  // Fetch saved threads including the live thread metadata for categorisation
  const { data: savedThreads } = await supabase
    .from("saved_threads")
    .select(`
      id,
      user_id,
      thread_id,
      thread_title,
      author_name,
      created_at,
      thread:forum_topics (
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
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <IconPageShell contentClassName="flex flex-col">
      <SavedThreadsPage
        user={user}
        profile={profile}
        savedThreads={savedThreads || []}
      />
    </IconPageShell>
  )
}
