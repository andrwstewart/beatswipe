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

  // Try to fetch from Supabase; fall back to demo data in dev
  const { data: beats } = await supabase
    .from('beats')
    .select('*, producer:profiles(*)')
    .order('created_at', { ascending: false })
    .limit(10)

  const feedBeats: Beat[] = beats && beats.length > 0 ? (beats as Beat[]) : DEMO_BEATS

  return <BeatFeed initialBeats={feedBeats} userId={user.id} />
}
