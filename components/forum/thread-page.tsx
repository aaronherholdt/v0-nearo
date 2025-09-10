"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Bookmark, ArrowLeft, Calendar, MapPin, Users } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"

interface ThreadPageProps {
  thread: any
  replies: any[]
  currentUser: any
}

export default function ThreadPage({ thread, replies, currentUser }: ThreadPageProps) {
  const [newReply, setNewReply] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [threadReplies, setThreadReplies] = useState(replies)
  const [isSaved, setIsSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isRsvped, setIsRsvped] = useState(false)
  const [isRsvping, setIsRsvping] = useState(false)
  const [rsvpCount, setRsvpCount] = useState(0)
  const router = useRouter()
  const supabase = createClientComponentClient()

  // Check if thread is saved and RSVP status
  useEffect(() => {
    async function checkStatuses() {
      if (!currentUser) return
      
      try {
        // Check saved status
        const { data: savedData } = await supabase
          .from("saved_threads")
          .select("id")
          .eq("user_id", currentUser.id)
          .eq("thread_id", thread.id)
          .single()
        
        setIsSaved(!!savedData)
        
        // Check RSVP status if it's a meetup
        if (thread.category === 'meetups') {
          const { data: rsvpData } = await supabase
            .from("meetup_rsvps")
            .select("id")
            .eq("user_id", currentUser.id)
            .eq("meetup_id", thread.id)
            .single()
          
          setIsRsvped(!!rsvpData)
          
          // Get RSVP count
          const { count } = await supabase
            .from("meetup_rsvps")
            .select("id", { count: 'exact', head: true })
            .eq("meetup_id", thread.id)
          
          setRsvpCount(count || 0)
        }
      } catch (error) {
        console.error("Error checking statuses:", error)
      }
    }
    
    checkStatuses()
  }, [])

  async function handleSubmitReply() {
    if (!newReply.trim()) return
    setIsSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error("Please sign in to reply")
        router.push("/auth/login")
        return
      }

      const { data, error } = await supabase
        .from("forum_replies")
        .insert({
          topic_id: thread.id,
          author_id: user.id,
          content: newReply.trim()
        })
        .select(`
          *,
          author:author_id(id, family_name, family_photo_url)
        `)
        .single()

      if (error) {
        console.error("Error posting reply:", {
          message: error.message,
          code: error.code,
          details: (error as any).details,
          hint: (error as any).hint
        })
        toast.error(error.message || "Failed to post reply")
        return
      }

      setThreadReplies((prev) => [...prev, data!])
      setNewReply("")
      toast.success("Reply posted")

      // Fire a notification to the thread author (if not self-reply)
      try {
        const threadAuthorId = thread?.author?.id || thread?.author_id
        if (threadAuthorId && threadAuthorId !== user.id) {
          const preview = newReply.trim().slice(0, 120)
          const { error: notifError } = await supabase
            .from("notifications")
            .insert({
              user_id: threadAuthorId,
              title: "New reply to your thread",
              body: `${data?.author?.family_name || "Someone"} replied: ${preview}`,
              link: `/forum/thread/${thread.id}`,
              type: "forum",
              category: thread?.category || "general",
            })

          if (notifError) {
            console.error("Failed to create notification:", {
              message: notifError.message,
              code: notifError.code,
              details: (notifError as any).details,
              hint: (notifError as any).hint,
            })
          } else {
            // Nudge any listeners in this tab immediately
            try {
              window.dispatchEvent(new CustomEvent('notifications:changed'))
              localStorage.setItem('notifications:changed', String(Date.now()))
            } catch {}
          }
        }
      } catch (e: any) {
        console.error("Unexpected error creating notification:", e)
      }
    } catch (err: any) {
      console.error("Error posting reply (catch):", {
        message: err?.message,
        code: err?.code,
        details: err?.details,
        hint: err?.hint
      })
      toast.error(err?.message ?? "Failed to post reply")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSaveThread() {
    if (!currentUser) {
      router.push("/auth/login")
      return
    }

    try {
      setIsSaving(true)
      
      if (isSaved) {
        // Unsave the thread
        const { error } = await supabase
          .from("saved_threads")
          .delete()
          .eq("user_id", currentUser.id)
          .eq("thread_id", thread.id)
        
        if (error) throw error
        setIsSaved(false)
        toast.success("Thread removed from saved")
      } else {
        // Save the thread
        const { error } = await supabase.from("saved_threads").insert({
          user_id: currentUser.id,
          thread_id: thread.id,
          thread_title: thread.title,
          author_name: thread.author?.family_name || "Unknown",
          created_at: new Date().toISOString()
        })
        
        if (error) throw error
        setIsSaved(true)
        toast.success("Thread saved successfully")
      }
    } catch (error) {
      console.error("Error saving/unsaving thread:", error)
      toast.error("Failed to save/unsave thread")
    } finally {
      setIsSaving(false)
    }
  }

  function handleMessageAuthor() {
    if (!thread.author?.id) {
      toast.error("Cannot message this user")
      return
    }
    
    router.push(`/chat/${thread.author.id}`)
  }
  
  async function handleRsvp() {
    if (!currentUser) {
      router.push("/auth/login")
      return
    }

    try {
      setIsRsvping(true)
      
      if (isRsvped) {
        // Cancel RSVP
        const { error } = await supabase
          .from("meetup_rsvps")
          .delete()
          .eq("user_id", currentUser.id)
          .eq("meetup_id", thread.id)
        
        if (error) throw error
        setIsRsvped(false)
        setRsvpCount(prev => Math.max(0, prev - 1))
        toast.success("RSVP cancelled")
      } else {
        // Create RSVP
        const { error } = await supabase.from("meetup_rsvps").insert({
          user_id: currentUser.id,
          meetup_id: thread.id,
          created_at: new Date().toISOString()
        })
        
        if (error) throw error
        setIsRsvped(true)
        setRsvpCount(prev => prev + 1)
        toast.success("RSVP confirmed")
      }
    } catch (error) {
      console.error("Error with RSVP:", error)
      toast.error("Failed to update RSVP")
    } finally {
      setIsRsvping(false)
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-4">
        <Link href="/forum">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to forum
          </Button>
        </Link>
      </div>
      
      {/* Thread */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">{thread.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Top row: Author and timestamp */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center text-sm text-gray-600">
              <div className="flex items-center">
                <Avatar className="h-6 w-6 mr-2">
                  <AvatarFallback>
                    {thread.author?.family_name?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <span>{thread.author?.family_name || "Unknown"}</span>
              </div>
              <span className="mx-2">•</span>
              <span>{formatDate(thread.created_at)}</span>
            </div>
            <Badge variant="secondary">{thread.category}</Badge>
          </div>

          {/* Post content */}
          <div className="prose max-w-none mb-4">
            <p className="whitespace-pre-wrap">{thread.body}</p>
          </div>

          {/* Meetup details if applicable */}
          {thread.category === 'meetups' && thread.meta && (
            <div className="mb-4 p-3 bg-gray-50 rounded-md">
              <div className="text-sm font-medium mb-2">Meetup Details</div>
              <div className="space-y-2">
                {thread.meta.place_id && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span>{thread.meta.place_id}</span>
                  </div>
                )}
                {thread.meta.time && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>{thread.meta.time}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span>{rsvpCount} {rsvpCount === 1 ? 'person' : 'people'} attending</span>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-2 border-t border-gray-100">
            <Button
              variant={isSaved ? "secondary" : "outline"}
              size="sm"
              className="cursor-pointer"
              onClick={handleSaveThread}
              disabled={isSaving}
            >
              <Bookmark className="h-4 w-4 mr-1" />
              {isSaving ? "Processing..." : isSaved ? "Saved" : "Save thread"}
            </Button>
            {thread.author?.id !== currentUser?.id && (
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={handleMessageAuthor}
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                Message author
              </Button>
            )}
            {thread.category === 'meetups' && (
              <Button
                variant={isRsvped ? "secondary" : "default"}
                size="sm"
                className={`cursor-pointer ${!isRsvped ? "bg-emerald-600 hover:bg-emerald-700" : ""}`}
                onClick={handleRsvp}
                disabled={isRsvping}
              >
                <Calendar className="h-4 w-4 mr-1" />
                {isRsvping ? "Processing..." : isRsvped ? "Cancel RSVP" : "RSVP"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Replies */}
      <h2 className="text-xl font-semibold mb-4">Replies</h2>
      {threadReplies.length === 0 ? (
        <Card className="mb-6">
          <CardContent className="p-6 text-center text-gray-500">
            <MessageCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No replies yet. Be the first to reply!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 mb-6">
          {threadReplies.map((reply) => (
            <Card key={reply.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {reply.author?.family_name?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{reply.author?.family_name || "Unknown"}</div>
                      <div className="text-sm text-gray-500">{formatDate(reply.created_at)}</div>
                    </div>
                    <div className="mt-2 whitespace-pre-wrap">{reply.content}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Reply form */}
      <Card>
        <CardHeader>
          <CardTitle>Add a reply</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Write your reply..."
            value={newReply}
            onChange={(e) => setNewReply(e.target.value)}
            rows={4}
          />
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button 
            onClick={handleSubmitReply}
            disabled={isSubmitting || !newReply.trim()}
            className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
          >
            {isSubmitting ? "Posting..." : "Post Reply"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
