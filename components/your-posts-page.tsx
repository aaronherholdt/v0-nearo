"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageSquare, Trash2, Edit } from "lucide-react"
import { createClientComponentClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"

type ForumPost = {
  id: string
  title: string
  body: string
  category: string
  created_at: string
  reply_count?: number
}

interface YourPostsPageProps {
  user: any
  profile: any
  posts: ForumPost[]
}

export default function YourPostsPage({ user, profile, posts }: YourPostsPageProps) {
  const [userPosts, setUserPosts] = useState<ForumPost[]>(posts)
  const router = useRouter()
  const supabase = createClientComponentClient()

  async function handleDelete(postId: string) {
    try {
      // optional: guard
      if (!confirm("Delete this post? This cannot be undone.")) return

      const { data, error } = await supabase
        .from("forum_topics")
        .delete()
        .eq("id", postId)
        .select("id")        // <-- forces returning rows

      if (error) throw error
      if (!data?.length) throw new Error("Not permitted or already deleted")

      // remove from local list immediately
      setUserPosts(prev => prev.filter(p => p.id !== postId))

      toast.success("Post deleted")
      router.refresh()      // refresh RSC so right-rails update on nav
    } catch (err: any) {
      toast.error(err.message ?? "Failed to delete")
    }
  }

  function handleOpenThread(threadId: string) {
    router.push(`/forum/thread/${threadId}`)
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-blue-500 rounded-lg p-6 text-white mb-6">
        <div className="flex items-center">
          <MessageSquare className="h-6 w-6 mr-2" />
          <h1 className="text-2xl font-bold">Your Posts</h1>
        </div>
        <p className="text-emerald-100 mt-2">
          View and manage discussions you've started
        </p>
      </div>

      {/* Posts List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Forum Posts</CardTitle>
        </CardHeader>
        <CardContent>
          {userPosts.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 mx-auto text-gray-300" />
              <p className="mt-4 text-gray-500">You haven't created any posts yet</p>
              <Link href="/forum">
                <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700">Start a Discussion</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {userPosts.map((post) => (
                <Card key={post.id} className="hover:shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="pr-4">
                        <h3 className="font-medium hover:underline cursor-pointer" onClick={() => handleOpenThread(post.id)}>
                          {post.title}
                        </h3>
                        <div className="text-sm text-gray-600 mt-1">
                          Posted on {formatDate(post.created_at)} · 
                          <span className="ml-2 text-emerald-600">{post.category}</span>
                          {post.reply_count !== undefined && (
                            <span className="ml-2">{post.reply_count} {post.reply_count === 1 ? 'reply' : 'replies'}</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 mt-2 line-clamp-2">{post.body}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer text-sm px-3 py-1 h-8"
                          onClick={() => handleOpenThread(post.id)}
                        >
                          View thread
                        </Button>
                        <Link href={`/forum/thread/${post.id}/edit`}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="cursor-pointer"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </Link>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(post.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

