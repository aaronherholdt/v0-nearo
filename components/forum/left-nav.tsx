"use client"

import Link from 'next/link'
import { useEffect, useMemo, useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { createClientComponentClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

type Counts = { general: number; trips: number; meetups: number }

const initial: Counts = { general: 0, trips: 0, meetups: 0 }

export default function ForumLeftNav() {
  const supabase = createClientComponentClient()
  const pathname = usePathname()
  const [userId, setUserId] = useState<string | null>(null)
  const [counts, setCounts] = useState<Counts>(initial)

  // Which section are we on?
  const currentSection: keyof Counts = useMemo(() => {
    if (pathname?.includes('/forum/trips')) return 'trips'
    if (pathname?.includes('/forum/meetups')) return 'meetups'
    return 'general'
  }, [pathname])

  // Load current user id
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
  }, [supabase])

  const refreshCounts = useCallback(async () => {
    if (!userId) return
    // We fetch unseen forum notifications then count by category
    const { data } = await supabase
      .from('notifications')
      .select('id, link, category')
      .eq('user_id', userId)
      .is('seen_at', null)
      .or('type.eq.forum,link.ilike./forum%') // supports old rows that lack type/category

    const next = { ...initial }
    for (const n of (data || [])) {
      const cat =
        (n as any).category ||
        (/\/forum\/(trips|meetups)/.exec((n as any).link || '')?.[1] as keyof Counts) ||
        'general'
      next[cat as keyof Counts] = (next[cat as keyof Counts] || 0) + 1
    }
    setCounts(next)
  }, [userId, supabase])

  // Mark a section as seen
  const markSeen = useCallback(
    async (section: keyof Counts) => {
      if (!userId) return
      // Update DB
      await supabase
        .from('notifications')
        .update({ seen_at: new Date().toISOString() })
        .eq('user_id', userId)
        .is('seen_at', null)
        .or(`category.eq.${section},and(type.eq.forum,link.ilike./forum/${section}%)`)

      // Optimistic UI
      setCounts((c) => ({ ...c, [section]: 0 }))

      // Ping navbar + other tabs immediately
      window.dispatchEvent(new CustomEvent('notifications:changed'))
      try {
        localStorage.setItem('notifications:changed', String(Date.now()))
      } catch {}
    },
    [userId, supabase]
  )

  // Initial load + realtime subscription + local event listeners
  useEffect(() => {
    if (!userId) return

    refreshCounts()

    const onChanged = () => refreshCounts()
    window.addEventListener('notifications:changed', onChanged)
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'notifications:changed') refreshCounts()
    }
    window.addEventListener('storage', onStorage)

    const channel = supabase
      .channel(`forum-leftnav-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        () => refreshCounts()
      )
      .subscribe()

    return () => {
      window.removeEventListener('notifications:changed', onChanged)
      window.removeEventListener('storage', onStorage)
      supabase.removeChannel(channel)
    }
  }, [userId, refreshCounts, supabase])

  // If the user arrives directly on a section route, mark that section as seen
  useEffect(() => {
    if (!userId) return
    // Give time for counts to load; if there are any in this section, clear them
    const t = setTimeout(() => {
      if (counts[currentSection] > 0) markSeen(currentSection)
    }, 150)
    return () => clearTimeout(t)
  }, [userId, currentSection, counts, markSeen])

  const items = [
    { id: 'general',  label: 'General',  href: '/forum',          count: counts.general },
    { id: 'trips',    label: 'Trips',    href: '/forum/trips',    count: counts.trips },
    { id: 'meetups',  label: 'Meetups',  href: '/forum/meetups',  count: counts.meetups },
  ]

  return (
    <nav className="w-full lg:w-48" aria-label="Forum sections">
      <div className="sticky top-24">
        <ul className="space-y-1">
          {items.map((item) => {
            const active = currentSection === (item.id as keyof Counts)
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  onClick={() => markSeen(item.id as keyof Counts)}
                  className={cn(
                    'flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm transition-colors cursor-pointer',
                    active
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'hover:bg-gray-50 text-gray-700 border border-transparent'
                  )}
                >
                  <span className="truncate">{item.label}</span>
                  {item.count > 0 && (
                    <span className="ml-2 min-w-[1.1rem] h-5 px-1 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center">
                      {item.count > 99 ? '99+' : item.count}
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}



