"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface ChatPreview {
  userId: string
  familyName: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
}

interface ChatListPaneProps {
  activeUserId?: string
}

export default function ChatListPane({ activeUserId }: ChatListPaneProps) {
  const [chatPreviews, setChatPreviews] = useState<ChatPreview[]>([])
  const [searchTerm, setSearchTerm] = useState("")
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

      const { data, error } = await supabase.rpc("chat_conversations", {
        p_user_id: user.id,
      })

      if (error) {
        console.error("Error loading chats via chat_conversations RPC:", error)
        setChatPreviews([])
        return
      }

      const previews: ChatPreview[] = (data || []).map((row: any) => ({
        userId: row.other_id,
        familyName: row.family_name ?? "Unknown Family",
        lastMessage: row.last_message ?? "",
        lastMessageTime: row.last_timestamp,
        unreadCount: row.unread_count ?? 0,
      }))

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
            filter: `or(sender_id.eq.${user.id},receiver_id.eq.${user.id})`,
          },
          () => {
            loadChats()
          },
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

  const filteredPreviews = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return chatPreviews

    return chatPreviews.filter((chat) =>
      [chat.familyName, chat.lastMessage]
        .join(" ")
        .toLowerCase()
        .includes(term),
    )
  }, [chatPreviews, searchTerm])

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <div className="border-b px-6 pb-4 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Messages</h2>
          <Link
            href="/families"
            className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
          >
            New
          </Link>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Catch up with families you&apos;re connected with.
        </p>
        <div className="mt-4">
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search direct messages"
            className="h-10 rounded-full bg-muted"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        {loading ? (
          <div className="flex h-full items-center justify-center py-12">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          </div>
        ) : filteredPreviews.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-muted-foreground">
            No conversations yet. Start a new chat to connect.
          </div>
        ) : (
          <div className="px-3 py-4">
            <div className="space-y-1.5">
              {filteredPreviews.map((chat) => (
                <Link
                  key={chat.userId}
                  href={`/chat/${chat.userId}`}
                  className={cn(
                    "flex items-start gap-3 rounded-2xl px-3 py-3 transition-colors",
                    activeUserId === chat.userId
                      ? "bg-emerald-50"
                      : "hover:bg-muted/80",
                  )}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-emerald-100 text-emerald-700">
                      {chat.familyName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-1 flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold">
                        {chat.familyName}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {new Date(chat.lastMessageTime).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="flex-1 truncate text-sm text-muted-foreground">
                        {chat.lastMessage}
                      </p>
                      {chat.unreadCount > 0 && (
                        <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-emerald-500 px-1 text-xs font-semibold text-white">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

