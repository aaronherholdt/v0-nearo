import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import YourPostsPage from "@/components/your-posts-page"

export default async function YourPosts() {
  const supabase = createClient()
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

  // Fetch user's posts with reply count
  const { data: posts } = await supabase
    .from("forum_topics")
    .select(`
      id,
      title,
      body,
      category,
      created_at,
      replies:forum_replies(count)
    `)
    .eq("author_id", user.id)
    .order("created_at", { ascending: false })

  // Process the reply counts
  const processedPosts = posts?.map(post => ({
    ...post,
    reply_count: post.replies?.[0]?.count || 0
  })) || []

  return <YourPostsPage user={user} profile={profile} posts={processedPosts} />
}
