"use client"

import { usePathname } from "next/navigation"
import AppLeftNav from "@/components/app-left-nav"
import RightRail from "@/components/forum/right-rail"
import FeedTabs from "@/components/feed-tabs"

export default function ForumLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isEditPage = pathname?.includes("/edit")

  if (isEditPage) {
    // On edit pages, show only the main content without sidebars
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="space-y-6">
          {children}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 pb-6 pt-2 sm:pt-3 lg:pt-4">
      <div className="grid grid-cols-1 lg:grid-cols-[0.8fr_2fr_1.3fr] gap-3">
        <div className="hidden lg:block lg:col-start-1">
          <AppLeftNav />
        </div>

        <div className="lg:col-start-2 space-y-6">
          <FeedTabs />
          {children}
        </div>

        <div className="lg:col-start-3">
          <RightRail />
        </div>
      </div>
    </div>
  )
}
