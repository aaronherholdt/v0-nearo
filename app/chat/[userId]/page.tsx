"use client"

import { useEffect, useRef, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Send } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { use } from "react"

interface ChatPageProps {
  params: {
    userId: string
  }
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
  const endRef = useRef<HTMLDivElement | null>(null)
  const router = useRouter()
  
  const supabase = createClientComponentClient()

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
  async function loadMessages(userId: string, otherId: string) {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${userId})`)
        .order("created_at", { ascending: true })
      
      if (error) {
        console.error("Error loading messages:", error)
        return
      }
      
      setMessages(data || [])
      
      // Mark messages as read
      const unreadMessages = data?.filter(m => m.receiver_id === userId && !m.is_read) || []
      if (unreadMessages.length > 0) {
        const unreadIds = unreadMessages.map(m => m.id)
        await supabase
          .from("messages")
          .update({ is_read: true })
          .in("id", unreadIds)
        // Notify navbar to refresh counts immediately
        try {
          window.dispatchEvent(new CustomEvent("messages:changed"))
          localStorage.setItem("messages:changed", Date.now().toString())
        } catch (_) {}
      }
    } catch (error) {
      console.error("Error in loadMessages:", error)
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
            
            // Mark as read
            await supabase
              .from("messages")
              .update({ is_read: true })
              .eq("id", newMessage.id)
            // Notify navbar to refresh counts immediately
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
  
  // Send message
  async function sendMessage() {
    const trimmedText = text.trim()
    if (!trimmedText || !currentUserId || !otherUserId) return
    
    setText("")
    
    try {
      const { error } = await supabase
        .from("messages")
        .insert({
          sender_id: currentUserId,
          receiver_id: otherUserId,
          content: trimmedText
        })
      
      if (error) {
        console.error("Error sending message:", error)
        console.error("Error sending message (message):", (error as any)?.message)
        return
      }

      // Optimistically append while the realtime listener and/or next fetch catches up
      const optimisticMessage: Message = {
        id: (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)),
        sender_id: currentUserId,
        receiver_id: otherUserId,
        content: trimmedText,
        created_at: new Date().toISOString(),
        is_read: true
      }
      setMessages(prev => [...prev, optimisticMessage])
      // Notify navbar in case the other side is the same account/device (edge case)
      try {
        window.dispatchEvent(new CustomEvent("messages:changed"))
        localStorage.setItem("messages:changed", Date.now().toString())
      } catch (_) {}
    } catch (error) {
      console.error("Error in sendMessage:", error)
      console.error("Error in sendMessage (message):", (error as any)?.message)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center mb-6">
        <Link href="/families">
          <Button variant="ghost" size="sm" className="mr-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
        <h1 className="text-xl font-bold">
          Chat with {otherProfile?.family_name || "Family"}
        </h1>
      </div>
      
      <Card className="h-[70vh] flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">No messages yet. Say hello!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex ${message.sender_id === currentUserId ? "justify-end" : "justify-start"}`}
              >
                <div 
                  className={`max-w-[70%] px-4 py-2 rounded-lg ${
                    message.sender_id === currentUserId 
                      ? "bg-emerald-100 text-emerald-900" 
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  {message.content}
                  <div className="text-xs opacity-70 mt-1">
                    {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={endRef} />
        </div>
        
        <div className="border-t p-4 flex gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button 
            onClick={sendMessage}
            disabled={!text.trim()} 
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  )
}
