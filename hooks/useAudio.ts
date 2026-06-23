'use client'

import { useCallback, useContext } from 'react'
import { AudioContext } from '@/components/audio/AudioProvider'

export function useAudio() {
  const ctx = useContext(AudioContext)

  if (!ctx) {
    throw new Error('useAudio must be used inside AudioProvider')
  }

  const isPlaying = useCallback(
    (beatId: string) => ctx.activeBeatId === beatId,
    [ctx.activeBeatId]
  )

  return {
    activeBeatId: ctx.activeBeatId,
    play: ctx.play,
    pause: ctx.pause,
    isPlaying,
  }
}
