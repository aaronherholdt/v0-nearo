"use client"

import { useMemo } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

type Tab = {
  id: "feed" | "discussion" | "trips" | "meetups"
  label: string
}

const tabs: Tab[] = [
  { id: "feed", label: "Feed" },
  { id: "discussion", label: "Discussion" },
  { id: "trips", label: "Trips" },
  { id: "meetups", label: "Meetups" },
]

export default function FeedTabs() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentTab = useMemo<Tab["id"]>(() => {
    if (!pathname) return "feed"
    if (pathname.startsWith("/forum/trips")) return "trips"
    if (pathname.startsWith("/forum/meetups")) return "meetups"
    const queryTab = searchParams.get("tab")
    if (queryTab === "discussion") return "discussion"
    return "feed"
  }, [pathname, searchParams])

  const handleSelect = (id: Tab["id"]) => {
    if (id === "trips") {
      router.push("/forum/trips")
      return
    }
    if (id === "meetups") {
      router.push("/forum/meetups")
      return
    }

    const next = new URLSearchParams(searchParams.toString())
    if (id === "feed") {
      next.delete("tab")
    } else {
      next.set("tab", id)
    }
    const query = next.toString()
    router.replace(query ? `/forum?${query}` : "/forum")
  }

  return (
    <div className="sticky top-[var(--app-header-height,4rem)] z-30">
      <div className="-mt-3 flex gap-2 border-b border-emerald-100/60 bg-white pb-2 pt-1 shadow-sm isolate sm:-mt-4 lg:-mt-6 relative">
        {tabs.map((tab) => {
          const active = currentTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => handleSelect(tab.id)}
              className={[
                "px-3 py-2 text-sm rounded-md border transition-colors cursor-pointer",
                active
                  ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                  : "border-transparent text-gray-700 hover:bg-gray-50",
              ].join(" ")}
            >
              {tab.label}
            </button>
          )
        })}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -bottom-5 h-8 bg-gradient-to-b from-white/0 via-white/80 to-white supports-[backdrop-filter]:backdrop-blur-md"
        />
      </div>
    </div>
  )
}
