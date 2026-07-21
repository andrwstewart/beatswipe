'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart, MessageCircle, Download, Share2,
  Play, Plus, Music2,
} from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { PaywallModal } from '@/components/feed/PaywallModal'
import { useAudio } from '@/hooks/useAudio'
import { useInteraction } from '@/hooks/useInteraction'
import { hapticImpact, hapticNotification, nativeShare } from '@/lib/native'
import type { Beat } from '@/types'

interface BeatCardProps {
  beat: Beat
  userId: string
  isActive: boolean
  isNext?: boolean
  cardRef?: (el: HTMLDivElement | null) => void
}

// Deterministic bar heights from beat ID — same on every render, zero network cost.
function usePeaks(beatId: string, count = 50): number[] {
  return useMemo(() => {
    let h = 5381
    for (let i = 0; i < beatId.length; i++) {
      h = (Math.imul((h << 5) + h, 1) ^ beatId.charCodeAt(i)) >>> 0
    }
    const bars: number[] = []
    for (let i = 0; i < count; i++) {
      h = (Math.imul(h, 1664525) + 1013904223) >>> 0
      bars.push((h / 0xffffffff) * 0.85 + 0.1)
    }
    return bars
  }, [beatId, count])
}

// Simple waveform: static bars + real playback progress. No WaveSurfer, no downloads.
// Tap/click anywhere on the bar to seek — just sets audio.currentTime, no re-fetch or decode.
function FeedWaveform({
  audioRef,
  beatId,
  durationSeconds,
}: {
  audioRef: React.RefObject<HTMLAudioElement | null>
  beatId: string
  durationSeconds?: number | null
}) {
  const peaks = usePeaks(beatId)
  const [progress, setProgress] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTimeUpdate = () => {
      const dur = audio.duration || durationSeconds || 180
      if (dur > 0) setProgress(audio.currentTime / dur)
    }
    const onSeeked = onTimeUpdate
    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('seeked', onSeeked)
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('seeked', onSeeked)
    }
  }, [audioRef, durationSeconds])

  const seekToPointer = useCallback((clientX: number) => {
    const audio = audioRef.current
    const container = containerRef.current
    if (!audio || !container) return
    const dur = audio.duration || durationSeconds
    if (!dur) return
    const rect = container.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    audio.currentTime = ratio * dur
    setProgress(ratio)
  }, [audioRef, durationSeconds])

  return (
    <div
      ref={containerRef}
      onClick={(e) => { e.stopPropagation(); seekToPointer(e.clientX) }}
      className="w-full flex items-end gap-[2.5px] h-14 cursor-pointer"
    >
      {peaks.map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-full pointer-events-none"
          style={{
            height: `${Math.round(h * 48)}px`,
            backgroundColor: (i / peaks.length) < progress
              ? '#00ff88'
              : 'rgba(255,255,255,0.2)',
          }}
        />
      ))}
    </div>
  )
}

