'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Notification } from '@/lib/types'

/**
 * useNotifications — realtime notifications hook
 * Subscribes to the Supabase Realtime channel for the authenticated user's
 * notifications table. Returns the count of unread notifications, the list,
 * and a markAllRead function.
 */
export function useNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [latestNotification, setLatestNotification] = useState<Notification | null>(null)
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null)

  const fetchNotifications = useCallback(async () => {
    if (!userId) return
    const supabase = createClient()
    const { data } = await supabase
      .from('notifications')
      .select('*, from_user:profiles!notifications_from_user_id_fkey(id, handle, aura_points, avatar_url)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30)

    const notifs = (data ?? []) as Notification[]
    setNotifications(notifs)
    setUnreadCount(notifs.filter((n) => !n.is_read).length)
  }, [userId])

  // Initial fetch
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Realtime subscription
  useEffect(() => {
    if (!userId) return
    const supabase = createClient()

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          // Fetch the profile for the from_user since the payload only has from_user_id
          const newNotif = payload.new as Notification
          if (newNotif.from_user_id) {
            const { data } = await supabase.from('profiles').select('id, handle, aura_points, avatar_url').eq('id', newNotif.from_user_id).single()
            if (data) {
              newNotif.from_user = data as any
            }
          }
          setNotifications((prev) => [newNotif, ...prev])
          setUnreadCount((prev) => prev + 1)
          setLatestNotification(newNotif)
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  const markAllRead = useCallback(async () => {
    if (!userId) return
    const supabase = createClient()
    await supabase.rpc('mark_notifications_read')
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }, [userId])

  return { notifications, unreadCount, latestNotification, markAllRead, refetch: fetchNotifications }
}
