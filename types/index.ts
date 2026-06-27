export type UserRole = 'artist' | 'producer' | 'both'

export type InteractionType = 'like' | 'dislike' | 'favorite' | 'download' | 'play'

export type NotificationType = 'like' | 'download' | 'message' | 'follow'

export interface Profile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  banner_url: string | null
  bio: string | null
  location: string | null
  role: UserRole
  placements: string[] | null
  instagram_url: string | null
  discord_url: string | null
  tiktok_url: string | null
  soundcloud_url: string | null
  created_at: string
}

export interface Beat {
  id: string
  producer_id: string
  title: string
  bpm: number | null
  key: string | null
  genre: string[] | null
  mood: string[] | null
  type_beat_tags?: string[] | null
  description: string | null
  audio_url: string
  cover_url: string | null
  video_url: string | null
  duration_seconds: number | null
  plays: number
  likes_count: number
  downloads_count: number
  created_at: string
  producer?: Profile
  // AI analysis fields
  detailed_description?: string | null
  recommended_artists?: string[] | null
  ai_genres?: string[] | null
  ai_mood?: string | null
  ai_energy?: number | null
  ai_key_features?: string[] | null
  underground_vibe?: number | null
  ai_analysis?: Record<string, unknown> | null
  analysis_status?: string | null
}

export interface Interaction {
  id: string
  user_id: string
  beat_id: string
  type: InteractionType
  duration_ms: number | null
  created_at: string
}

export interface Follow {
  follower_id: string
  following_id: string
}

export interface Conversation {
  id: string
  participant_a: string
  participant_b: string
  last_message_at: string | null
  other_user?: Profile
  last_message?: Message
  has_unread?: boolean
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string | null
  audio_url: string | null
  file_url: string | null
  read_at: string | null
  created_at: string
  sender?: Profile
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  data: Record<string, unknown>
  read: boolean
  created_at: string
}

export interface BeatWithInteraction extends Beat {
  userLiked?: boolean
  userFavorited?: boolean
  userDownloaded?: boolean
}

export const GENRES = [
  'Trap', 'Drill', 'Boom Bap', 'Lo-Fi', 'R&B', 'Afrobeats',
  'Dancehall', 'Pop', 'Jersey Club', 'Grime', 'UK Drill',
  'Phonk', 'Latin Trap', 'Cloud Rap',
] as const

export const KEYS = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
  'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm',
] as const

export const MOODS = [
  'Dark', 'Melodic', 'Hard', 'Chill', 'Energetic', 'Sad', 'Hype', 'Romantic',
] as const

export type Genre = typeof GENRES[number]
export type Key = typeof KEYS[number]
export type Mood = typeof MOODS[number]
