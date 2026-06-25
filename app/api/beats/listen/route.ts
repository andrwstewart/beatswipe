import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const { beatId, listenSeconds } = body as { beatId?: string; listenSeconds?: number }

  if (!beatId || typeof listenSeconds !== 'number' || listenSeconds < 1) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  await supabase.from('listen_events').insert({
    user_id: user.id,
    beat_id: beatId,
    listen_seconds: Math.min(listenSeconds, 300), // cap at 5 min
  })

  return NextResponse.json({ ok: true })
}
