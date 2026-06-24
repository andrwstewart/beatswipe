import type { Beat } from '@/types'

type SupabaseClient = Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>

export async function fetchRecommendedBeats(
  supabase: SupabaseClient,
  userId: string,
  page = 0,
  pageSize = 10
): Promise<Beat[]> {
  // Get user's disliked beat IDs to exclude
  const { data: disliked } = await supabase
    .from('interactions')
    .select('beat_id')
    .eq('user_id', userId)
    .eq('type', 'dislike')

  const dislikedIds = disliked?.map((d: { beat_id: string }) => d.beat_id) ?? []

  // Get beats the user has already seen (played/liked)
  const { data: seen } = await supabase
    .from('interactions')
    .select('beat_id')
    .eq('user_id', userId)
    .in('type', ['play', 'like', 'favorite', 'download'])

  const seenIds = seen?.map((s: { beat_id: string }) => s.beat_id) ?? []
  const excludeIds = [...new Set([...dislikedIds, ...seenIds])]

  // Build genre + AI preference profile from recent likes
  const { data: likedInteractions } = await supabase
    .from('interactions')
    .select('beats(genre, ai_genres, ai_energy, ai_mood)')
    .eq('user_id', userId)
    .eq('type', 'like')
    .limit(20)

  const likedGenres: string[] = []
  const likedAiGenres: string[] = []
  const energyValues: number[] = []

  likedInteractions?.forEach((i: Record<string, unknown>) => {
    const beat = i.beats as { genre?: string[]; ai_genres?: string[]; ai_energy?: number } | null
    if (!beat) return
    beat.genre?.forEach((g) => likedGenres.push(g))
    beat.ai_genres?.forEach((g) => likedAiGenres.push(g))
    if (beat.ai_energy != null) energyValues.push(beat.ai_energy)
  })

  const genreCounts: Record<string, number> = {}
  ;[...likedGenres, ...likedAiGenres].forEach((g) => {
    genreCounts[g] = (genreCounts[g] ?? 0) + 1
  })
  const topGenres = Object.entries(genreCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([g]) => g)

  const preferredEnergy =
    energyValues.length > 0
      ? Math.round(energyValues.reduce((a, b) => a + b, 0) / energyValues.length)
      : null

  const excludeFilter =
    excludeIds.length > 0
      ? `(${excludeIds.map((id) => `'${id}'`).join(',')})`
      : null

  // ── Path 1: AI-ranked genre match (analyzed beats only) ──────────────────
  if (topGenres.length > 0) {
    let aiQuery = supabase
      .from('beats')
      .select('*, producer:profiles(*)')
      .eq('analysis_status', 'completed')
      .overlaps('ai_genres', topGenres)
      .order('likes_count', { ascending: false })
      .limit(pageSize * 2) // fetch extra for client-side re-ranking

    if (excludeFilter) {
      aiQuery = aiQuery.not('id', 'in', excludeFilter)
    }

    const { data: aiMatches } = await aiQuery

    if (aiMatches && aiMatches.length >= pageSize / 2) {
      const ranked = rankBeats(aiMatches as Beat[], preferredEnergy)
      return ranked.slice(page * pageSize, (page + 1) * pageSize)
    }
  }

  // ── Path 2: Genre match on producer-tagged genres ────────────────────────
  if (topGenres.length > 0) {
    let tagQuery = supabase
      .from('beats')
      .select('*, producer:profiles(*)')
      .overlaps('genre', topGenres)
      .order('likes_count', { ascending: false })
      .limit(pageSize)

    if (excludeFilter) {
      tagQuery = tagQuery.not('id', 'in', excludeFilter)
    }

    const { data: tagMatches, error } = await tagQuery
    if (!error && tagMatches && tagMatches.length >= pageSize / 2) {
      return tagMatches as Beat[]
    }
  }

  // ── Path 3: Chronological fallback ───────────────────────────────────────
  let fallback = supabase
    .from('beats')
    .select('*, producer:profiles(*)')
    .order('created_at', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1)

  if (excludeFilter) {
    fallback = fallback.not('id', 'in', excludeFilter)
  }

  const { data: beats, error } = await fallback
  if (error) {
    console.error('Error fetching beats:', error)
    return []
  }
  return (beats ?? []) as Beat[]
}

function rankBeats(beats: Beat[], preferredEnergy: number | null): Beat[] {
  return beats.slice().sort((a, b) => {
    let scoreA = a.likes_count ?? 0
    let scoreB = b.likes_count ?? 0

    // Boost by underground_vibe to surface variety (cap at 1.5x)
    const vibeBoostA = 1 + Math.min((a.underground_vibe ?? 5) / 20, 0.5)
    const vibeBoostB = 1 + Math.min((b.underground_vibe ?? 5) / 20, 0.5)
    scoreA *= vibeBoostA
    scoreB *= vibeBoostB

    // Penalize very high like counts to reduce popularity bias
    if ((a.likes_count ?? 0) > 1000) scoreA *= 0.7
    if ((b.likes_count ?? 0) > 1000) scoreB *= 0.7

    // Boost beats close to preferred energy level
    if (preferredEnergy != null) {
      const diffA = Math.abs((a.ai_energy ?? 5) - preferredEnergy)
      const diffB = Math.abs((b.ai_energy ?? 5) - preferredEnergy)
      scoreA *= 1 + Math.max(0, (5 - diffA) / 10)
      scoreB *= 1 + Math.max(0, (5 - diffB) / 10)
    }

    return scoreB - scoreA
  })
}

export async function fetchBeatsByProducer(
  supabase: SupabaseClient,
  producerId: string
): Promise<Beat[]> {
  const { data, error } = await supabase
    .from('beats')
    .select('*, producer:profiles(*)')
    .eq('producer_id', producerId)
    .order('created_at', { ascending: false })

  if (error) return []
  return (data ?? []) as Beat[]
}
