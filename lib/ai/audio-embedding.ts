import OpenAI from 'openai'

const MAX_AUDIO_BYTES = 15 * 1024 * 1024 // 15 MB raw (~20 MB base64 — within gpt-4o-audio-preview limit)

export interface BeatEmbeddingMetadata {
  title: string
  bpm?: number | null
  key?: string | null
  genre?: string[] | null
  description?: string | null
  detailed_description?: string | null
  ai_key_features?: string[] | null
  ai_mood?: string | null
}

/**
 * Generate a 1536-dim embedding for a beat.
 * Primary path: gpt-4o-audio-preview listens to the audio and writes a sonic description,
 * which is then embedded with text-embedding-3-small.
 * Fallback: embed from metadata/description only.
 */
export async function generateAudioEmbedding(
  audioUrl: string,
  metadata: BeatEmbeddingMetadata
): Promise<number[]> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

  try {
    return await audioAnalysisEmbedding(openai, audioUrl, metadata)
  } catch (err) {
    console.warn('[audio-embedding] Audio path failed, using metadata fallback:', String(err))
    return await metadataEmbedding(openai, metadata)
  }
}

async function audioAnalysisEmbedding(
  openai: OpenAI,
  audioUrl: string,
  metadata: BeatEmbeddingMetadata
): Promise<number[]> {
  const res = await fetch(audioUrl)
  if (!res.ok) throw new Error(`Audio fetch failed: ${res.status}`)

  const buffer = await res.arrayBuffer()
  if (buffer.byteLength > MAX_AUDIO_BYTES) {
    throw new Error(
      `Audio too large (${(buffer.byteLength / 1024 / 1024).toFixed(1)} MB > 15 MB); using metadata fallback`
    )
  }

  const base64 = Buffer.from(buffer).toString('base64')

  // Determine format from URL (strip query params like Supabase signed URL tokens)
  const cleanUrl = audioUrl.split('?')[0]
  const ext = cleanUrl.split('.').pop()?.toLowerCase() ?? 'mp3'
  const format: 'mp3' | 'wav' = ext === 'wav' ? 'wav' : 'mp3'

  const contextLine = [
    `Title: ${metadata.title}`,
    metadata.bpm ? `${metadata.bpm} BPM` : null,
    metadata.key ? `Key: ${metadata.key}` : null,
    metadata.genre?.length ? `Genre: ${metadata.genre.join(', ')}` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-audio-preview',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'input_audio',
            input_audio: { data: base64, format },
          },
          {
            type: 'text',
            text: `You are a music production analyst specializing in underground hip-hop, trap, and electronic music. Listen to this beat and write a detailed sonic description for music similarity search.\n\nContext: ${contextLine}\n\nDescribe in 200-250 words covering:\n1. Tempo and rhythmic feel (BPM, groove, swing, hi-hat patterns, percussion)\n2. Harmonic content (key, scale, chord progressions, melody character)\n3. Sound design (808 character and tuning, synth textures, sample texture)\n4. Production style (mixing, compression, reverb/space treatment, lo-fi vs hi-fi)\n5. Energy and dynamics (intro, build pattern, drop characteristics)\n6. Emotional atmosphere (specific mood words)\n7. Exact subgenre placement (be specific: e.g. "Atlanta plugg", "SoundCloud rage", "Memphis phonk")\n8. Sonic similarity to (3-5 producer names)\n\nBe technical and specific — this description is used for audio similarity matching.`,
          },
        ],
      },
    ],
    max_tokens: 350,
  })

  const sonicDescription = completion.choices[0]?.message?.content
  if (!sonicDescription) throw new Error('No description returned from gpt-4o-audio-preview')

  const embeddingRes = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: `BEAT SONIC ANALYSIS:\n${sonicDescription}`,
  })

  return embeddingRes.data[0].embedding
}

async function metadataEmbedding(
  openai: OpenAI,
  metadata: BeatEmbeddingMetadata
): Promise<number[]> {
  const text = [
    `Title: ${metadata.title}`,
    metadata.bpm ? `BPM: ${metadata.bpm}` : null,
    metadata.key ? `Key: ${metadata.key}` : null,
    metadata.genre?.length ? `Genre: ${metadata.genre.join(', ')}` : null,
    metadata.ai_mood ? `Mood: ${metadata.ai_mood}` : null,
    metadata.ai_key_features?.length
      ? `Features: ${metadata.ai_key_features.join(', ')}`
      : null,
    metadata.detailed_description ?? metadata.description ?? null,
  ]
    .filter(Boolean)
    .join('\n')

  const embeddingRes = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: `BEAT METADATA:\n${text}`,
  })

  return embeddingRes.data[0].embedding
}
