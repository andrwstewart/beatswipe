import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { parseBuffer } from 'music-metadata'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as { beatId?: string }
  if (!body.beatId) return NextResponse.json({ error: 'beatId required' }, { status: 400 })

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: beat } = await service
    .from('beats')
    .select('id, audio_url')
    .eq('id', body.beatId)
    .single()

  if (!beat?.audio_url) return NextResponse.json({ error: 'Beat not found' }, { status: 404 })

  try {
    const res = await fetch(beat.audio_url)
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)

    const buffer = new Uint8Array(await res.arrayBuffer())
    const meta = await parseBuffer(buffer, undefined, { duration: false, skipCovers: true })

    const bpm = meta.common.bpm ? Math.round(meta.common.bpm) : null
    // common.key can be "Fm", "F# minor", "5A" etc. — return raw, caller normalises
    const key = meta.common.key ?? null
    const title = meta.common.title ?? null

    return NextResponse.json({ bpm, key, title })
  } catch {
    // Metadata extraction is best-effort — missing tags is normal
    return NextResponse.json({ bpm: null, key: null, title: null })
  }
}
