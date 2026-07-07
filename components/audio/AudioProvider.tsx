'use client'

import { createContext, useCallback, useEffect, useRef, useState } from 'react'

// Unlock iOS audio context on first touch so subsequent async audio.play()
// calls don't require the user to be inside a gesture handler.
function useIOSAudioUnlock() {
  useEffect(() => {
    const unlock = () => {
      const a = new Audio()
      // Tiny silent WAV — plays instantly, costs nothing, unlocks iOS audio.
      a.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='
      a.play().catch(() => {})
    }
    document.addEventListener('touchstart', unlock, { once: true, passive: true })
    return () => document.removeEventListener('touchstart', unlock)
  }, [])
}

interface AudioContextValue {
  activeBeatId: string | null
  play: (beatId: string) => void
  pause: () => void
}

export const AudioContext = createContext<AudioContextValue | null>(null)

export function AudioProvider({ children }: { children: React.ReactNode }) {
  useIOSAudioUnlock()
  const [activeBeatId, setActiveBeatId] = useState<string | null>(null)
  // Callbacks registered by each WaveformPlayer to imperatively play/pause
  const playerCallbacks = useRef<Map<string, { play: () => void; pause: () => void }>>(new Map())

  const registerPlayer = useCallback(
    (beatId: string, callbacks: { play: () => void; pause: () => void }) => {
      // Store a stable object reference so the cleanup below can check
      // whether a newer instance has since taken over this slot.
      const entry = callbacks
      playerCallbacks.current.set(beatId, entry)
      return () => {
        // Only remove if this exact registration is still the current one.
        // If a later mount of the same beatId has overwritten the slot,
        // leave it alone — deleting it would silence the still-visible copy.
        if (playerCallbacks.current.get(beatId) === entry) {
          playerCallbacks.current.delete(beatId)
        }
      }
    },
    []
  )

  const play = useCallback((beatId: string) => {
    // Pause currently active player via its registered callback.
    // We do NOT call the new beat's play() callback here — each WaveformPlayer
    // drives its own wavesurfer directly via its isActive prop. Calling the
    // callback would risk playing the wrong instance when the same beat appears
    // at multiple positions in the loop (the registered slot always holds the
    // LAST instance to mount, not necessarily the one on screen).
    if (activeBeatId && activeBeatId !== beatId) {
      playerCallbacks.current.get(activeBeatId)?.pause()
    }
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