export function BeatCard({ beat, userId, isActive, isNext, cardRef }: BeatCardProps) {
  const { play, pause } = useAudio()
  const [showHeart, setShowHeart] = useState(false)
  const [descExpanded, setDescExpanded] = useState(false)
  const [paywallOpen, setPaywallOpen] = useState(false)
  const [actuallyPlaying, setActuallyPlaying] = useState(false)
  const lastTap = useRef(0)

  // Audio element lives here — play() fires the instant isActive changes,
  // no debounce or React chain involved.
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const pendingPlayRef = useRef(false)
  const isActiveRef = useRef(isActive)
  useEffect(() => { isActiveRef.current = isActive }, [isActive])

  // Create audio element on mount with preload=none (no download until needed).
  useEffect(() => {
    if (!beat.audio_url) return
    const audio = new Audio()
    audio.preload = 'none'
    audio.src = beat.audio_url
    audioRef.current = audio

    const onPlay  = () => setActuallyPlaying(true)
    const onPause = () => setActuallyPlaying(false)
    const onEnded = () => { audio.currentTime = 0; setActuallyPlaying(false); pause() }
    audio.addEventListener('play',  onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnded)
    return () => {
      audio.removeEventListener('play',  onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onEnded)
      audio.pause()
      audio.removeAttribute('src')
      audio.load() // abort any in-progress download
      audioRef.current = null
    }
  }, [beat.audio_url]) // eslint-disable-line react-hooks/exhaustive-deps

  // Instant play/pause — one render cycle after IntersectionObserver, no extra chain.
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (isActive) {
      audio.preload = 'auto'
      audio.play().catch(() => { pendingPlayRef.current = true })
    } else {
      audio.pause()
      pendingPlayRef.current = false
    }
  }, [isActive])

  // Preload next card while current is playing.
  // Cancel the download the moment this card is no longer next or active.
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (isNext && !isActive) {
      audio.preload = 'auto'
      audio.load()
    } else if (!isActive) {
      // Abort — saves bandwidth and avoids hitting connection limits
      audio.preload = 'none'
      const src = audio.src
      audio.removeAttribute('src')
      audio.load() // cancels the pending fetch
      audio.src = src // restore src without triggering download
    }
  }, [isNext, isActive])

  // Retry play on next gesture if iOS blocked the first attempt.
  useEffect(() => {
    const retry = () => {
      if (pendingPlayRef.current && audioRef.current && isActiveRef.current) {
        audioRef.current.play().catch(() => {})
        pendingPlayRef.current = false
      }
    }
    document.addEventListener('touchend', retry, { passive: true })
    return () => document.removeEventListener('touchend', retry)
  }, [])

  const interaction = useInteraction({
    beatId: beat.id,
    userId,
    producerId: beat.producer_id,
    initialLikesCount: beat.likes_count,
  })

  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (actuallyPlaying) {
      audio.pause()
    } else {
      audio.play().catch(() => {})
      play(beat.id)
    }
  }, [actuallyPlaying, play, beat.id])

  function handleDoubleTap() {
    const now = Date.now()
    if (now - lastTap.current < 300) {
      if (!interaction.liked) {
        interaction.like()
        hapticNotification('success')
        setShowHeart(true)
        setTimeout(() => setShowHeart(false), 900)
      }
    }
    lastTap.current = now
  }

  async function handleShare() {
    hapticImpact('light')
    await nativeShare({ title: beat.title, url: window.location.href })
  }

  const producerName = beat.producer?.display_name ?? beat.producer?.username ?? 'Unknown'
  const producerUsername = beat.producer?.username ?? 'unknown'
  const genres = beat.genre?.slice(0, 2) ?? []

  return (
    <div ref={cardRef} className="beat-card select-none" onClick={handleDoubleTap}>

      {/* Background */}
      <div className="absolute inset-0 bg-zinc-950">
        {beat.video_url ? (
          <video
            src={beat.video_url}
            autoPlay={isActive}
            loop muted playsInline
            className="w-full h-full object-cover"
          />
        ) : beat.cover_url ? (
          <Image
            src={beat.cover_url}
            alt={beat.title}
            fill className="object-cover"
            priority={isActive}
            sizes="100vw"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent via-50% to-black/75" />
      </div>

      {/* Double-tap heart burst */}
      <AnimatePresence>
        {showHeart && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 1.4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Heart className="w-28 h-28 text-rose-500 fill-rose-500 drop-shadow-2xl" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Play/pause tap */}
      <button
        onClick={(e) => { e.stopPropagation(); togglePlay() }}
        className="absolute inset-0 z-10"
        aria-label={actuallyPlaying ? 'Pause' : 'Play'}
      >
        <AnimatePresence>
          {!actuallyPlaying && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
            >
              <div className="w-16 h-16 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center">
                <Play className="w-8 h-8 text-white fill-white ml-1" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* Right side actions */}
      <div
        className="absolute right-3 z-20 flex flex-col items-center gap-4"
        style={{ bottom: 'calc(7rem + env(safe-area-inset-bottom, 0px))' }}
        onClick={(e) => e.stopPropagation()}
      >
        <Link href={`/profile/${producerUsername}`} className="relative mb-1">
          <div className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-md border-2 border-white/20 overflow-hidden">
            <Avatar className="w-full h-full">
              <AvatarImage src={beat.producer?.avatar_url ?? undefined} />
              <AvatarFallback className="bg-primary/30 text-primary font-bold text-sm">
                {producerName[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
            <Plus className="w-2.5 h-2.5 text-black" strokeWidth={3} />
          </div>
        </Link>

        <SideAction
          icon={<Heart className={`w-7 h-7 ${interaction.liked ? 'fill-rose-500 text-rose-500' : 'text-white/70'}`} />}
          label={fmtCount(interaction.likesCount)}
          onClick={() => { hapticNotification('success'); interaction.like() }}
          active={interaction.liked}
        />

        <Link href={`/messages/new?producer=${producerUsername}`} className="flex flex-col items-center gap-1">
          <div className="p-1">
            <MessageCircle className="w-7 h-7 text-white/70" />
          </div>
          <span className="text-white/70 text-xs font-semibold drop-shadow">Message</span>
        </Link>

        <SideAction
          icon={<Download className={`w-6 h-6 ${interaction.downloaded ? 'text-primary' : 'text-white/70'}`} />}
          label={beat.price_cents && beat.price_cents > 0 && !interaction.downloaded
            ? `$${(beat.price_cents / 100).toFixed(2)}`
            : fmtCount(beat.downloads_count)}
          onClick={() => {
            hapticImpact('medium')
            if (beat.price_cents && beat.price_cents > 0 && !interaction.downloaded) {
              setPaywallOpen(true)
            } else {
              interaction.download(beat.audio_url, beat.title)
            }
          }}
          active={interaction.downloaded}
        />

        <SideAction
          icon={<Share2 className="w-6 h-6 text-white/70" />}
          label="Share"
          onClick={handleShare}
          active={false}
        />

        <SpinningDisc avatarUrl={beat.producer?.avatar_url ?? null} isPlaying={actuallyPlaying} />
      </div>

      {paywallOpen && (
        <PaywallModal
          beat={beat}
          userId={userId}
          onClose={() => setPaywallOpen(false)}
          onFreeDownload={() => interaction.download(beat.audio_url, beat.title)}
        />
      )}

      {/* Bottom left info */}
      <div
        className="absolute left-3 right-20 z-20 space-y-1.5"
        style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}
        onClick={(e) => e.stopPropagation()}
      >
        <Link href={`/profile/${producerUsername}`}>
          <p className="text-white font-bold text-[15px] drop-shadow">@{producerUsername}</p>
        </Link>

        <p className="text-white font-semibold text-lg leading-tight drop-shadow">{beat.title}</p>

        {beat.description && (
          <p
            className={`text-white/80 text-sm leading-snug drop-shadow ${!descExpanded ? 'line-clamp-2' : ''}`}
            onClick={() => setDescExpanded((v) => !v)}
          >
            {beat.description}
            {!descExpanded && beat.description.length > 80 && (
              <span className="text-white/60"> …more</span>
            )}
          </p>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          {beat.bpm && (
            <span className="text-white/70 text-xs font-mono bg-white/10 px-2 py-0.5 rounded-full">
              {beat.bpm} BPM
            </span>
          )}
          {beat.key && (
            <span className="text-white/70 text-xs font-mono bg-white/10 px-2 py-0.5 rounded-full">
              {beat.key}
            </span>
          )}
          {genres.map((g) => (
            <span key={g} className="text-white/70 text-xs bg-white/10 px-2 py-0.5 rounded-full">
              #{g}
            </span>
          ))}
        </div>

        {/* Waveform — CSS bars + real progress, no WaveSurfer, no downloads */}
        {beat.audio_url && (
          <div className="pt-1">
            <FeedWaveform
              audioRef={audioRef}
              beatId={beat.id}
              durationSeconds={beat.duration_seconds}
            />
          </div>
        )}

        <div className="flex items-center gap-1.5 text-white/70 text-xs">
          <Music2 className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{beat.title} — {producerName}</span>
        </div>
      </div>

    </div>
  )
}

function SideAction({ icon, label, onClick, active }: {
  icon: React.ReactNode; label: string; onClick: () => void; active: boolean
}) {
  return (
    <motion.button whileTap={{ scale: 0.8 }} onClick={onClick} className="flex flex-col items-center gap-1">
      <div className={`p-1 transition-transform ${active ? 'scale-110' : ''}`}>{icon}</div>
      <span className="text-white/70 text-xs font-semibold drop-shadow">{label}</span>
    </motion.button>
  )
}

function SpinningDisc({ avatarUrl, isPlaying }: { avatarUrl: string | null; isPlaying: boolean }) {
  return (
    <div
      className={`mt-1 w-10 h-10 rounded-full border-2 border-white/20 bg-zinc-800 overflow-hidden shadow-lg relative ${isPlaying ? 'animate-spin' : ''}`}
      style={{ animationDuration: '4s' }}
    >
      {avatarUrl
        ? <Image src={avatarUrl} alt="producer" fill className="object-cover" sizes="40px" />
        : <div className="w-full h-full flex items-center justify-center"><Music2 className="w-4 h-4 text-white/60" /></div>}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-2.5 h-2.5 rounded-full bg-zinc-900 border border-white/20" />
      </div>
    </div>
  )
}

function fmtCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}
