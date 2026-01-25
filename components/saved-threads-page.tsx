"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bookmark, MessageCircle, Trash2 } from "lucide-react"
import { createClientComponentClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"

type TabId = "feed" | "discussion" | "trips" | "meetups"

const TABS: { id: TabId; label: string }[] = [
  { id: "feed", label: "Feed" },
  { id: "discussion", label: "Discussion" },
  { id: "trips", label: "Trips" },
  { id: "meetups", label: "Meetups" },
]

const TAB_LABELS: Record<TabId, string> = {
  feed: "Feed",
  discussion: "Discussion",
  trips: "Trips",
  meetups: "Meetups",
}

const EMPTY_COPY: Record<TabId, string> = {
  feed: "You haven't saved any feed stories yet.",
  discussion: "Saved discussions will appear here when you save a topic.",
  trips: "Keep trip matches handy by saving them from the forum.",
  meetups: "Save meetups you care about so the plans stay on your radar.",
}

type TopicSummary = {
  id: string
  title: string
  body?: string | null
  category?: string | null
  kind?: string | null
  created_at: string
  author_family_name?: string | null
  author_id?: string | null
  meta?: Record<string, any> | null
  likes?: { count: number | null }[] | null
  replies?: { count: number | null }[] | null
}

type TopicRelation = TopicSummary | TopicSummary[] | null | undefined

type SavedThread = {
  id: string
  user_id: string
  thread_id: string
  thread_title?: string | null
  author_name?: string | null
  created_at: string
  thread?: TopicRelation
}

interface SavedThreadsPageProps {
  user: any
  profile: any
  savedThreads: SavedThread[]
}

function resolveTab(item: SavedThread): TabId {
  const topic = normalizeTopic(item.thread)
  const rawKind = topic?.kind ? String(topic.kind).toLowerCase() : ""
  const rawCategory = topic?.category ? String(topic.category).toLowerCase() : ""

  if (rawCategory === "meetups") return "meetups"
  if (rawCategory === "trips") return "trips"
  if (rawKind === "discussion" || rawCategory === "discussion") return "discussion"
  return "feed"
}

function safeDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString()
}

function buildSnippet(topic?: TopicSummary | null): string | null {
  if (!topic) return null

  const rawBody = topic.body?.trim() ?? ""
  if (rawBody.length > 0) {
    return rawBody.length > 180 ? `${rawBody.slice(0, 180)}…` : rawBody
  }

  const meta = topic.meta && typeof topic.meta === "object" ? topic.meta : null
  if (meta?.summary) {
    const summary = String(meta.summary)
    return summary.length > 180 ? `${summary.slice(0, 180)}…` : summary
  }

  return null
}

function normalizeTopic(relation: TopicRelation): TopicSummary | null {
  if (!relation) return null
  if (Array.isArray(relation)) {
    return relation[0] ?? null
  }
  return relation
}

function formatMeta(topic: TopicSummary | null, tab: TabId) {
  if (!topic) return []
  const meta = topic.meta && typeof topic.meta === "object" ? topic.meta : null
  if (!meta) return []

  if (tab === "trips") {
    const details: string[] = []
    if (meta.city_id) details.push(`City: ${String(meta.city_id)}`)
    if (meta.start) details.push(`Start: ${safeDate(String(meta.start))}`)
    if (meta.end) details.push(`End: ${safeDate(String(meta.end))}`)
    return details
  }

  if (tab === "meetups") {
    const details: string[] = []
    if (meta.place_id) details.push(`Where: ${String(meta.place_id)}`)
    if (meta.time) details.push(`When: ${String(meta.time)}`)
    return details
  }

  return []
}

