'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { formatDistanceToNow } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { Conversation, Message } from '@/types'

interface ChatListProps {
  conversations: Conversation[]
  currentUserId: string
}

export function ChatList({ conversations, currentUserId }: ChatListProps) {
  // Track which conversation IDs have unread messages
  const [unreadConvIds, setUnreadConvIds] = useState<Set<string>>(
    () => new Set(conversations.filter((c) => c.has_unread).map((c) => c.id))
  )

  // Listen for realtime new messages (to add dots when a message arrives while on this page)
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('chatlist-new-messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const msg = payload.new as Message
          if (msg.sender_id !== currentUserId) {
            setUnreadConvIds((prev) => new Set([...prev, msg.conversation_id]))
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [currentUserId])

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-8">
        <div className="text-4xl">💬</div>
        <h3 className="font-semibold">No messages yet</h3>
        <p className="text-muted-foreground text-sm">
          Like a beat and message the producer to start a collab.
        </p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-border">
      {conversations.map((conv) => {
        const other = conv.other_user
        const displayName = other?.display_name ?? other?.username ?? 'Unknown'
        const lastMsg = conv.last_message
        const isUnread = unreadConvIds.has(conv.id)

        return (
          <Link
            key={conv.id}
            href={`/messages/${conv.id}`}
            className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/4 transition-colors active:bg-white/6"
          >
            <Avatar className="w-12 h-12 flex-shrink-0">
              <AvatarImage src={other?.avatar_url ?? undefined} />
              <AvatarFallback className="bg-primary/20 text-primary font-bold">
                {displayName[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <p className={`text-sm truncate ${isUnread ? 'font-bold text-foreground' : 'font-semibold'}`}>
                  {displayName}
                </p>
                {conv.last_message_at && (
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {formatDistanceToNow(new Date(conv.last_message_at))}
                  </span>
                )}
              </div>
              <p className={`text-xs truncate mt-0.5 ${isUnread ? 'text-foreground/80' : 'text-muted-foreground'}`}>
                {lastMsg?.sender_id === currentUserId ? 'You: ' : ''}
                {lastMsg?.content ?? 'Sent a file'}
              </p>
            </div>

            {/* Unread dot */}
            {isUnread && (
              <div className="w-2.5 h-2.5 rounded-full bg-white flex-shrink-0" />
            )}
          </Link>
        )
      })}
    </div>
  )
}
