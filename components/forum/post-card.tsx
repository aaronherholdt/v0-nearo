"use client"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

type Crosslinks = {
  overlaps?: number
  meetups?: number
  guides?: number
}

type PostCardProps = {
  id: string
  title: string
  author: string
  authorId: string
  date: string
  category: string
  excerpt?: string
  crosslinks?: Crosslinks
  cityLabel?: string | null
}

export default function PostCard({ id, title, author, authorId, date, category, excerpt, cityLabel }: PostCardProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [crosslinks, setCrosslinks] = useState<Crosslinks | null>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()
  
  // Check if thread is already saved by the user and get current user ID
  useEffect(() => {
    async function checkIfSaved() {
      try {
        const { data: userData } = await supabase.auth.getUser()
        if (!userData.user) return
        
        setCurrentUserId(userData.user.id)
        
        const { data } = await supabase
          .from("saved_threads")
          .select("id")
          .eq("user_id", userData.user.id)
          .eq("thread_id", id)
          .single()
        
        setIsSaved(!!data)
      } catch (error) {
        console.error("Error checking saved status:", error)
      }
    }
    
    checkIfSaved()
  }, [])

  // Fetch crosslinks data
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data, error } = await supabase.rpc('topic_crosslinks', { p_topic_id: id })
      if (!error && !cancelled) setCrosslinks(data ?? { overlaps: 0, meetups: 0, guides: 0 })
    })()
    return () => { cancelled = true }
  }, [id, supabase])
  
  async function handleSaveThread() {
    try {
      setIsSaving(true)
      
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        router.push("/auth/login")
        return
      }
      
      if (isSaved) {
        // Unsave the thread
        const { error } = await supabase
          .from("saved_threads")
          .delete()
          .eq("user_id", userData.user.id)
          .eq("thread_id", id)
        
        if (error) throw error
        setIsSaved(false)
        toast.success("Thread removed from saved")
      } else {
        // Save the thread
        const { error } = await supabase.from("saved_threads").insert({
          user_id: userData.user.id,
          thread_id: id,
          thread_title: title,
          author_name: author,
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
  
  function handleOpenThread() {
    router.push(`/forum/thread/${id}`)
  }
  
  function handleMessagePrivately() {
    router.push(`/chat/${authorId}`)
  }

  const showAny =
    (crosslinks?.overlaps ?? 0) > 0 ||
    (crosslinks?.meetups ?? 0) > 0 ||
    (crosslinks?.guides ?? 0) > 0

  return (
    <>
      <Card className="hover:shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="pr-4">
              <button className="font-medium hover:underline text-left" onClick={handleOpenThread}>
                {title}
              </button>
              <div className="text-sm text-gray-600 mt-1">
                {author} · {date}
                {cityLabel && (
                  <>
                    {" · "}
                    <span className="inline-flex items-center text-gray-700">
                      <Badge variant="outline" className="mr-1">City</Badge>
                      {cityLabel}
                    </span>
                  </>
                )}
                {" · "}
                <Badge variant="secondary" className="ml-0">{category}</Badge>
              </div>
              {excerpt && <p className="text-sm text-gray-700 mt-2 line-clamp-2">{excerpt}</p>}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
                onClick={handleOpenThread}
              >
                Open full thread
              </Button>
              {authorId !== currentUserId && (
                <Button
                  size="sm"
                  variant="outline"
                  className="cursor-pointer"
                  onClick={handleMessagePrivately}
                >
                  Message privately
                </Button>
              )}
              <Button
                size="sm"
                variant={isSaved ? "secondary" : "outline"}
                className="cursor-pointer"
                onClick={handleSaveThread}
                disabled={isSaving}
              >
                {isSaving ? "Processing..." : isSaved ? "Unsave thread" : "Save thread"}
              </Button>
            </div>
          </div>

          {showAny && (
            <div className="flex flex-wrap gap-2 mt-3">
              {(crosslinks?.overlaps ?? 0) > 0 && (
                <Chip label={`${crosslinks!.overlaps} families overlapping`} />
              )}
              {(crosslinks?.meetups ?? 0) > 0 && (
                <Chip label={`${crosslinks!.meetups} meetups this week`} />
              )}
              {(crosslinks?.guides ?? 0) > 0 && (
                <Chip label={`${crosslinks!.guides} hub guides`} />
              )}
            </div>
          )}
        </CardContent>
      </Card>


    </>
  )
}

function Chip({ label }: { label: string }) {
  return (
    <span className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 px-2 py-1 rounded">
      {label}
    </span>
  )
}