export default function SavedThreadsPage({ user: _user, profile: _profile, savedThreads }: SavedThreadsPageProps) {
  const [threads, setThreads] = useState<SavedThread[]>(savedThreads)
  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({})
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    for (const tab of TABS) {
      if (savedThreads.some((item) => resolveTab(item) === tab.id)) {
        return tab.id
      }
    }
    return "feed"
  })
  const router = useRouter()
  const supabase = createClientComponentClient()

  const counts = useMemo(() => {
    return threads.reduce<Record<TabId, number>>(
      (acc, item) => {
        const tab = resolveTab(item)
        acc[tab] += 1
        return acc
      },
      { feed: 0, discussion: 0, trips: 0, meetups: 0 },
    )
  }, [threads])

  const filteredThreads = useMemo(
    () => threads.filter((item) => resolveTab(item) === activeTab),
    [threads, activeTab],
  )

  useEffect(() => {
    if (threads.length === 0) {
      if (activeTab !== "feed") setActiveTab("feed")
      return
    }

    if (counts[activeTab] === 0) {
      const fallback = TABS.find((tab) => counts[tab.id] > 0)
      if (fallback && fallback.id !== activeTab) {
        setActiveTab(fallback.id)
      }
    }
  }, [threads, counts, activeTab])

  async function handleRemove(_threadId: string, savedId: string) {
    try {
      setIsDeleting((prev) => ({ ...prev, [savedId]: true }))

      const { error } = await supabase
        .from("saved_threads")
        .delete()
        .eq("id", savedId)

      if (error) throw error

      setThreads((prev) => prev.filter((item) => item.id !== savedId))
      toast.success("Removed from saved")
    } catch (error) {
      console.error("Error removing saved thread:", error)
      toast.error("Failed to remove saved item")
    } finally {
      setIsDeleting((prev) => ({ ...prev, [savedId]: false }))
    }
  }

  function handleOpenThread(threadId: string) {
    router.push(`/forum/thread/${threadId}`)
  }

  function handleMessageAuthor(threadId: string) {
    router.push(`/forum/thread/${threadId}`)
  }

  const hasSavedItems = threads.length > 0

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="bg-gradient-to-r from-emerald-500 to-blue-500 rounded-lg p-6 text-white">
        <div className="flex items-center">
          <Bookmark className="h-6 w-6 mr-2" />
          <h1 className="text-2xl font-bold">Saved Items</h1>
        </div>
        <p className="text-emerald-100 mt-2">
          Organize your saved feed, discussions, trips, and meetups in one place.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={[
                "px-3 py-2 text-sm rounded-md border transition-colors",
                isActive
                  ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                  : "border-transparent text-gray-700 hover:bg-gray-50",
              ].join(" ")}
            >
              {tab.label}
              <span className="ml-1 text-xs text-gray-500">
                ({counts[tab.id] ?? 0})
              </span>
            </button>
          )
        })}
      </div>

      {!hasSavedItems ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Bookmark className="h-12 w-12 mx-auto text-gray-300" />
            <h2 className="mt-4 text-lg font-semibold">Nothing saved yet</h2>
            <p className="mt-2 text-gray-500">
              Save feed stories, discussions, trips, and meetups to quickly revisit them.
            </p>
            <Link href="/forum">
              <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700">
                Browse Forum
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : filteredThreads.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-gray-600">
            {EMPTY_COPY[activeTab]}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredThreads.map((item) => {
            const topic = normalizeTopic(item.thread)
            const tab = resolveTab(item)
            const title = topic?.title ?? item.thread_title ?? "Untitled thread"
            const author = topic?.author_family_name ?? item.author_name ?? "Unknown author"
            const threadId = topic?.id ?? item.thread_id
            const savedOn = safeDate(item.created_at)
            const postedOn = topic ? safeDate(topic.created_at) : null
            const snippet = buildSnippet(topic)
            const metaDetails = formatMeta(topic, tab)
            const likes = topic?.likes?.[0]?.count ?? 0
            const replies = topic?.replies?.[0]?.count ?? 0

            const threadUnavailable = !topic

            return (
              <Card key={item.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4 space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <Badge variant="secondary">{TAB_LABELS[tab]}</Badge>
                    <span>Saved on {savedOn}</span>
                    {postedOn && <span>· Posted {postedOn}</span>}
                    {threadUnavailable && (
                      <Badge variant="destructive">No longer available</Badge>
                    )}
                  </div>

                  <div>
                    <h3
                      className="text-lg font-semibold cursor-pointer hover:underline"
                      onClick={() => handleOpenThread(threadId)}
                    >
                      {title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Posted by {author}
                    </p>
                  </div>

                  {snippet && (
                    <p className="text-sm text-gray-700">{snippet}</p>
                  )}

                  {metaDetails.length > 0 && (
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                      {metaDetails.map((detail) => (
                        <span key={detail}>{detail}</span>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                    {replies > 0 && <span>{replies} {replies === 1 ? "reply" : "replies"}</span>}
                    {likes > 0 && <span>{likes} {likes === 1 ? "like" : "likes"}</span>}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="cursor-pointer"
                      onClick={() => handleOpenThread(threadId)}
                      disabled={threadUnavailable}
                    >
                      Open thread
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="cursor-pointer"
                      onClick={() => handleMessageAuthor(threadId)}
                      disabled={threadUnavailable}
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Message
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleRemove(threadId, item.id)}
                      disabled={isDeleting[item.id]}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

