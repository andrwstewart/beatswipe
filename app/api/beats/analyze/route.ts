import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { analyzeBeat } from '@/lib/ai/beat-analyzer'
import type { Beat } from '@/types'

export async function POST(request: Request) {
  const { beatId } = await request.json().catch(() => ({ beatId: null }))
  if (!beatId) {
    return NextResponse.json({ error: 'beatId required' }, { status: 400 })
  }

  // Auth check — user session OR admin token header
  const adminToken = request.headers.get('x-admin-token')
  const isAdminCall = adminToken === process.env.ADMIN_SECRET_TOKEN

  if (!isAdminCall) {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  // Service role client bypasses RLS for writing AI fields
  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Fetch beat with producer profile
  const { data: beat, error: fetchError } = await service
    .from('beats')
    .select('*, producer:profiles(*)')
    .eq('id', beatId)
    .single()

  if (fetchError || !beat) {
    return NextResponse.json({ error: 'Beat not found' }, { status: 404 })
  }

  if (beat.analysis_status === 'completed') {
    return NextResponse.json({ success: true, cached: true, analysis: beat })
  }

  // Mark as processing
  await service
    .from('beats')
    .update({ analysis_status: 'processing' })
    .eq('id', beatId)

  try {
    const analysis = await analyzeBeat(beat as Beat)

    await service
      .from('beats')
      .update({
        detailed_description: analysis.detailed_description,
        ai_genres: analysis.ai_genres,
        ai_mood: analysis.ai_mood,
        ai_energy: analysis.ai_energy,
        ai_key_features: analysis.ai_key_features,
        underground_vibe: analysis.underground_vibe,
        recommended_artists: analysis.recommended_artists,
        ai_analysis: analysis as unknown as Record<string, unknown>,
        analysis_status: 'completed',
      })
      .eq('id', beatId)

    return NextResponse.json({ success: true, analysis })
  } catch (err) {
    await service
      .from('beats')
      .update({ analysis_status: 'failed' })
      .eq('id', beatId)

    console.error('[analyze] Failed for beat', beatId, err)
    return NextResponse.json(
      { error: 'Analysis failed', details: String(err) },
      { status: 500 }
    )
  }
}
