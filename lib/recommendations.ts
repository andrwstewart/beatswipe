import type { Beat } from '@/types'

type SupabaseClient = Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>

export async function fetchRecommendedBeats(
  supabase: SupabaseClient,
  userId: string,
  page = 0,
  pageSize = 10
): Promise<Beat[]> {
  // Phase 1: fetch all context data in parallel
  // listen_events now includes type_beat_tags so we can build artist affinity
  const [{ data: disliked }, { data: seen }, { data: listenData }, { data: likedInteractions }] =
    await Promise.all([
      supabase
        .from('interactions')
        .select('beat_id')
        .eq('user_id', userId)
        .eq('type', 'dislike'),

      supabase
        .from('interactions')
        .select('beat_id')
        .eq('user_id', userId)
        .in('type', ['play', 'like', 'favorite', 'download']),

      // Last 200 listen events — pull type_beat_tags alongside genre/energy
      supabase
        .from('listen_events')
        .select('listen_seconds, beats(genre, ai_genres, ai_energy, type_beat_tags)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(200),

      // Liked beats for fallback profiles
      supabase
        .from('interactions')
        .select('beats(genre, ai_genres, ai_energy, type_beat_tags)')
        .eq('user_id', userId)
        .eq('type', 'like')
        .limit(50),
    ])

  const dislikedIds = disliked?.map((d: { beat_id: string }) => d.beat_id) ?? []
  const seenIds = seen?.map((s: { beat_id: string }) => s.beat_id) ?? []
  const excludeIds = [...new Set([...dislikedIds, ...seenIds])]
  const excludeFilter =
    excludeIds.length > 0
      ? `(${excludeIds.map((id) => `'${id}'`).join(',')})`
      : null

  // ── Build type beat artist affinity (PRIMARY signal) ──────────────────────
  // Seconds listened per artist tag: e.g. { "Playboi Carti": 340, "Lil Uzi Vert": 180 }
  const typeBeatSeconds: Record<string, number> = {}

  listenData?.forEach((e: Record<string, unknown>) => {
    const beat = e.beats as { type_beat_tags?: string[] | null } | null
    const secs = e.listen_seconds as number
    if (!beat || !secs) return
    ;(beat.type_beat_tags ?? []).forEach((artist) => {
      typeBeatSeconds[artist] = (typeBeatSeconds[artist] ?? 0) + secs
    })
  })

  // Fall back to liked beats if no listen data
  if (Object.keys(typeBeatSeconds).length === 0 && likedInteractions) {
    likedInteractions.forEach((i: Record<string, unknown>) => {
      const beat = i.beats as { type_beat_tags?: string[] | null } | null
      ;(beat?.type_beat_tags ?? []).forEach((artist) => {
        typeBeatSeconds[artist] = (typeBeatSeconds[artist] ?? 0) + 30 // weight liked = 30s each
      })
    })
  }

  const maxTypeBeatSeconds = Math.max(...Object.values(typeBeatSeconds), 1)

  // Top 6 artists the user listens to most
  const topTypeBeatArtists = Object.entries(typeBeatSeconds)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([artist]) => artist)

  // ── Build genre affinity (SECONDARY signal) ───────────────────────────────
  const genreListenSeconds: Record<string, number> = {}

  listenData?.forEach((e: Record<string, unknown>) => {
    const beat = e.beats as { genre?: string[]; ai_genres?: string[]; ai_energy?: number } | null
    const secs = e.listen_seconds as number
    if (!beat || !secs) return
    ;[...(beat.genre ?? []), ...(beat.ai_genres ?? [])].forEach((g) => {
      genreListenSeconds[g] = (genreListenSeconds[g] ?? 0) + secs
    })
  })

  // ── Energy preference ─────────────────────────────────────────────────────
  let preferredEnergy: number | null = null
  if (listenData && listenData.length > 0) {
    let weightedSum = 0
    let weightTotal = 0
    listenData.forEach((e: Record<string, unknown>) => {
      const beat = e.beats as { ai_energy?: number } | null
      const secs = e.listen_seconds as number
      if (beat?.ai_energy != null && secs > 0) {
        weightedSum += beat.ai_energy * secs
        weightTotal += secs
      }
    })
    if (weightTotal > 0) preferredEnergy = Math.round(weightedSum / weightTotal)
  }
  if (preferredEnergy === null && likedInteractions) {
    const vals: number[] = []
    likedInteractions.forEach((i: Record<string, unknown>) => {
      const beat = i.beats as { ai_energy?: number } | null
      if (beat?.ai_energy != null) vals.push(beat.ai_energy)
    })
    if (vals.length > 0) preferredEnergy = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
  }

  // ── Top genres (for fallback path) ───────────────────────────────────────
  let topGenres: string[] = []
  if (Object.keys(genreListenSeconds).length > 0) {
    topGenres = Object.entries(genreListenSeconds)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([g]) => g)
  } else if (likedInteractions) {
    const counts: Record<string, number> = {}
    likedInteractions.forEach((i: Record<string, unknown>) => {
      const beat = i.beats as { genre?: string[]; ai_genres?: string[] } | null
      if (!beat) return
      ;[...(beat.genre ?? []), ...(beat.ai_genres ?? [])].forEach((g) => {
        counts[g] = (counts[g] ?? 0) + 1
      })
    })
    topGenres = Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([g]) => g)
  }

  // ── Phase 2: Audio embedding similarity ───────────────────────────────────
  const embeddingBoostMap = new Map<string, number>()
  const embeddingSimilarIds: string[] = []

  try {
    const { data: embeddingSimilar } = await supabase.rpc('match_beats_for_user', {
      target_user_id: userId,
      match_count: 30,
      match_threshold: 0.55,
      exclude_ids: excludeIds,
    })
    if (Array.isArray(embeddingSimilar)) {
      for (const row of embeddingSimilar as Array<{ id: string; similarity: number }>) {
        embeddingBoostMap.set(row.id, row.similarity)
        embeddingSimilarIds.push(row.id)
      }
    }
  } catch {
    // best-effort — skips if migration 004 hasn't been run
  }

  // ── Path 1 (primary): type beat artist match + embedding similar ──────────
  const hasTypeBeatSignal = topTypeBeatArtists.length > 0
  const hasEmbeddingSignal = embeddingSimilarIds.length > 0

  if (hasTypeBeatSignal || hasEmbeddingSignal) {
    const [{ data: typeBeatMatches }, { data: embeddingMatches }] = await Promise.all([
      hasTypeBeatSignal
        ? (() => {
            let q = supabase
              .from('beats')
              .select('*, producer:profiles(*)')
              .overlaps('type_beat_tags', topTypeBeatArtists)
              .limit(pageSize * 4)
            if (excludeFilter) q = q.not('id', 'in', excludeFilter)
            return q
          })()
        : Promise.resolve({ data: [] as Beat[] }),
      hasEmbeddingSignal
        ? supabase
            .from('beats')
            .select('*, producer:profiles(*)')
            .in('id', embeddingSimilarIds)
        : Promise.resolve({ data: [] as Beat[] }),
    ])

    const poolMap = new Map<string, Beat>()
    for (const beat of [...(typeBeatMatches ?? []), ...(embeddingMatches ?? [])] as Beat[]) {
      if (!poolMap.has(beat.id)) poolMap.set(beat.id, beat)
    }

    if (poolMap.size >= pageSize / 2) {
      const ranked = rankBeats(
        [...poolMap.values()],
        preferredEnergy,
        typeBeatSeconds,
        maxTypeBeatSeconds,
        embeddingBoostMap
      )
      return ranked.slice(page * pageSize, (page + 1) * pageSize)
    }
  }

  // ── Path 2: AI genre match ─────────────────────────────────────────────────
  if (topGenres.length > 0) {
    let aiQuery = supabase
      .from('beats')
      .select('*, producer:profiles(*)')
      .eq('analysis_status', 'completed')
      .overlaps('ai_genres', topGenres)
      .limit(pageSize * 3)
    if (excludeFilter) aiQuery = aiQuery.not('id', 'in', excludeFilter)

    const { data: aiMatches } = await aiQuery

    if (aiMatches && aiMatches.length >= pageSize / 2) {
      const ranked = rankBeats(
        aiMatches as Beat[],
        preferredEnergy,
        typeBeatSeconds,
        maxTypeBeatSeconds,
        embeddingBoostMap
      )
      return ranked.slice(page * pageSize, (page + 1) * pageSize)
    }
  }

  // ── Path 3: Producer-tagged genre match ────────────────────────────────────
  if (topGenres.length > 0) {
    let tagQuery = supabase
      .from('beats')
      .select('*, producer:profiles(*)')
      .overlaps('genre', topGenres)
      .limit(pageSize * 2)
    if (excludeFilter) tagQuery = tagQuery.not('id', 'in', excludeFilter)

    const { data: tagMatches } = await tagQuery

    if (tagMatches && tagMatches.length >= pageSize / 2) {
      const ranked = rankBeats(
        tagMatches as Beat[],
        preferredEnergy,
        typeBeatSeconds,
        maxTypeBeatSeconds,
        embeddingBoostMap
      )
      return ranked.slice(page * pageSize, (page + 1) * pageSize)
    }
  }

  // ── Path 4: Chronological fallback ────────────────────────────────────────
  let fallback = supabase
    .from('beats')
    .select('*, producer:profiles(*)')
    .order('created_at', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1)
  if (excludeFilter) fallback = fallback.not('id', 'in', excludeFilter)

  const { data: beats, error } = await fallback
  if (error) {
    console.error('Error fetching beats:', error)
    return []
  }
  return (beats ?? []) as Beat[]
}

