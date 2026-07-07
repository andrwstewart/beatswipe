'use client'

import { useContext, useEffect, useRef, useState } from 'react'
import { AudioRegistryContext } from './AudioProvider'

interface WaveformPlayerProps {
  beatId: string
  audioUrl: string
  isActive: boolean
  durationSeconds?: number | null
  onReady?: () => void
  onFinish?: () => void
  onPlayStateChange?: (playing: boolean) => void
}


export function WaveformPlayer({
  beatId,
  audioUrl,
  isActive,
  durationSeconds,
  onReady,
  onFinish,
  onPlayStateChange,
}: WaveformPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const wavesurferRef = useRef<import('wavesurfer.js').default | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [ready, setReady] = useState(false)
  const registry = useContext(AudioRegistryContext)
  const pendingPlayRef = useRef(false)
  const isActiveRef = useRef(isActive)
  const onPlayStateChangeRef = useRef(onPlayStateChange)
  const onFinishRef = useRef(onFinish)

  useEffect(() => { isActiveRef.current = isActive }, [isActive])
  useEffect(() => { onPlayStateChangeRef.current = onPlayStateChange }, [onPlayStateChange])
  useEffect(() => { onFinishRef.current = onFinish }, [onFinish])

  // Create native audio element on mount — starts buffering the file immediately.
  // Playback is wired directly here so audio starts the moment isActive flips,
  // without waiting for WaveSurfer to finish initialising.
  useEffect(() => {
    const audio = new Audio()
    audio.preload = 'auto'
    audio.src = audioUrl
    audioRef.current = audio

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
      audioRef.current = null
    }
  }, [audioUrl])

  // Play/pause native audio the instant isActive changes — no WaveSurfer wait needed.
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (isActive) {
      const result = audio.play() as Promise<void> | undefined
      if (result) result.catch(() => { pendingPlayRef.current = true })
    } else {
      audio.pause()
      pendingPlayRef.current = false
    }
  }, [isActive])

  // Retry on first user gesture after iOS autoplay block.
  useEffect(() => {
    const retry = () => {
      if (pendingPlayRef.current && audioRef.current && isActiveRef.current) {
        audioRef.current.play()
        pendingPlayRef.current = false
      }
    }
    document.addEventListener('touchend', retry, { passive: true })
    document.addEventListener('mousedown', retry)
    return () => {
      document.removeEventListener('touchend', retry)
      document.removeEventListener('mousedown', retry)
    }
  }, [])

  // Init WaveSurfer async, passing the already-playing audio element via `media`.
  // setSrc() in WaveSurfer returns early when the URL matches (no audio.load() call),
  // so the playing audio is never interrupted. Waveform syncs to current position.
  useEffect(() => {
    if (!containerRef.current) return

    let ws: import('wavesurfer.js').default

    async function init() {
      const WaveSurfer = (await import('wavesurfer.js')).default
      if (!containerRef.current || !audioRef.current) return

      ws = WaveSurfer.create({
        container: containerRef.current!,
        waveColor: 'rgba(255, 255, 255, 0.25)',
        progressColor: '#00ff88',
        height: 72,
        barWidth: 2,
        barGap: 2,
        barRadius: 3,
        interact: true,
        media: audioRef.current,
        url: audioUrl,
        // No peaks — WaveSurfer fetches and decodes the real audio in the background.
        // Audio is already playing via the native element above, so this is non-blocking.
      })

      wavesurferRef.current = ws

      ws.on('ready', () => {
        setReady(true)
        onReady?.()
      })

      // Reset visual progress bar to start when track finishes.
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
      cleanupPromise.then((unregister) => {
        unregister?.()
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
