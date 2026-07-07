'use client'

import { useContext, useEffect, useRef, useState } from 'react'
import { AudioRegistryContext } from './AudioProvider'

interface WaveformPlayerProps {
  beatId: string
  audioUrl: string
  // When provided (BeatCard), audio is managed externally — WaveformPlayer is visuals only.
  // When absent (BeatGrid), WaveformPlayer creates and controls its own audio element.
  audioRef?: React.MutableRefObject<HTMLAudioElement | null>
  isActive?: boolean
  durationSeconds?: number | null
  onReady?: () => void
  onFinish?: () => void
  onPlayStateChange?: (playing: boolean) => void
}

// Decorative peaks seeded from beat ID — render instantly with no network request.
// Replaced by real decoded peaks ~1.5s after the card becomes active.
function generatePeaks(seed: string, count = 120): [number[], number[]] {
  let h = 5381
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul((h << 5) + h, 1) ^ seed.charCodeAt(i)) >>> 0
  }
  const pos: number[] = []
  const neg: number[] = []
  for (let i = 0; i < count; i++) {
    h = (Math.imul(h, 1664525) + 1013904223) >>> 0
    const v = (h / 0xffffffff) * 0.85 + 0.1
    pos.push(v)
    neg.push(-v * 0.75)
  }
  return [pos, neg]
}

export function WaveformPlayer({
  beatId,
  audioUrl,
  audioRef: externalAudioRef,
  isActive,
  durationSeconds,
  onReady,
  onFinish,
  onPlayStateChange,
}: WaveformPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const wavesurferRef = useRef<import('wavesurfer.js').default | null>(null)
  // Only used in self-managed mode (BeatGrid — no externalAudioRef).
  const ownAudioRef = useRef<HTMLAudioElement | null>(null)
  const [ready, setReady] = useState(false)
  const registry = useContext(AudioRegistryContext)
  const pendingPlayRef = useRef(false)
  const isActiveRef = useRef(isActive)
  const onPlayStateChangeRef = useRef(onPlayStateChange)
  const onFinishRef = useRef(onFinish)

  useEffect(() => { isActiveRef.current = isActive }, [isActive])
  useEffect(() => { onPlayStateChangeRef.current = onPlayStateChange }, [onPlayStateChange])
  useEffect(() => { onFinishRef.current = onFinish }, [onFinish])

  // ── Self-managed audio (BeatGrid / profile modal only) ───────────────────────
  // Skipped entirely when externalAudioRef is provided (BeatCard handles audio).
  useEffect(() => {
    if (externalAudioRef) return

    const audio = new Audio()
    audio.preload = 'auto'
    audio.src = audioUrl
    ownAudioRef.current = audio

    const onPlay  = () => onPlayStateChangeRef.current?.(true)
    const onPause = () => onPlayStateChangeRef.current?.(false)
    const onEnded = () => {
      audio.currentTime = 0
      onPlayStateChangeRef.current?.(false)
      onFinishRef.current?.()
    }
    audio.addEventListener('play',  onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnded)
    return () => {
      audio.removeEventListener('play',  onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onEnded)
      audio.pause()
      audio.removeAttribute('src')
      ownAudioRef.current = null
    }
  }, [audioUrl, externalAudioRef])

  useEffect(() => {
    if (externalAudioRef) return
    const audio = ownAudioRef.current
    if (!audio) return
    if (isActive) {
      const r = audio.play() as Promise<void> | undefined
      if (r) r.catch(() => { pendingPlayRef.current = true })
    } else {
      audio.pause()
      pendingPlayRef.current = false
    }
  }, [isActive, externalAudioRef])

  useEffect(() => {
    if (externalAudioRef) return
    const retry = () => {
      if (pendingPlayRef.current && ownAudioRef.current && isActiveRef.current) {
        ownAudioRef.current.play()
        pendingPlayRef.current = false
      }
    }
    document.addEventListener('touchend', retry, { passive: true })
    document.addEventListener('mousedown', retry)
    return () => {
      document.removeEventListener('touchend', retry)
      document.removeEventListener('mousedown', retry)
    }
  }, [externalAudioRef])

  // ── WaveSurfer (visual waveform) — used in both modes ───────────────────────
  useEffect(() => {
    if (!containerRef.current) return

    let ws: import('wavesurfer.js').default
    let realPeaksTimer: ReturnType<typeof setTimeout> | null = null

    async function init() {
      const WaveSurfer = (await import('wavesurfer.js')).default
      if (!containerRef.current) return

      // Use the external audio element (BeatCard) or our own (BeatGrid).
      const mediaEl = externalAudioRef ? externalAudioRef.current : ownAudioRef.current
      if (!mediaEl) return

      ws = WaveSurfer.create({
        container: containerRef.current!,
        waveColor: 'rgba(255, 255, 255, 0.25)',
        progressColor: '#00ff88',
        height: 72,
        barWidth: 2,
        barGap: 2,
        barRadius: 3,
        interact: true,
        media: mediaEl,
        url: audioUrl,
        peaks: generatePeaks(beatId),
        duration: durationSeconds ?? 180,
      })

      wavesurferRef.current = ws

      ws.on('ready', () => {
        setReady(true)
        onReady?.()

        // After fake peaks are showing, load real waveform in background.
        // 1.5s delay ensures audio playback has started before we add a
        // competing decode request.
        realPeaksTimer = setTimeout(() => {
          if (wavesurferRef.current === ws) {
            ws.load(audioUrl).catch(() => {})
          }
        }, 1500)
      })

      ws.on('finish', () => ws.seekTo(0))

      if (registry) {
        const unregister = registry.registerPlayer(beatId, {
          play:  () => ws.play(),
          pause: () => ws.pause(),
        })
        return unregister
      }
    }

    const cleanupPromise = init()

    return () => {
      if (realPeaksTimer !== null) clearTimeout(realPeaksTimer)
      cleanupPromise.then((unregister) => {
        unregister?.()
        wavesurferRef.current = null
        ws?.destroy()
      })
    }
  }, [beatId]) // eslint-disable-line react-hooks/exhaustive-deps

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
                style={{ height: `${h}px`, animationDelay: `${i * 50}ms` }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
