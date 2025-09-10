import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import ThreadPage from "@/components/forum/thread-page"

export default async function ForumThreadPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  
  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch the thread
  const { data: thread, error } = await supabase
    .from("forum_topics")
    .select(`
      *,
      author:author_id(id, family_name, family_photo_url)
    `)
    .eq("id", params.id)
    .single()

  if (error || !thread) {
    notFound()
  }

  // Fetch replies
  const { data: replies } = await supabase
    .from("forum_replies")
    .select(`
      *,
      author:author_id(id, family_name, family_photo_url)
    `)
    .eq("topic_id", params.id)
    .order("created_at", { ascending: true })

  return <ThreadPage thread={thread} replies={replies || []} currentUser={user} />
}
