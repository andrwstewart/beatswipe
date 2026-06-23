'use client'

import Link from 'next/link'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { formatDistanceToNow } from '@/lib/utils'
import type { Conversation } from '@/types'

interface ChatListProps {
  conversations: Conversation[]
  currentUserId: string
}

export function ChatList({ conversations, currentUserId }: ChatListProps) {
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

        return (
          <Link
            key={conv.id}
            href={`/messages/${conv.id}`}
            className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors"
          >
            <Avatar className="w-12 h-12 flex-shrink-0">
              <AvatarImage src={other?.avatar_url ?? undefined} />
              <AvatarFallback className="bg-primary/20 text-primary font-bold">
                {displayName[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-semibold text-sm truncate">{displayName}</p>
                {conv.last_message_at && (
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {formatDistanceToNow(new Date(conv.last_message_at))}
                  </span>
                )}
              </div>
              <p className="text-muted-foreground text-xs truncate mt-0.5">
                {lastMsg?.sender_id === currentUserId ? 'You: ' : ''}
                {lastMsg?.content ?? 'Sent a file'}
              </p>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
