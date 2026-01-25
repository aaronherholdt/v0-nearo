"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import { createClientComponentClient } from "@/lib/supabase/client"
import {
  Bookmark,
  CalendarDays,
  FileText,
  GraduationCap,
  Globe2,
  Home,
  MessageCircle,
  Users,
  UserCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"

type NavItem = {
  label: string
  href: string
  icon: ReactNode
  badge?: number
  match?: (pathname: string) => boolean
}

type Counts = {
  forum: number
  messages: number
}

const defaultCounts: Counts = {
  forum: 0,
  messages: 0,
}

export default function AppLeftNav() {
  const pathname = usePathname()
  const supabase = createClientComponentClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [counts, setCounts] = useState<Counts>(defaultCounts)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null)
    })
  }, [supabase])

  const refreshForumCount = useCallback(async () => {
    if (!userId) return
    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("seen_at", null)
      .ilike("link", "/forum%")
    setCounts((prev) => ({ ...prev, forum: count || 0 }))
  }, [supabase, userId])

  const refreshMessageCount = useCallback(async () => {
    if (!userId) return
    const { count } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("receiver_id", userId)
      .eq("is_read", false)
    setCounts((prev) => ({ ...prev, messages: count || 0 }))
  }, [supabase, userId])

  useEffect(() => {
    if (!userId) return

    refreshForumCount()
    refreshMessageCount()

    const onForumChanged = () => refreshForumCount()
    const onMessagesChanged = () => refreshMessageCount()

    window.addEventListener("notifications:changed", onForumChanged)
    window.addEventListener("messages:changed", onMessagesChanged)
    const onStorage = (event: StorageEvent) => {
      if (event.key === "notifications:changed") refreshForumCount()
      if (event.key === "messages:changed") refreshMessageCount()
    }
    window.addEventListener("storage", onStorage)

    const forumChannel = supabase
      .channel(`left-nav-forum-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => refreshForumCount()
      )
      .subscribe()

    const messageChannel = supabase
      .channel(`left-nav-messages-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${userId}`,
        },
        () => refreshMessageCount()
      )
      .subscribe()

    return () => {
      window.removeEventListener("notifications:changed", onForumChanged)
      window.removeEventListener("messages:changed", onMessagesChanged)
      window.removeEventListener("storage", onStorage)
      supabase.removeChannel(forumChannel)
      supabase.removeChannel(messageChannel)
    }
  }, [userId, supabase, refreshForumCount, refreshMessageCount])

  const markForumNotificationsSeen = useCallback(async () => {
    if (!userId || counts.forum === 0) return
    await supabase
      .from("notifications")
      .update({ seen_at: new Date().toISOString() })
      .eq("user_id", userId)
      .is("seen_at", null)
      .ilike("link", "/forum%")
    setCounts((prev) => ({ ...prev, forum: 0 }))
  }, [counts.forum, supabase, userId])

  useEffect(() => {
    if (!pathname?.startsWith("/forum")) return
    markForumNotificationsSeen()
  }, [pathname, markForumNotificationsSeen])

  const mainNavItems: NavItem[] = useMemo(
    () => [
      {
        label: "Home",
        href: "/forum",
        icon: <Home className="h-4 w-4" />,
        badge: counts.forum,
        match: (path) => path === "/forum" || path.startsWith("/forum/"),
      },
      {
        label: "Messages",
        href: "/chat",
        icon: <MessageCircle className="h-4 w-4" />,
        badge: counts.messages,
        match: (path) => path === "/chat" || path.startsWith("/chat/"),
      },
      {
        label: "Families",
        href: "/families",
        icon: <Users className="h-4 w-4" />,
        match: (path) => path === "/families" || path.startsWith("/families/"),
      },
      {
        label: "Events",
        href: "/events",
        icon: <CalendarDays className="h-4 w-4" />,
        match: (path) => path === "/events" || path.startsWith("/events/"),
      },
      {
        label: "Hubs",
        href: "/hubs",
        icon: <GraduationCap className="h-4 w-4" />,
        match: (path) => path === "/hubs" || path.startsWith("/hubs/"),
      },
      {
        label: "Your Posts",
        href: "/your-posts",
        icon: <FileText className="h-4 w-4" />,
        match: (path) => path === "/your-posts",
      },
      {
        label: "Saved",
        href: "/saved",
        icon: <Bookmark className="h-4 w-4" />,
        match: (path) => path === "/saved",
      },
      {
        label: "Worldview",
        href: "/worldview",
        icon: <Globe2 className="h-4 w-4" />,
        match: (path) => path === "/worldview",
      },
    ],
    [counts.forum, counts.messages]
  )

  const profileNavItem: NavItem = useMemo(
    () => ({
      label: "Profile",
      href: "/profile",
      icon: <UserCircle className="h-4 w-4" />,
      match: (path) => path === "/profile",
    }),
    []
  )

  const renderNavItem = (item: NavItem) => {
    const badgeCount = item.badge ?? 0
    const isActive = item.match
      ? item.match(pathname || "")
      : pathname === item.href || pathname?.startsWith(`${item.href}/`)
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors",
          isActive
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
            : "text-gray-700 hover:bg-gray-50 border border-transparent"
        )}
      >
        <span className="flex items-center gap-2 truncate">
          {item.icon}
          <span>{item.label}</span>
        </span>
        {badgeCount > 0 && (
          <span className="ml-2 min-w-[1.1rem] h-5 px-1 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center">
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        )}
      </Link>
    )
  }

  return (
    <nav className="w-full">
      <div className="lg:hidden space-y-1">
        {[...mainNavItems, profileNavItem].map(renderNavItem)}
      </div>
      <div className="hidden lg:flex">
        <div className="fixed top-[var(--app-header-height,4rem)] z-40 flex h-[calc(100vh-var(--app-header-height,4rem))] w-60 flex-col justify-between">
          <div className="space-y-1">{mainNavItems.map(renderNavItem)}</div>
          <div className="space-y-1 border-t border-gray-200 pt-3">
            {renderNavItem(profileNavItem)}
          </div>
        </div>
      </div>
    </nav>
  )
}

