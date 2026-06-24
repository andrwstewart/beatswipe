import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { searchKnowledgeBase } from './knowledge-base'
import type { Beat } from '@/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export interface BeatAnalysis {
  detailed_description: string
  ai_genres: string[]
  ai_mood: string
  ai_energy: number
  ai_key_features: string[]
  underground_vibe: number
  recommended_artists: string[]
}

const ANALYSIS_TOOL: Anthropic.Tool = {
  name: 'submit_beat_analysis',
  description: 'Submit the complete structured analysis of a beat',
  input_schema: {
    type: 'object' as const,
    properties: {
      detailed_description: {
        type: 'string',
        description:
          '250-400 word professional description of the beat covering its sonic character, emotional tone, potential use cases, and what makes it distinctive.',
      },
      ai_genres: {
        type: 'array',
        items: { type: 'string' },
        description:
          '2-5 genre tags from most to least specific (e.g. ["Memphis Phonk", "Dark Trap", "Trap"])',
      },
      ai_mood: {
        type: 'string',
        description:
          'Single mood word (e.g. Menacing, Melancholy, Hypnotic, Aggressive, Ethereal, Hype)',
      },
      ai_energy: {
        type: 'number',
        description:
          'Energy level 1-10 (1=ambient/quiet, 5=mid-energy, 10=maximum intensity)',
      },
      ai_key_features: {
        type: 'array',
        items: { type: 'string' },
        description:
          '3-6 specific sonic elements that define this beat (e.g. "distorted 808", "chopped piano sample", "hi-hat rolls")',
      },
      underground_vibe: {
        type: 'number',
        description:
          'Underground/niche score 1-10 (1=mainstream pop, 5=crossover, 10=ultra-niche underground)',
      },
      recommended_artists: {
        type: 'array',
        items: { type: 'string' },
        description: '3-6 artist names (rappers/singers) who would sound great over this beat',
      },
    },
    required: [
      'detailed_description',
      'ai_genres',
      'ai_mood',
      'ai_energy',
      'ai_key_features',
      'underground_vibe',
      'recommended_artists',
    ],
  },
}

const SYSTEM_PROMPT = `You are an elite music producer analyst and Underground Music Expert with encyclopedic knowledge of hip-hop, trap, phonk, lo-fi, UK drill, rage/plugg, experimental music, and every niche subgenre in between. You have deep knowledge of both underground and mainstream producers and artists.

Your task is to analyze beat metadata and provide professional, nuanced analysis that would be valuable to both artists looking for beats and producers seeking feedback. You understand:
- Sonic texture: how elements interact, mix decisions, frequency content
- Cultural context: what scenes/artists/eras a beat connects to
- Emotional resonance: what feeling the music creates
- Technical craft: specific production techniques used

Be specific and detailed. Avoid generic descriptions. Use accurate genre terminology. Make intelligent inferences from the metadata provided — BPM, key, genre tags, and description all reveal a great deal about a beat's character.`

export async function analyzeBeat(beat: Beat): Promise<BeatAnalysis> {
  const serviceRole = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Build RAG query from beat metadata
  const ragQuery = [
    beat.genre?.join(' '),
    beat.mood?.join(' '),
    beat.bpm ? `${beat.bpm} BPM` : '',
    beat.key ?? '',
    beat.description ?? '',
  ]
    .filter(Boolean)
    .join(', ')

  // Fetch similar artists from knowledge base
  let knowledgeContext = ''
  try {
    const entries = await searchKnowledgeBase(serviceRole, ragQuery, 15)
    if (entries.length > 0) {
      knowledgeContext =
        '\n\nRELEVANT ARTIST CONTEXT (use this to inform your analysis and recommendations):\n'
      knowledgeContext += entries
        .map(
          (e) =>
            `• ${e.artist_name} (${e.associated_genres?.join(', ')}, ${e.typical_bpm_range} BPM, underground_level=${e.underground_level}): ${e.style_description.slice(0, 300)}...`
        )
        .join('\n')
    }
  } catch {
    // RAG failure is non-blocking
  }

  const prompt = `Analyze this beat and use the submit_beat_analysis tool to return your structured assessment.

BEAT METADATA:
Title: ${beat.title}
Producer: ${beat.producer?.display_name ?? beat.producer?.username ?? 'Unknown'}
BPM: ${beat.bpm ?? 'Unknown'}
Key: ${beat.key ?? 'Unknown'}
Genres (producer-tagged): ${beat.genre?.join(', ') ?? 'None'}
Moods (producer-tagged): ${beat.mood?.join(', ') ?? 'None'}
Producer description: ${beat.description ?? 'None'}
${knowledgeContext}`

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    system: SYSTEM_PROMPT,
    tools: [ANALYSIS_TOOL],
    tool_choice: { type: 'any' },
    messages: [{ role: 'user', content: prompt }],
  })

  // Extract tool use result
  const toolUse = response.content.find((c) => c.type === 'tool_use')
  if (toolUse && toolUse.type === 'tool_use') {
    return toolUse.input as BeatAnalysis
  }

  // Fallback: try to parse text response as JSON
  const textBlock = response.content.find((c) => c.type === 'text')
  if (textBlock && textBlock.type === 'text') {
    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as BeatAnalysis
    }
  }

  throw new Error('Claude returned no structured analysis')
}
