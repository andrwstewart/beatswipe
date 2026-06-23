import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ChatWindow } from '@/components/messages/ChatWindow'
import type { Message, Profile } from '@/types'

interface Props {
  params: Promise<{ chatId: string }>
  searchParams: Promise<{ producer?: string; message?: string }>
}

export default async function ChatPage({ params, searchParams }: Props) {
  const { chatId } = await params
  const { producer: producerUsername, message: initialMessage } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Handle "new" conversation started from collab prompt
  if (chatId === 'new' && producerUsername) {
    const { data: producerProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', producerUsername)
      .single()

    if (!producerProfile) notFound()

    // Find or create conversation
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .or(
        `and(participant_a.eq.${user.id},participant_b.eq.${producerProfile.id}),and(participant_a.eq.${producerProfile.id},participant_b.eq.${user.id})`
      )
      .single()

    let conversationId: string

    if (existing) {
      conversationId = existing.id
    } else {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({ participant_a: user.id, participant_b: producerProfile.id })
        .select('id')
        .single()

      if (!newConv) notFound()
      conversationId = newConv.id

      // Send initial message if provided
      if (initialMessage) {
        await supabase.from('messages').insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: initialMessage,
        })
      }
    }

    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    return (
      <ChatWindow
        conversationId={conversationId}
        currentUserId={user.id}
        otherUser={producerProfile as Profile}
        initialMessages={(messages as Message[]) ?? []}
      />
    )
  }

  // Normal conversation page
  const { data: conv } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', chatId)
    .single()

  if (!conv) notFound()

  const isParticipant = conv.participant_a === user.id || conv.participant_b === user.id
  if (!isParticipant) redirect('/messages')

  const otherId = conv.participant_a === user.id ? conv.participant_b : conv.participant_a

  const [{ data: otherUser }, { data: messages }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', otherId).single(),
    supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', chatId)
      .order('created_at', { ascending: true }),
  ])

  if (!otherUser) notFound()

  return (
    <ChatWindow
      conversationId={chatId}
      currentUserId={user.id}
      otherUser={otherUser as Profile}
      initialMessages={(messages as Message[]) ?? []}
    />
  )
}
