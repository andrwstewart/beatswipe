import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BeatFeed } from '@/components/feed/BeatFeed'
import { DEMO_BEATS } from '@/lib/seed-data'
import type { Beat } from '@/types'

export default async function FeedPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: beats } = await supabase
    .from('beats')
    .select('*, producer:profiles(*)')

  // Shuffle on the server so every page load gives a different order
  const all: Beat[] = beats && beats.length > 0 ? (beats as Beat[]) : DEMO_BEATS
  const shuffled = [...all]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  const initialBeats = shuffled

  return <BeatFeed initialBeats={initialBeats} userId={user.id} />
}
