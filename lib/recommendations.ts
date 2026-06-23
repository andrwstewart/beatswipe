import type { Beat } from '@/types'

export async function fetchRecommendedBeats(
  supabase: ReturnType<typeof import('@/lib/supabase/server').createClient> extends Promise<infer T> ? T : never,
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

  const dislikedIds = disliked?.map((d) => d.beat_id) ?? []

  // Get beats the user has already seen (played/liked)
  const { data: seen } = await supabase
    .from('interactions')
    .select('beat_id')
    .eq('user_id', userId)
    .in('type', ['play', 'like', 'favorite', 'download'])

  const seenIds = seen?.map((s) => s.beat_id) ?? []

  // Build exclusion list
  const excludeIds = [...new Set([...dislikedIds, ...seenIds])]

  // Get user's preferred genres from likes
  const { data: likedInteractions } = await supabase
    .from('interactions')
    .select('beats(genre)')
    .eq('user_id', userId)
    .eq('type', 'like')
    .limit(20)

  const likedGenres = likedInteractions
    ?.flatMap((i: Record<string, unknown>) => {
      const beat = i.beats as { genre: string[] } | null
      return beat?.genre ?? []
    })
    .filter(Boolean) ?? []

  const genreCounts: Record<string, number> = {}
  likedGenres.forEach((g) => {
    genreCounts[g] = (genreCounts[g] ?? 0) + 1
  })

  const topGenres = Object.entries(genreCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([g]) => g)

  // Query beats — prefer matching genres, exclude seen/disliked
  let query = supabase
    .from('beats')
    .select('*, producer:profiles(*)')
    .order('created_at', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1)

  if (excludeIds.length > 0) {
    query = query.not('id', 'in', `(${excludeIds.map((id) => `'${id}'`).join(',')})`)
  }

  // If we have genre preferences, try to serve matching beats first
  if (topGenres.length > 0) {
    const { data: genreMatches, error } = await supabase
      .from('beats')
      .select('*, producer:profiles(*)')
      .overlaps('genre', topGenres)
      .not('id', 'in', excludeIds.length > 0 ? `(${excludeIds.map((id) => `'${id}'`).join(',')})` : '()')
      .order('likes_count', { ascending: false })
      .limit(pageSize)

    if (!error && genreMatches && genreMatches.length >= pageSize / 2) {
      return genreMatches as Beat[]
    }
  }

  const { data: beats, error } = await query

  if (error) {
    console.error('Error fetching beats:', error)
    return []
  }

  return (beats ?? []) as Beat[]
}

export async function fetchBeatsByProducer(
  supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>,
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
