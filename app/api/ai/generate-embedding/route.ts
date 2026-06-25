import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { generateAudioEmbedding } from '@/lib/ai/audio-embedding'
import type { BeatEmbeddingMetadata } from '@/lib/ai/audio-embedding'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as { beatId?: string }
  if (!body.beatId) {
    return NextResponse.json({ error: 'beatId required' }, { status: 400 })
  }

  // Auth: user session cookie OR x-admin-token header
  const adminToken = request.headers.get('x-admin-token')
  const isAdminCall = adminToken && adminToken === process.env.ADMIN_SECRET_TOKEN

  if (!isAdminCall) {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: beat, error: fetchError } = await service
    .from('beats')
    .select('id, title, bpm, key, genre, audio_url, description, detailed_description, ai_key_features, ai_mood, audio_embedding')
    .eq('id', body.beatId)
    .single()

  if (fetchError || !beat) {
    return NextResponse.json({ error: 'Beat not found' }, { status: 404 })
  }
  if (!beat.audio_url) {
    return NextResponse.json({ error: 'Beat has no audio URL' }, { status: 400 })
  }

  const metadata: BeatEmbeddingMetadata = {
    title: beat.title,
    bpm: beat.bpm,
    key: beat.key,
    genre: beat.genre,
    description: beat.description,
    detailed_description: beat.detailed_description,
    ai_key_features: beat.ai_key_features,
    ai_mood: beat.ai_mood,
  }

  try {
    const embedding = await generateAudioEmbedding(beat.audio_url, metadata)

    await service
      .from('beats')
      .update({ audio_embedding: embedding })
      .eq('id', body.beatId)

    return NextResponse.json({
      success: true,
      beatId: body.beatId,
      dimensions: embedding.length,
    })
  } catch (err) {
    console.error('[generate-embedding] Failed for beat', body.beatId, err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
