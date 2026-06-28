import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ChatList } from '@/components/messages/ChatList'
import { CommunityCarousel } from '@/components/community/CommunityCarousel'
import { MessageCircle } from 'lucide-react'
import type { Conversation, Profile, Message } from '@/types'

export default async function MessagesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: communityPosts }, { data: convRows }] = await Promise.all([
    supabase
      .from('community_posts')
      .select('*, profiles(username, display_name, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
    .from('conversations')
    .select(`
      *,
      messages (id, sender_id, content, audio_url, file_url, read_at, created_at)
    `)
      .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
      .order('last_message_at', { ascending: false }),
  ])

  // Fetch the "other" profile for each conversation
  const conversations: Conversation[] = await Promise.all(
    (convRows ?? []).map(async (conv) => {
      const otherId = conv.participant_a === user.id ? conv.participant_b : conv.participant_a
      const { data: otherUser } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', otherId)
        .single()

      const msgs: Message[] = conv.messages ?? []
      const sorted = msgs.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      const lastMessage = sorted[0]
      const hasUnread = msgs.some((m) => m.sender_id !== user.id && !m.read_at)

      return {
        id: conv.id,
        participant_a: conv.participant_a,
        participant_b: conv.participant_b,
        last_message_at: conv.last_message_at,
        other_user: otherUser as Profile,
        last_message: lastMessage,
        has_unread: hasUnread,
      }
    })
  )

  return (
    <div className="min-h-dvh" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}>
      <div className="px-4 pb-4 border-b border-border" style={{ paddingTop: 'calc(3.5rem + env(safe-area-inset-top, 0px))' }}>
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold">Messages</h1>
        </div>
      </div>
      <CommunityCarousel
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        initialPosts={(communityPosts as any) ?? []}
        currentUserId={user.id}
      />
      <ChatList conversations={conversations} currentUserId={user.id} />
    </div>
  )
}
