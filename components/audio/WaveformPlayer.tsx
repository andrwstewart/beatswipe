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

  // Auto-play when this card becomes active
  useEffect(() => {
    if (!wavesurferRef.current || !ready) return

    if (isActive) {
      wavesurferRef.current.play()
    } else {
      wavesurferRef.current.pause()
    }
  }, [isActive, ready])

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
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="w-[2px] bg-white/20 rounded-full animate-pulse"
                style={{
                  height: `${Math.random() * 48 + 8}px`,
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
