'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useUnreadCount(userId: string | undefined): number {
  const [count, setCount] = useState(0)

  const fetchCount = useCallback(async () => {
    if (!userId) return
    const supabase = createClient()

    const { data: convs } = await supabase
      .from('conversations')
      .select('id')
      .or(`participant_a.eq.${userId},participant_b.eq.${userId}`)

    const convIds = (convs ?? []).map((c) => c.id)
    if (convIds.length === 0) {
      setCount(0)
      return
    }

    const { count: unread } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .in('conversation_id', convIds)
      .neq('sender_id', userId)
      .is('read_at', null)

    setCount(unread ?? 0)
  }, [userId])

  useEffect(() => {
    fetchCount()
  }, [fetchCount])

  useEffect(() => {
    if (!userId) return
    const supabase = createClient()

    const channel = supabase
      .channel('unread-messages-badge')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, fetchCount)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, fetchCount)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, fetchCount])

  return count
}
