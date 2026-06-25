import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchRecommendedBeats } from '@/lib/recommendations'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const beats = await fetchRecommendedBeats(supabase, user.id, page, 10)
  return NextResponse.json({ beats, hasMore: beats.length === 10 })
}
