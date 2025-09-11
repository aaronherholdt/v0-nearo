'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'

export type SidebarTabItem = {
  id: string
  label: string
  icon?: React.ReactNode
}

type ForumSidebarTabsProps = {
  items: SidebarTabItem[]
  className?: string
}

// A simple vertical sidebar that behaves like tabs. Clicking a tab scrolls to the
// corresponding section and updates the hash. The active tab is highlighted based on scroll.
export function ForumSidebarTabs({ items, className }: ForumSidebarTabsProps) {
  const [activeId, setActiveId] = useState<string | null>(null)

  const sectionIds = useMemo(() => items.map((i) => i.id), [items])

  useEffect(() => {
    // Observe sections to update active tab while scrolling
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[]

    if (sections.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the entry that is most visible
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0))
        if (visible[0]) {
          setActiveId(visible[0].target.id)
        }
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
    )

    sections.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [sectionIds])

  useEffect(() => {
    // Initialize from hash on load
    const hash = typeof window !== 'undefined' ? window.location.hash.replace('#', '') : ''
    if (hash && sectionIds.includes(hash)) {
      const el = document.getElementById(hash)
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 0)
      }
    }
  }, [sectionIds])

  const handleClick = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    const el = document.getElementById(id)
    if (!el) return
    window.history.replaceState(null, '', `#${id}`)
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActiveId(id)
  }

  return (
    <nav className={cn('w-full lg:w-56', className)} aria-label="Forum sections">
      <div className="sticky top-24">
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={handleClick(item.id)}
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors cursor-pointer',
                  activeId === item.id
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'hover:bg-gray-50 text-gray-700 border border-transparent'
                )}
              >
                {item.icon && <span className="shrink-0">{item.icon}</span>}
                <span className="truncate">{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}

export default ForumSidebarTabs


