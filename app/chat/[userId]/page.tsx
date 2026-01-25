"use client"

import { use, useEffect, useRef, useState, useTransition } from "react"

const PAGE_SIZE = 50
import { createClientComponentClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Send } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { sendMessage as sendMessageAction } from "@/lib/supabaseClient"
import ChatListPane from "../components/chat-list-pane"
import AppIconNav from "@/components/app-icon-nav"

interface ChatPageProps {
  params: Promise<{
    userId: string
  }>
}

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
  is_read: boolean
}

interface Profile {
  id: string
  family_name: string
}

export default function ChatPage({ params }: ChatPageProps) {
  const resolvedParams = use(params)
  const otherUserId = resolvedParams.userId
  const [currentUserId, setCurrentUserId] = useState<string>("")
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState("")
  const [otherProfile, setOtherProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [prefersCoarsePointer, setPrefersCoarsePointer] = useState(() => {
    if (typeof window === "undefined") return false
    return window.matchMedia("(pointer: coarse)").matches
  })
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [oldestLoadedAt, setOldestLoadedAt] = useState<string | null>(null)
  const [isSending, startTransition] = useTransition()
  const endRef = useRef<HTMLDivElement | null>(null)
  const router = useRouter()
  
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (typeof window === "undefined") return

    const mediaQuery = window.matchMedia("(pointer: coarse)")
    const updatePointerPreference = () => setPrefersCoarsePointer(mediaQuery.matches)

    updatePointerPreference()
    mediaQuery.addEventListener("change", updatePointerPreference)

    return () => {
      mediaQuery.removeEventListener("change", updatePointerPreference)
    }
  }, [])

  // Get current user and other user's profile
  useEffect(() => {
    async function fetchUserData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push("/auth/login")
          return
        }
        
        setCurrentUserId(user.id)
        
        // Get other user's profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", otherUserId)
          .single()
        
        setOtherProfile(profile || null)
        
        // Load initial messages
        await loadMessages(user.id, otherUserId)
      } catch (error) {
        console.error("Error fetching user data:", error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchUserData()
  }, [otherUserId, router, supabase])
  
  // Load messages
  async function loadMessages(
    userId: string,
    otherId: string,
    options?: { before?: string | null; append?: boolean }
  ) {
    const { before = null, append = false } = options ?? {}

    try {
      let query = supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${userId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${userId})`
        )
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE)

      if (before) {
        // Keyset pagination: load messages older than the oldest we already have
        query = query.lt("created_at", before)
      }

      const { data, error } = await query

      if (error) {
        console.error("Error loading messages:", error)
        return
      }

      const rawMessages = data || []
      // We ordered DESC for efficient pagination; reverse back to ascending for display
      const newMessages = [...rawMessages].reverse()

      setMessages(prev =>
        append ? [...newMessages, ...prev] : newMessages
      )

      if (newMessages.length > 0) {
        const oldest = newMessages[0]
        setOldestLoadedAt(oldest.created_at)
      }

      // If we got a full page, assume there may be more; if not, we've hit the beginning
      setHasMore(rawMessages.length === PAGE_SIZE)

      // Mark all messages in this conversation as read in one go
      try {
        const { error: markError } = await supabase.rpc("mark_conversation_read", {
          p_viewer: userId,
          p_other: otherId,
        })
        if (markError) {
          console.error("Error marking conversation read:", markError)
        } else {
          // Notify navbar / badges to refresh counts
          try {
            window.dispatchEvent(new CustomEvent("messages:changed"))
            localStorage.setItem("messages:changed", Date.now().toString())
          } catch (_) {}
        }
      } catch (err) {
        console.error("Error calling mark_conversation_read:", err)
      }
    } catch (error) {
      console.error("Error in loadMessages:", error)
    }
  }

  async function handleLoadMore() {
    if (!currentUserId || !otherUserId || !oldestLoadedAt) return

    setLoadingMore(true)
    try {
      await loadMessages(currentUserId, otherUserId, {
        before: oldestLoadedAt,
        append: true,
      })
    } finally {
      setLoadingMore(false)
    }
  }

  // Set up realtime subscription for new messages
  useEffect(() => {
    if (!currentUserId || !otherUserId) return
    
    const channel = supabase
      .channel(`chat-${currentUserId}-${otherUserId}`)
      .on("postgres_changes", 
        { event: "INSERT", schema: "public", table: "messages", filter: `receiver_id=eq.${currentUserId}` },
        async (payload) => {
          const newMessage = payload.new as Message
          if (newMessage.sender_id === otherUserId) {
            setMessages(prev => [...prev, newMessage])

            // We don't write here anymore – that happens via mark_conversation_read
            // We can still notify navbar so it refreshes unread counts from the DB
            try {
              window.dispatchEvent(new CustomEvent("messages:changed"))
              localStorage.setItem("messages:changed", Date.now().toString())
            } catch (_) {}
          }
        }
      )
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId, otherUserId, supabase])
  
  // Scroll to bottom when messages change
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])
  
  // Send message via server action
  async function sendMessage() {
    const trimmedText = text.trim()
    if (!trimmedText || !currentUserId || !otherUserId) return

    // Clear the input immediately for better UX
    setText("")

    startTransition(async () => {
      try {
        // Build FormData for the server action
        const formData = new FormData()
        formData.append("receiver_id", otherUserId)
        formData.append("content", trimmedText)

        const result = await sendMessageAction(formData)

        if (result && "error" in result && result.error) {
          console.error("Error from sendMessage action:", result.error)
          // If you want, you could show a toast here instead of silently failing
          return
        }

        // Only append the message after the server confirms it was saved
        const optimisticMessage: Message = {
          id:
            globalThis.crypto?.randomUUID?.() ||
            Math.random().toString(36).slice(2),
          sender_id: currentUserId,
          receiver_id: otherUserId,
          content: trimmedText,
          created_at: new Date().toISOString(),
          is_read: true,
        }

        setMessages(prev => [...prev, optimisticMessage])

        // Notify navbar in case the other side is the same account/device (edge case)
        try {
          window.dispatchEvent(new CustomEvent("messages:changed"))
          localStorage.setItem("messages:changed", Date.now().toString())
        } catch (_) {}
      } catch (error) {
        console.error("Error in sendMessage:", error)
      }
    })
  }

  if (!loading && !currentUserId) {
    return null
  }

  return (
    <div className="flex min-h-[calc(100vh-var(--app-header-height,4rem))] bg-background md:h-[calc(100vh-var(--app-header-height,4rem))]">
      <AppIconNav />
      <div className="flex min-h-[calc(100vh-var(--app-header-height,4rem))] w-full flex-col md:h-[calc(100vh-var(--app-header-height,4rem))] md:min-h-0 md:flex-row md:overflow-hidden">
        <div className="flex flex-col border-b border-border md:h-full md:min-h-0 md:w-[340px] md:border-b-0 md:border-r">
          <ChatListPane activeUserId={otherUserId} />
        </div>
        <div className="flex flex-1 min-h-0 flex-col">
          <div className="flex items-center justify-between border-b border-border px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <Link href="/chat" className="md:hidden">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="text-left">
              <p className="text-sm font-semibold md:text-base">
                {otherProfile?.family_name || "Family"}
              </p>
              <p className="text-xs text-muted-foreground md:text-sm">Direct messages</p>
            </div>
          </div>
          <Link href={`/families/${otherUserId}`}>
            <Button variant="outline" size="sm" className="hidden md:inline-flex">
              View profile
            </Button>
          </Link>
        </div>

        <div className="flex flex-1 min-h-0 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-6 md:px-6">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-sm text-muted-foreground">
                <p>No messages yet. Say hello!</p>
              </div>
            ) : (
              <>
                {hasMore && (
                  <div className="mb-4 flex justify-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                    >
                      {loadingMore ? "Loading…" : "Load earlier messages"}
                    </Button>
                  </div>
                )}

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender_id === currentUserId
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${
                        message.sender_id === currentUserId
                          ? "bg-emerald-600 text-white"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      <p>{message.content}</p>
                      <span className="mt-2 block text-[11px] font-medium opacity-70">
                        {new Date(message.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </>
            )}
            <div ref={endRef} />
          </div>

          <div className="border-t border-border bg-background px-4 py-4 md:px-6">
            <div className="flex items-end gap-2">
              <Textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey && !prefersCoarsePointer) {
                    event.preventDefault()
                    sendMessage()
                  }
                }}
                enterKeyHint={prefersCoarsePointer ? "newline" : "send"}
                placeholder="Type a message..."
                className="flex-1 resize-none rounded-2xl border border-input bg-background px-4 py-3 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-100 md:text-base"
                rows={2}
                disabled={loading}
              />
              <Button
                onClick={sendMessage}
                disabled={!text.trim() || loading || isSending}
                className="rounded-full bg-emerald-600 px-4 text-white hover:bg-emerald-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  )
}
