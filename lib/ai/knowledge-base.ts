import OpenAI from 'openai'
import type { SupabaseClient } from '@supabase/supabase-js'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

export interface KnowledgeEntry {
  artist_name: string
  style_description: string
  associated_genres: string[]
  typical_bpm_range: string
  mood_tags: string[]
  underground_level: number
  era: string
  similar_artists: string[]
  similarity?: number
}

export async function searchKnowledgeBase(
  supabase: SupabaseClient,
  queryText: string,
  limit = 15
): Promise<KnowledgeEntry[]> {
  const embeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: queryText,
  })
  const embedding = embeddingResponse.data[0].embedding

  const { data, error } = await supabase.rpc('match_music_knowledge', {
    query_embedding: embedding,
    match_threshold: 0.3,
    match_count: limit,
  })

  if (error) throw new Error(`Knowledge base search failed: ${error.message}`)

  return (data as KnowledgeEntry[]) ?? []
}
