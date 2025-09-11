"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bookmark, MessageCircle, Trash2 } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"

type SavedThread = {
  id: string
  user_id: string
  thread_id: string
  thread_title: string
  author_name: string
  created_at: string
}

interface SavedThreadsPageProps {
  user: any
  profile: any
  savedThreads: SavedThread[]
}

export default function SavedThreadsPage({ user, profile, savedThreads }: SavedThreadsPageProps) {
  const [threads, setThreads] = useState<SavedThread[]>(savedThreads)
  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({})
  const router = useRouter()
  const supabase = createClientComponentClient()

  async function handleRemove(threadId: string, savedId: string) {
    try {
      setIsDeleting(prev => ({ ...prev, [savedId]: true }))
      
      const { error } = await supabase
        .from("saved_threads")
        .delete()
        .eq("id", savedId)
      
      if (error) throw error
      
      setThreads(threads.filter(thread => thread.id !== savedId))
      toast.success("Thread removed from saved")
    } catch (error) {
      console.error("Error removing saved thread:", error)
      toast.error("Failed to remove thread")
    } finally {
      setIsDeleting(prev => ({ ...prev, [savedId]: false }))
    }
  }

  function handleOpenThread(threadId: string) {
    router.push(`/forum/thread/${threadId}`)
  }

  function handleMessageAuthor(threadId: string) {
    // This would need to be updated to get the author's ID
    // For now, we'll redirect to the thread page
    router.push(`/forum/thread/${threadId}`)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-blue-500 rounded-lg p-6 text-white mb-6">
        <div className="flex items-center">
          <Bookmark className="h-6 w-6 mr-2" />
          <h1 className="text-2xl font-bold">Saved Threads</h1>
        </div>
        <p className="text-emerald-100 mt-2">
          View and manage your saved discussions
        </p>
      </div>

      {/* Saved Threads List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Saved Threads</CardTitle>
        </CardHeader>
        <CardContent>
          {threads.length === 0 ? (
            <div className="text-center py-8">
              <Bookmark className="h-12 w-12 mx-auto text-gray-300" />
              <p className="mt-4 text-gray-500">You haven't saved any threads yet</p>
              <Link href="/forum">
                <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700">Browse Forum</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {threads.map((thread) => (
                <Card key={thread.id} className="hover:shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="pr-4">
                        <h3 className="font-medium hover:underline cursor-pointer" onClick={() => handleOpenThread(thread.thread_id)}>
                          {thread.thread_title}
                        </h3>
                        <div className="text-sm text-gray-600 mt-1">
                          Posted by {thread.author_name} · Saved on {new Date(thread.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="cursor-pointer"
                          onClick={() => handleOpenThread(thread.thread_id)}
                        >
                          Open thread
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="cursor-pointer"
                          onClick={() => handleMessageAuthor(thread.thread_id)}
                        >
                          <MessageCircle className="h-4 w-4 mr-1" />
                          Message
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleRemove(thread.thread_id, thread.id)}
                          disabled={isDeleting[thread.id]}
                        >
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
