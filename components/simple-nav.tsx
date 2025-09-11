"use client"

import { useState, useEffect, useCallback } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MapPin, Menu, X } from "lucide-react"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface SimpleNavProps {
  user?: any
}

export default function SimpleNav({ user }: SimpleNavProps) {
  const [profile, setProfile] = useState<any>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [unreadForum, setUnreadForum] = useState(0)
  const pathname = usePathname()
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function getProfile() {
      if (!user?.id) return

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      setProfile(data)
    }

    if (user) {
      getProfile()
    }
  }, [user, supabase])

  const loadUnreadMessages = useCallback(async () => {
    if (!user?.id) return
    const { count } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("receiver_id", user.id)
      .eq("is_read", false)
    setUnreadMessages(count || 0)
  }, [user?.id, supabase])

  useEffect(() => {
    if (!user?.id) return

    // initial fetch
    loadUnreadMessages()

    // 1) Listen to our custom event fired by the chat page
    const onChanged = () => loadUnreadMessages()
    window.addEventListener("messages:changed", onChanged)

    // 2) Listen to cross-tab updates via localStorage
    const onStorage = (e: StorageEvent) => {
      if (e.key === "messages:changed") loadUnreadMessages()
    }
    window.addEventListener("storage", onStorage)

    // 3) Also listen to realtime DB changes as a safety net
    const channel = supabase
      .channel("nav-messages")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${user.id}`,
        },
        () => loadUnreadMessages()
      )
      .subscribe()

    return () => {
      window.removeEventListener("messages:changed", onChanged)
      window.removeEventListener("storage", onStorage)
      supabase.removeChannel(channel)
    }
  }, [user?.id, supabase, loadUnreadMessages])

  // Unseen Forum notifications count
  const loadForumNotifications = useCallback(async () => {
    if (!user?.id) return
    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("seen_at", null)
      .ilike("link", "/forum%")
    setUnreadForum(count || 0)
  }, [user?.id, supabase])

  useEffect(() => {
    if (!user?.id) return

    // initial fetch
    loadForumNotifications()

    // 1) Custom event from forum sidebar/thread pages
    const onChanged = () => loadForumNotifications()
    window.addEventListener("notifications:changed", onChanged)

    // 2) Cross-tab ping
    const onStorage = (e: StorageEvent) => {
      if (e.key === "notifications:changed") loadForumNotifications()
    }
    window.addEventListener("storage", onStorage)

    // 3) Realtime as a safety net
    const channel = supabase
      .channel("nav-notifications")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user?.id}` },
        () => loadForumNotifications()
      )
      .subscribe()

    return () => {
      window.removeEventListener("notifications:changed", onChanged)
      window.removeEventListener("storage", onStorage)
      supabase.removeChannel(channel)
    }
  }, [user?.id, supabase, loadForumNotifications])

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  const navItems = [
    { label: "Home", href: "/dashboard" },
    { label: "Forum", href: "/forum" },
    { label: "Families", href: "/families" },
    { label: "Events", href: "/events" },
    { label: "Messages", href: "/chat" },
    { label: "Your Posts", href: "/your-posts" },
    { label: "Saved", href: "/saved" },
  ]

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <MapPin className="h-6 w-6 text-emerald-600 mr-2" />
            <span className="text-xl font-bold text-emerald-600">nearo</span>
          </Link>

          {/* Desktop Navigation */}
          {user && (
            <nav className="hidden md:flex items-center space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm font-medium relative ${
                    pathname === item.href
                      ? "text-emerald-600"
                      : "text-gray-700 hover:text-emerald-600"
                  }`}
                >
                  <span className="relative inline-block">
                    {item.label}
                    {item.label === "Messages" && unreadMessages > 0 && (
                      <span className="absolute -top-2 -right-3 min-w-[1.1rem] h-5 px-1 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center">
                        {unreadMessages > 99 ? "99+" : unreadMessages}
                      </span>
                    )}
                    {item.label === "Forum" && unreadForum > 0 && (
                      <span className="absolute -top-2 -right-3 min-w-[1.1rem] h-5 px-1 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center">
                        {unreadForum > 99 ? "99+" : unreadForum}
                      </span>
                    )}
                  </span>
                </Link>
              ))}
            </nav>
          )}

          {/* User Menu */}
          <div className="flex items-center">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-emerald-100 text-emerald-700">
                        {profile?.family_name?.[0] || user.email?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    {profile?.family_name || "Your Account"}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm" className="hover:bg-gray-100 hover:text-emerald-600">
                    Log in
                  </Button>
                </Link>
                <Link href="/auth/sign-up">
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                    Sign up
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            {user && (
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden ml-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && user && (
          <nav className="md:hidden py-3 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-2 py-2 rounded-md relative ${
                  pathname === item.href
                    ? "bg-emerald-50 text-emerald-600"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="relative inline-block">
                  {item.label}
                  {item.label === "Messages" && unreadMessages > 0 && (
                    <span className="absolute -top-2 -right-3 min-w-[1.1rem] h-5 px-1 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center">
                      {unreadMessages > 99 ? "99+" : unreadMessages}
                    </span>
                  )}
                  {item.label === "Forum" && unreadForum > 0 && (
                    <span className="absolute -top-2 -right-3 min-w-[1.1rem] h-5 px-1 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center">
                      {unreadForum > 99 ? "99+" : unreadForum}
                    </span>
                  )}
                </span>
              </Link>
            ))}
            {user && (
              <Button
                variant="ghost"
                className="w-full justify-start px-2 py-2 h-auto"
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}
