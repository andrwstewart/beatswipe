'use client'

import { useCallback, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { InteractionType } from '@/types'

interface UseInteractionOptions {
  beatId: string
  userId: string
  initialLiked?: boolean
  initialFavorited?: boolean
  initialDownloaded?: boolean
  initialLikesCount?: number
  onCollabPrompt?: () => void
}

export function useInteraction({
  beatId,
  userId,
  initialLiked = false,
  initialFavorited = false,
  initialDownloaded = false,
  initialLikesCount = 0,
  onCollabPrompt,
}: UseInteractionOptions) {
  const [liked, setLiked] = useState(initialLiked)
  const [favorited, setFavorited] = useState(initialFavorited)
  const [downloaded, setDownloaded] = useState(initialDownloaded)
  const [likesCount, setLikesCount] = useState(initialLikesCount)
  const [loading, setLoading] = useState(false)

  async function upsertInteraction(type: InteractionType) {
    const supabase = createClient()
    await supabase.from('interactions').upsert(
      { user_id: userId, beat_id: beatId, type },
      { onConflict: 'user_id,beat_id,type' }
    )
  }

  async function deleteInteraction(type: InteractionType) {
    const supabase = createClient()
    await supabase
      .from('interactions')
      .delete()
      .eq('user_id', userId)
      .eq('beat_id', beatId)
      .eq('type', type)
  }

  const like = useCallback(async () => {
    if (loading) return
    setLoading(true)

    const nextLiked = !liked
    setLiked(nextLiked)
    setLikesCount((c) => c + (nextLiked ? 1 : -1))

    try {
      if (nextLiked) {
        await upsertInteraction('like')
        // Remove dislike if present
        await deleteInteraction('dislike')
        onCollabPrompt?.()
      } else {
        await deleteInteraction('like')
      }
    } catch {
      // Revert on error
      setLiked(!nextLiked)
      setLikesCount((c) => c + (nextLiked ? -1 : 1))
    } finally {
      setLoading(false)
    }
  }, [liked, loading, beatId, userId])

  const dislike = useCallback(async () => {
    if (loading) return
    setLoading(true)

    const wasLiked = liked
    if (liked) {
      setLiked(false)
      setLikesCount((c) => c - 1)
    }

    try {
      await upsertInteraction('dislike')
      if (wasLiked) await deleteInteraction('like')
    } catch {
      if (wasLiked) {
        setLiked(true)
        setLikesCount((c) => c + 1)
      }
    } finally {
      setLoading(false)
    }
  }, [liked, loading, beatId, userId])

  const favorite = useCallback(async () => {
    if (loading) return
    setLoading(true)

    const nextFav = !favorited
    setFavorited(nextFav)

    try {
      if (nextFav) {
        await upsertInteraction('favorite')
        onCollabPrompt?.()
      } else {
        await deleteInteraction('favorite')
      }
    } catch {
      setFavorited(!nextFav)
    } finally {
      setLoading(false)
    }
  }, [favorited, loading, beatId, userId])

  const download = useCallback(
    async (audioUrl: string, title: string) => {
      if (loading || downloaded) return
      setLoading(true)

      try {
        const response = await fetch(audioUrl)
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${title}.mp3`
        a.click()
        URL.revokeObjectURL(url)

        setDownloaded(true)
        await upsertInteraction('download')
        onCollabPrompt?.()
      } catch (err) {
        console.error('Download failed', err)
      } finally {
        setLoading(false)
      }
    },
    [downloaded, loading, beatId, userId]
  )

  const logPlay = useCallback(
    async (durationMs?: number) => {
      const supabase = createClient()
      await supabase.from('interactions').upsert(
        { user_id: userId, beat_id: beatId, type: 'play', duration_ms: durationMs ?? null },
        { onConflict: 'user_id,beat_id,type' }
      )
    },
    [beatId, userId]
  )

  return { liked, favorited, downloaded, likesCount, loading, like, dislike, favorite, download, logPlay }
}
