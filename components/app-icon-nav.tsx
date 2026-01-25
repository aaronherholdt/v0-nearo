"use client"

import Link from "next/link"
import { useMemo } from "react"
import { usePathname } from "next/navigation"
import {
  Bookmark,
  CalendarDays,
  FileText,
  Globe2,
  GraduationCap,
  Home,
  MessageCircle,
  UserCircle2,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

export default function AppIconNav() {
  const pathname = usePathname()

  const navItems = useMemo<NavItem[]>(
    () => [
      { href: "/forum", label: "Home", icon: Home },
      { href: "/chat", label: "Messages", icon: MessageCircle },
      { href: "/families", label: "Families", icon: Users },
      { href: "/events", label: "Events", icon: CalendarDays },
      { href: "/hubs", label: "Hubs", icon: GraduationCap },
      { href: "/your-posts", label: "Your Posts", icon: FileText },
      { href: "/saved", label: "Saved", icon: Bookmark },
      { href: "/worldview", label: "Worldview", icon: Globe2 },
    ],
    []
  )

  return (
    <aside className="hidden h-full w-16 shrink-0 flex-col items-center border-r border-border bg-background pt-2 pb-6 md:flex">
      <nav className="flex flex-col items-center gap-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href || (href !== "/" && pathname?.startsWith(`${href}/`))
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className={cn(
                "inline-flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                isActive && "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
              )}
            >
              <Icon className="h-5 w-5" />
            </Link>
          )
        })}
      </nav>
      <Link
        href="/profile"
        aria-label="Profile"
        className="mt-auto inline-flex h-10 w-10 items-center justify-center rounded-full border border-muted-foreground/20 text-muted-foreground transition-colors hover:border-emerald-400 hover:text-emerald-600"
      >
        <UserCircle2 className="h-5 w-5" />
      </Link>
    </aside>
  )
}