function rankBeats(
  beats: Beat[],
  preferredEnergy: number | null,
  typeBeatSeconds: Record<string, number>,
  maxTypeBeatSeconds: number,
  embeddingBoostMap: Map<string, number> = new Map()
): Beat[] {
  return beats.slice().sort((a, b) => {
    const sA = beatScore(a, preferredEnergy, typeBeatSeconds, maxTypeBeatSeconds, embeddingBoostMap)
    const sB = beatScore(b, preferredEnergy, typeBeatSeconds, maxTypeBeatSeconds, embeddingBoostMap)
    return sB - sA
  })
}

function beatScore(
  beat: Beat,
  preferredEnergy: number | null,
  typeBeatSeconds: Record<string, number>,
  maxTypeBeatSeconds: number,
  embeddingBoostMap: Map<string, number>
): number {
  // ── Type beat affinity (65%) — PRIMARY ────────────────────────────────────
  const rawTypeBeat = (beat.type_beat_tags ?? []).reduce(
    (sum, artist) => sum + (typeBeatSeconds[artist] ?? 0),
    0
  )
  const typeBeatAffinity = Math.min(rawTypeBeat / maxTypeBeatSeconds, 1)

  // ── Popularity (25%) — log-scaled so viral beats don't dominate ───────────
  const likesScore = Math.log1p(beat.likes_count ?? 0) / Math.log1p(10000)

  // ── Energy match (10%) ────────────────────────────────────────────────────
  const energyMatch =
    preferredEnergy != null
      ? Math.max(0, 1 - Math.abs((beat.ai_energy ?? 5) - preferredEnergy) / 10)
      : 0.5

  // ── Multipliers ───────────────────────────────────────────────────────────
  const vibeBoost = 1 + Math.min((beat.underground_vibe ?? 5) / 40, 0.25)  // up to +25%
  const embeddingBoost = 1 + (embeddingBoostMap.get(beat.id) ?? 0) * 0.3   // up to +30%

  return (
    typeBeatAffinity * 0.65 +
    likesScore       * 0.25 +
    energyMatch      * 0.10
  ) * vibeBoost * embeddingBoost
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
