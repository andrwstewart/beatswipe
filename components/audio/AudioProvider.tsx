'use client'

import { createContext, useCallback, useRef, useState } from 'react'

interface AudioContextValue {
  activeBeatId: string | null
  play: (beatId: string) => void
  pause: () => void
}

export const AudioContext = createContext<AudioContextValue | null>(null)

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [activeBeatId, setActiveBeatId] = useState<string | null>(null)
  // Callbacks registered by each WaveformPlayer to imperatively play/pause
  const playerCallbacks = useRef<Map<string, { play: () => void; pause: () => void }>>(new Map())

  const registerPlayer = useCallback(
    (beatId: string, callbacks: { play: () => void; pause: () => void }) => {
      playerCallbacks.current.set(beatId, callbacks)
      return () => playerCallbacks.current.delete(beatId)
    },
    []
  )

  const play = useCallback((beatId: string) => {
    // Pause currently active player
    if (activeBeatId && activeBeatId !== beatId) {
      playerCallbacks.current.get(activeBeatId)?.pause()
    }
    playerCallbacks.current.get(beatId)?.play()
    setActiveBeatId(beatId)
  }, [activeBeatId])

  const pause = useCallback(() => {
    if (activeBeatId) {
      playerCallbacks.current.get(activeBeatId)?.pause()
    }
    setActiveBeatId(null)
  }, [activeBeatId])

  return (
    <AudioContext.Provider value={{ activeBeatId, play, pause }}>
      <AudioRegistryContext.Provider value={{ registerPlayer }}>
        {children}
      </AudioRegistryContext.Provider>
    </AudioContext.Provider>
  )
}

interface AudioRegistryValue {
  registerPlayer: (
    beatId: string,
    callbacks: { play: () => void; pause: () => void }
  ) => () => void
}

export const AudioRegistryContext = createContext<AudioRegistryValue | null>(null)
