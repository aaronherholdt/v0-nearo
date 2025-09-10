"use client"

import { useCallback, useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface ChatPreview {
  userId: string
  familyName: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
}

export default function ChatListPage() {
  const [chatPreviews, setChatPreviews] = useState<ChatPreview[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const loadChats = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }

      // Get all unique conversations
      const { data: sentMessages } = await supabase
        .from("messages")
        .select("receiver_id")
        .eq("sender_id", user.id)
        .order("created_at", { ascending: false })
      
      const { data: receivedMessages } = await supabase
        .from("messages")
        .select("sender_id")
        .eq("receiver_id", user.id)
        .order("created_at", { ascending: false })
      
      // Combine unique user IDs
      const uniqueUserIds = new Set<string>()
      
      sentMessages?.forEach(msg => uniqueUserIds.add(msg.receiver_id))
      receivedMessages?.forEach(msg => uniqueUserIds.add(msg.sender_id))
      
      const userIds = Array.from(uniqueUserIds)
      
      // No conversations yet
      if (userIds.length === 0) {
        setLoading(false)
        setChatPreviews([])
        return
      }
      
      // Get profiles for these users
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, family_name")
        .in("id", userIds)
      
      // Get last message and unread count for each conversation
      const previews: ChatPreview[] = []
      
      for (const userId of userIds) {
        // Get last message
        const { data: lastMessages } = await supabase
          .from("messages")
          .select("*")
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`)
          .order("created_at", { ascending: false })
          .limit(1)
        
        const lastMessage = lastMessages?.[0]
        
        if (!lastMessage) continue
        
        // Get unread count
        const { count: unreadCount } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("sender_id", userId)
          .eq("receiver_id", user.id)
          .eq("is_read", false)
        
        // Find profile
        const profile = profiles?.find(p => p.id === userId)
        
        previews.push({
          userId,
          familyName: profile?.family_name || "Unknown Family",
          lastMessage: lastMessage.content,
          lastMessageTime: lastMessage.created_at,
          unreadCount: unreadCount || 0
        })
      }
      
      // Sort by last message time (newest first)
      previews.sort((a, b) => 
        new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
      )
      
      setChatPreviews(previews)
    } catch (error) {
      console.error("Error loading chats:", error)
    } finally {
      setLoading(false)
    }
  }, [router, supabase])

  useEffect(() => {
    loadChats()
  }, [loadChats])

  // Realtime updates: refresh chat list on any message change involving current user
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null
    let isMounted = true

    async function setup() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !isMounted) return

      channel = supabase
        .channel(`chatlist-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "messages",
            // any change in conversations I’m part of
            filter: `or(sender_id.eq.${user.id},receiver_id.eq.${user.id})`,
          },
          () => {
            loadChats()
          }
        )
        .subscribe()
    }

    setup()

    return () => {
      isMounted = false
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [supabase, loadChats])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Your Conversations</h1>
      
      {chatPreviews.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500 mb-4">You don't have any conversations yet.</p>
            <Link href="/families">
              <div className="inline-block px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 cursor-pointer">
                Find Families
              </div>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {chatPreviews.map((chat) => (
            <Link key={chat.userId} href={`/chat/${chat.userId}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-emerald-100 text-emerald-700">
                        {chat.familyName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium truncate">{chat.familyName}</h3>
                        <span className="text-xs text-gray-500">
                          {new Date(chat.lastMessageTime).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
                        {chat.unreadCount > 0 && (
                          <span className="ml-2 bg-emerald-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {chat.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}