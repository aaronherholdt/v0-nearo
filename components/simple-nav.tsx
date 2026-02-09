"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createClientComponentClient } from "@/lib/supabase/client"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MapPin, Menu, X, Trash2, Heart } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface SimpleNavProps {
  user?: any
}

export default function SimpleNav({ user }: SimpleNavProps) {
  const headerRef = useRef<HTMLElement | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [unreadForum, setUnreadForum] = useState(0)
  const [deleting, setDeleting] = useState(false)
  const pathname = usePathname()
  const isForumPage = pathname?.startsWith("/forum") ?? false
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

    const interval = window.setInterval(() => loadUnreadMessages(), 120_000)

    return () => {
      window.removeEventListener("messages:changed", onChanged)
      window.removeEventListener("storage", onStorage)
      window.clearInterval(interval)
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

    const interval = window.setInterval(() => loadForumNotifications(), 120_000)

    return () => {
      window.removeEventListener("notifications:changed", onChanged)
      window.removeEventListener("storage", onStorage)
      window.clearInterval(interval)
    }
  }, [user?.id, supabase, loadForumNotifications])

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  async function handleDeleteAccount() {
    try {
      setDeleting(true)
      const res = await fetch("/api/account/delete", { method: "POST" })
      if (!res.ok) throw new Error("Delete failed")
      // sign out locally and bounce home
      await supabase.auth.signOut()
      window.location.href = "/?deleted=1"
    } catch (e) {
      alert("Sorry, we couldn't delete your account. Please try again.")
    } finally {
      setDeleting(false)
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") return
    const node = headerRef.current
    if (!node) return

    const updateHeaderHeight = () => {
      const height = node.offsetHeight
      document.documentElement.style.setProperty(
        "--app-header-height",
        `${height}px`,
      )
    }

    updateHeaderHeight()

    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => updateHeaderHeight())
        : null

    if (observer) {
      observer.observe(node)
    }

    window.addEventListener("resize", updateHeaderHeight)

    return () => {
      observer?.disconnect()
      window.removeEventListener("resize", updateHeaderHeight)
    }
  }, [])

  const navItems = [
    { label: "Home", href: "/forum" },
    { label: "Profile", href: "/profile" },
    { label: "Messages", href: "/chat" },
    { label: "Families", href: "/families" },
    { label: "Events", href: "/events" },
    { label: "Your Posts", href: "/your-posts" },
    { label: "Saved", href: "/saved" },
    { label: "Worldview", href: "/worldview" },
  ]

  return (
    <header ref={headerRef} className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className={cn("max-w-7xl mx-auto px-4 pt-3 pb-3", isForumPage && "pb-0")}>
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <MapPin className="h-6 w-6 text-emerald-600 mr-2" />
            <span className="text-xl font-bold text-emerald-600">Nearo</span>
          </Link>

          {/* User Menu */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link href="/donate">
                  <Button variant="outline" size="sm" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50">
                    <Heart className="h-4 w-4 mr-2" />
                    Support Us
                  </Button>
                </Link>
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
                  <DropdownMenuSeparator />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={(e) => e.preventDefault()}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete account…
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove your account and scrub your profile. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteAccount} disabled={deleting}>
                        {deleting ? "Deleting…" : "Confirm delete"}
                      </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
              </>
            ) : (
              <>
                {pathname !== "/setup-profile" && pathname !== "/auth/login" && pathname !== "/auth/sign-up" && (
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
              </>
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
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || pathname?.startsWith(`${item.href}/`)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-2 py-2 rounded-md relative ${
                    isActive
                      ? "bg-emerald-50 text-emerald-600"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="relative inline-block">
                    {item.label}
                    {item.href === "/chat" && unreadMessages > 0 && (
                      <span className="absolute -top-2 -right-3 min-w-[1.1rem] h-5 px-1 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center">
                        {unreadMessages > 99 ? "99+" : unreadMessages}
                      </span>
                    )}
                    {item.href === "/forum" && unreadForum > 0 && (
                      <span className="absolute -top-2 -right-3 min-w-[1.1rem] h-5 px-1 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center">
                        {unreadForum > 99 ? "99+" : unreadForum}
                      </span>
                    )}
                  </span>
                </Link>
              )
            })}
            {user && (
              <>
                <Link
                  href="/donate"
                  className="block px-2 py-2 rounded-md text-emerald-600 hover:bg-emerald-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Heart className="h-4 w-4 inline-block mr-2" />
                  Support Us
                </Link>
                <Button
                  variant="ghost"
                  className="w-full justify-start px-2 py-2 h-auto"
                  onClick={handleSignOut}
                >
                  Sign Out
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start px-2 py-2 h-auto text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete account…
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove your account and scrub your profile. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteAccount} disabled={deleting}>
                        {deleting ? "Deleting…" : "Confirm delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}
