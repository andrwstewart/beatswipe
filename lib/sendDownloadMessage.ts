import { createClient } from '@/lib/supabase/client'

export async function sendDownloadMessage(downloaderId: string, producerId: string): Promise<void> {
  if (downloaderId === producerId) return

  const supabase = createClient()

  // Find existing conversation between the two users
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .or(
      `and(participant_a.eq.${downloaderId},participant_b.eq.${producerId}),` +
      `and(participant_a.eq.${producerId},participant_b.eq.${downloaderId})`
    )
    .maybeSingle()

  let conversationId: string

  if (existing) {
    conversationId = existing.id
  } else {
    const { data: newConv } = await supabase
      .from('conversations')
      .insert({
        participant_a: downloaderId,
        participant_b: producerId,
        last_message_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (!newConv) return
    conversationId = newConv.id
  }

  await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_id: downloaderId,
    content: 'Hey just wanted to let you know I downloaded your beat',
  })
}
