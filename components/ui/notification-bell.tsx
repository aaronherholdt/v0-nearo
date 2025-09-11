"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Bell } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { fetchNotifications, markAllAsRead } from "@/utils/notifications"

interface NotificationBellProps {
  userId: string
}

export default function NotificationBell({ userId }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const supabase = createClientComponentClient()

  // Fetch notifications on initial load
  useEffect(() => {
    if (!userId) return

    async function loadNotifications() {
      try {
        const data = await fetchNotifications(userId)
        setNotifications(data)
        setUnreadCount(data.filter(n => !n.seen_at).length)
      } catch (error) {
        console.error("Error fetching notifications:", error)
      }
    }

    loadNotifications()
  }, [userId])

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel('notifications-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          // Refresh notifications when changes occur
          const data = await fetchNotifications(userId)
          setNotifications(data)
          setUnreadCount(data.filter(n => !n.seen_at).length)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase])

  // Mark notifications as read when dropdown opens
  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open)
    if (open && unreadCount > 0) {
      try {
        await markAllAsRead(userId)
        // Update local state to reflect read status
        setNotifications(prev => prev.map(n => ({ ...n, seen_at: new Date().toISOString() })))
        setUnreadCount(0)
      } catch (error) {
        console.error("Error marking notifications as read:", error)
      }
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 px-1 min-w-[1.2rem] h-5 bg-red-500 text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="p-2 font-medium border-b">Notifications</div>
        <div className="py-2 max-h-[300px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="px-4 py-2 text-sm text-gray-500">No notifications</div>
          ) : (
            notifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`px-4 py-2 text-sm hover:bg-gray-50 ${!notification.seen_at ? 'bg-blue-50' : ''}`}
              >
                <div className="font-medium">{notification.title}</div>
                <div className="text-gray-600">{notification.body ?? notification.message}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {new Date(notification.created_at).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
