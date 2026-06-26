'use client'

import { useContext, useEffect, useRef, useState } from 'react'
import { AudioRegistryContext } from './AudioProvider'

interface WaveformPlayerProps {
  beatId: string
  audioUrl: string
  isActive: boolean
  onReady?: () => void
  onFinish?: () => void
}

export function WaveformPlayer({
  beatId,
  audioUrl,
  isActive,
  onReady,
  onFinish,
}: WaveformPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const wavesurferRef = useRef<import('wavesurfer.js').default | null>(null)
  const [ready, setReady] = useState(false)
  const registry = useContext(AudioRegistryContext)

  // Tracks whether play() was blocked by the browser's autoplay policy.
  // On mobile, the first play() before any user gesture is rejected silently.
  const pendingPlayRef = useRef(false)
  const isActiveRef = useRef(isActive)
  useEffect(() => { isActiveRef.current = isActive }, [isActive])

  useEffect(() => {
    if (!containerRef.current) return

    let ws: import('wavesurfer.js').default

    async function init() {
      const WaveSurfer = (await import('wavesurfer.js')).default

      ws = WaveSurfer.create({
        container: containerRef.current!,
        waveColor: 'rgba(255, 255, 255, 0.25)',
        progressColor: '#00ff88',
        height: 72,
        barWidth: 2,
        barGap: 2,
        barRadius: 3,
        interact: true,
        url: audioUrl,
        peaks: undefined,
        duration: undefined,
        fetchParams: {
          headers: {},
          mode: 'cors',
        },
      })

      wavesurferRef.current = ws

      ws.on('ready', () => {
        setReady(true)
        onReady?.()
      })

      ws.on('finish', () => {
        // Seek back to start so the next play() call (when user returns to this
        // card) begins from the beginning rather than silently doing nothing at
        // position 1.0.
        ws.seekTo(0)
        onFinish?.()
      })

      // Register play/pause callbacks with the AudioProvider
      if (registry) {
        const unregister = registry.registerPlayer(beatId, {
          play: () => ws.play(),
          pause: () => ws.pause(),
        })
        return unregister
      }
    }

    const cleanupPromise = init()

    return () => {
      cleanupPromise.then((unregister) => {
        unregister?.()
        ws?.destroy()
      })
    }
  }, [audioUrl, beatId])

  // Each WaveformPlayer drives its own wavesurfer directly.
  // AudioProvider.play() only updates activeBeatId state (and pauses the old
  // beat); it no longer calls the registered play() callback. This ensures only
  // the visible card's wavesurfer plays — the registered callback slot can point
  // to the wrong instance when the same beat appears at multiple loop positions.
  useEffect(() => {
    if (!wavesurferRef.current || !ready) return
    if (isActive) {
      const result = wavesurferRef.current.play() as unknown as Promise<void> | void
      // Mobile browsers block autoplay until the first user gesture. If play()
      // returns a rejected promise, mark it pending and retry on first touch.
      if (result && typeof (result as Promise<void>).catch === 'function') {
        ;(result as Promise<void>).catch(() => {
          pendingPlayRef.current = true
        })
      }
    } else {
      wavesurferRef.current.pause()
      pendingPlayRef.current = false
    }
  }, [isActive, ready])

  // Retry play on the first user gesture (touchstart/mousedown) so the active
  // card starts playing the moment the visitor first interacts with the page.
  useEffect(() => {
    const retryPlay = () => {
      if (pendingPlayRef.current && wavesurferRef.current && isActiveRef.current) {
        wavesurferRef.current.play()
        pendingPlayRef.current = false
      }
    }
    document.addEventListener('touchstart', retryPlay, { passive: true })
    document.addEventListener('mousedown', retryPlay)
    return () => {
      document.removeEventListener('touchstart', retryPlay)
      document.removeEventListener('mousedown', retryPlay)
    }
  }, [])

  return (
    <div className="w-full px-4">
      <div
        ref={containerRef}
        className={`waveform-container ${ready ? 'ready' : ''} transition-opacity duration-300`}
        style={{ minHeight: 72 }}
      />
      {!ready && (
        <div className="flex items-center justify-center h-[72px]">
          <div className="flex gap-1 items-end">
            {[30, 45, 20, 55, 35, 50, 25, 60, 40, 15, 50, 35, 55, 28, 48, 22, 56, 38, 44, 18].map((h, i) => (
              <div
                key={i}
                className="w-[2px] bg-white/20 rounded-full animate-pulse"
                style={{
                  height: `${h}px`,
                  animationDelay: `${i * 50}ms`,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
