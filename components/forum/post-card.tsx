"use client"

import { useEffect, useMemo, useState } from "react"
import type { ComponentType } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import FeedMediaGrid from "@/components/feed/feed-media-grid"
import LinkPreview from "@/components/feed/link-preview"
import { Bookmark, Heart, Share2 } from "lucide-react"
import { toast } from "sonner"

type Crosslinks = {
  overlaps?: number
  meetups?: number
  guides?: number
}

type MediaItem = {
  url: string
  alt?: string | null
  w?: number | null
  h?: number | null
}

type LinkPreviewData = {
  url?: string
  image?: string | null
  domain?: string | null
  title?: string | null
  desc?: string | null
}

type PostKind = "feed" | "discussion" | "trips" | "meetups" | "hubs"

type PostCardProps = {
  id: string
  title: string
  author: string
  authorId: string
  date: string
  category: string
  body?: string | null
  excerpt?: string | null
  kind?: PostKind
  crosslinks?: Crosslinks
  cityLabel?: string | null
  media?: MediaItem[] | null
  linkPreview?: LinkPreviewData | null
  replyCount?: number
  likeCount?: number
}

export default function PostCard({
  id,
  title,
  author,
  authorId,
  date,
  category,
  body,
  excerpt,
  kind,
  crosslinks,
  cityLabel,
  media,
  linkPreview,
  replyCount,
  likeCount,
}: PostCardProps) {
  const router = useRouter()
  const supabase = createClientComponentClient()

  const normalizedKind: PostKind = useMemo(() => {
    if (kind) return kind
    if (category === "discussion") return "discussion"
    if (category === "trips") return "trips"
    if (category === "meetups") return "meetups"
    return "feed"
  }, [kind, category])

  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [isLiking, setIsLiking] = useState(false)
  const [likeTotal, setLikeTotal] = useState(likeCount ?? 0)
  const [crosslinkCounts, setCrosslinkCounts] = useState<Crosslinks | null>(null)

  // Initial state sync
  useEffect(() => {
    setLikeTotal(likeCount ?? 0)
  }, [likeCount])

  // Fetch saved/liked state
  useEffect(() => {
    let cancelled = false

    async function hydrateState() {
      try {
        const { data: userData } = await supabase.auth.getUser()
        if (!userData.user || cancelled) return

        const userId = userData.user.id
        setCurrentUserId(userId)

        const [savedRes, likedRes] = await Promise.allSettled([
          supabase
            .from("saved_threads")
            .select("id")
            .eq("user_id", userId)
            .eq("thread_id", id)
            .limit(1),
          supabase
            .from("topic_likes")
            .select("topic_id")
            .eq("user_id", userId)
            .eq("topic_id", id)
            .limit(1),
        ])

        if (!cancelled) {
          if (savedRes.status === "fulfilled" && !savedRes.value.error) {
            setIsSaved((savedRes.value.data?.length ?? 0) > 0)
          }
          if (likedRes.status === "fulfilled" && !likedRes.value.error) {
            setIsLiked((likedRes.value.data?.length ?? 0) > 0)
          }
        }
      } catch (error) {
        console.error("Error hydrating post card state:", error)
      }
    }

    hydrateState()
    return () => {
      cancelled = true
    }
  }, [id, supabase])

  // Fetch crosslink summary
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data, error } = await supabase.rpc("topic_crosslinks", { p_topic_id: id })
      if (!error && !cancelled) {
        setCrosslinkCounts(data ?? { overlaps: 0, meetups: 0, guides: 0 })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id, supabase])

  const anyCrosslinks =
    (crosslinkCounts?.overlaps ?? crosslinks?.overlaps ?? 0) > 0 ||
    (crosslinkCounts?.meetups ?? crosslinks?.meetups ?? 0) > 0 ||
    (crosslinkCounts?.guides ?? crosslinks?.guides ?? 0) > 0

  async function requireAuth(): Promise<string | null> {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      router.push("/auth/login")
      return null
    }
    return userData.user.id
  }

  async function handleToggleSave() {
    try {
      setIsSaving(true)
      const userId = await requireAuth()
      if (!userId) return

      if (isSaved) {
        const { error } = await supabase
          .from("saved_threads")
          .delete()
          .eq("user_id", userId)
          .eq("thread_id", id)

        if (error) throw error
        setIsSaved(false)
        toast.success("Removed from saved")
      } else {
        const { error } = await supabase.from("saved_threads").insert({
          user_id: userId,
          thread_id: id,
          thread_title: title,
          author_name: author,
          created_at: new Date().toISOString(),
        })

        if (error) throw error
        setIsSaved(true)
        toast.success("Saved for later")
      }
    } catch (error) {
      console.error("Error toggling save:", error)
      toast.error("Could not update saved threads")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleToggleLike() {
    try {
      setIsLiking(true)
      const userId = await requireAuth()
      if (!userId) return

      if (isLiked) {
        const { error } = await supabase
          .from("topic_likes")
          .delete()
          .eq("user_id", userId)
          .eq("topic_id", id)

        if (error) throw error
        setIsLiked(false)
        setLikeTotal((prev) => Math.max(prev - 1, 0))
      } else {
        const { error } = await supabase.from("topic_likes").insert({
          user_id: userId,
          topic_id: id,
          created_at: new Date().toISOString(),
        })

        if (error) throw error
        setIsLiked(true)
        setLikeTotal((prev) => prev + 1)
      }
    } catch (error) {
      console.error("Error toggling like:", error)
      toast.error("Could not update like")
    } finally {
      setIsLiking(false)
    }
  }

  async function handleShare() {
    try {
      const url =
        typeof window !== "undefined"
          ? `${window.location.origin}/forum/thread/${id}`
          : `/forum/thread/${id}`

      if (typeof window !== "undefined" && navigator.share) {
        await navigator.share({ title, url })
      } else if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(url)
        toast.success("Link copied to clipboard")
      } else {
        toast("Share this link", { description: url })
      }
    } catch (error: any) {
      if (error?.name === "AbortError") return
      console.error("Error sharing thread:", error)
      toast.error("Could not share link")
    }
  }

  function handleOpenThread() {
    router.push(`/forum/thread/${id}`)
  }

  function handleMessagePrivately() {
    router.push(`/chat/${authorId}`)
  }

  const displayBody = body ?? excerpt ?? ""

  return (
    <Card className="hover:shadow-sm">
      <CardContent className="p-4 space-y-3">
        <header className="flex flex-wrap items-center gap-x-2 text-xs text-gray-500">
          <span className="font-medium text-gray-800">{author}</span>
          <span>•</span>
          <span>{date}</span>
          {cityLabel && (
            <>
              <span>•</span>
              <span className="inline-flex items-center text-gray-700">
                <Badge variant="outline" className="mr-1">City</Badge>
                {cityLabel}
              </span>
            </>
          )}
        </header>

        {normalizedKind === "discussion" ? (
          <div className="space-y-2">
            <button
              type="button"
              className="text-left text-base font-semibold text-gray-900 hover:underline"
              onClick={handleOpenThread}
            >
              {title}
            </button>
            <div className="flex items-center flex-wrap gap-2 text-sm text-gray-600">
              <Badge variant="secondary" className="uppercase tracking-wide text-xs">
                {category}
              </Badge>
              <span className="flex items-center gap-1">
                <span>{replyCount ?? 0}</span>
                <span>{(replyCount ?? 0) === 1 ? "reply" : "replies"}</span>
              </span>
            </div>
            {displayBody && (
              <p className="text-sm text-gray-700 line-clamp-3">{displayBody}</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <button
              type="button"
              className="text-left font-medium text-gray-900 hover:underline"
              onClick={handleOpenThread}
            >
              {title}
            </button>
            {displayBody && (
              <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
                {displayBody}
              </p>
            )}
          </div>
        )}

        {normalizedKind === "feed" && (
          <>
            <FeedMediaGrid media={media ?? undefined} />
            <LinkPreview data={linkPreview ?? undefined} />
          </>
        )}

        {anyCrosslinks && (
          <div className="flex flex-wrap gap-2 pt-1">
            {((crosslinkCounts?.overlaps ?? crosslinks?.overlaps) ?? 0) > 0 && (
              <Chip label={`${(crosslinkCounts?.overlaps ?? crosslinks?.overlaps) ?? 0} families overlapping`} />
            )}
            {((crosslinkCounts?.meetups ?? crosslinks?.meetups) ?? 0) > 0 && (
              <Chip label={`${(crosslinkCounts?.meetups ?? crosslinks?.meetups) ?? 0} meetups this week`} />
            )}
            {((crosslinkCounts?.guides ?? crosslinks?.guides) ?? 0) > 0 && (
              <Chip label={`${(crosslinkCounts?.guides ?? crosslinks?.guides) ?? 0} hub guides`} />
            )}
          </div>
        )}

        {normalizedKind === "feed" ? (
          <div className="flex items-center justify-between gap-2 pt-2 text-sm border-t border-gray-100">
            <ActionButton
              icon={Heart}
              label={isLiked ? "Liked" : "Like"}
              count={likeTotal}
              active={isLiked}
              onClick={handleToggleLike}
              disabled={isLiking}
              activeClassName="text-red-600"
              activeIconClassName="fill-red-500 text-red-500"
            />
            <ActionButton
              icon={Bookmark}
              label={isSaved ? "Saved" : "Save"}
              onClick={handleToggleSave}
              disabled={isSaving}
              active={isSaved}
            />
            <ActionButton
              icon={Share2}
              label="Share"
              onClick={handleShare}
            />
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
              onClick={handleOpenThread}
            >
              Open thread
            </Button>
            {normalizedKind === "discussion" && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <button
                  type="button"
                  className={`inline-flex items-center gap-1 rounded-md border border-transparent px-3 py-2 text-sm transition-colors hover:border-gray-200 hover:bg-gray-100 ${
                    isLiked ? "text-red-600" : "text-gray-600"
                  }`}
                  onClick={handleToggleLike}
                  disabled={isLiking}
                >
                  <Heart className={`h-4 w-4 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
                  <span>{isLiked ? "Liked" : "Like"}</span>
                  {likeTotal > 0 && <span className="text-xs text-gray-500">({likeTotal})</span>}
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-md border border-transparent px-3 py-2 text-sm transition-colors hover:border-gray-200 hover:bg-gray-100"
                  onClick={handleToggleSave}
                  disabled={isSaving}
                >
                  <Bookmark className={`h-4 w-4 ${isSaved ? "fill-emerald-500 text-emerald-500" : ""}`} />
                  <span>{isSaved ? "Saved" : "Save"}</span>
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-md border border-transparent px-3 py-2 text-sm transition-colors hover:border-gray-200 hover:bg-gray-100"
                  onClick={handleShare}
                >
                  <Share2 className="h-4 w-4" />
                  <span>Share</span>
                </button>
              </div>
            )}
            {authorId !== currentUserId && normalizedKind !== "feed" && (
              <Button
                size="sm"
                variant="outline"
                className="cursor-pointer"
                onClick={handleMessagePrivately}
              >
                Message privately
              </Button>
            )}
            {normalizedKind !== "discussion" && (
              <Button
                size="sm"
                variant={isSaved ? "secondary" : "outline"}
                className="cursor-pointer"
                onClick={handleToggleSave}
                disabled={isSaving}
              >
                {isSaving ? "Processing..." : isSaved ? "Unsave thread" : "Save thread"}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function Chip({ label }: { label: string }) {
  return (
    <span className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 px-2 py-1 rounded">
      {label}
    </span>
  )
}

type ActionButtonProps = {
  icon: ComponentType<{ className?: string }>
  label: string
  count?: number
  active?: boolean
  disabled?: boolean
  onClick: () => void
  activeClassName?: string
  activeIconClassName?: string
}

function ActionButton({
  icon: Icon,
  label,
  count,
  active,
  disabled,
  onClick,
  activeClassName,
  activeIconClassName,
}: ActionButtonProps) {
  const textColorClass = active ? activeClassName ?? "text-emerald-600" : "text-gray-700"
  const iconColorClass = active ? activeIconClassName ?? "fill-emerald-500" : ""

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex h-11 flex-1 items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors ${textColorClass} ${
        disabled ? "opacity-60" : "hover:bg-gray-100"
      }`}
    >
      <Icon className={`h-4 w-4 ${iconColorClass}`} />
      <span>{label}</span>
      {count !== undefined && count > 0 && (
        <span className="text-xs text-gray-500">({count})</span>
      )}
    </button>
  )
}

