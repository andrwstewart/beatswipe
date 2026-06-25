'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart, MessageCircle, Download, Share2,
  Play, Pause, Plus, Music2,
} from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { WaveformPlayer } from '@/components/audio/WaveformPlayer'
import { useAudio } from '@/hooks/useAudio'
import { useInteraction } from '@/hooks/useInteraction'
import type { Beat } from '@/types'

interface BeatCardProps {
  beat: Beat
  userId: string
  isActive: boolean
  cardRef?: (el: HTMLDivElement | null) => void
}

export function BeatCard({ beat, userId, isActive, cardRef }: BeatCardProps) {
  const { play, pause, isPlaying } = useAudio()
  const playing = isPlaying(beat.id)
  const [showHeart, setShowHeart] = useState(false)
  const [descExpanded, setDescExpanded] = useState(false)
  const lastTap = useRef(0)

  const interaction = useInteraction({
    beatId: beat.id,
    userId,
    producerId: beat.producer_id,
    initialLikesCount: beat.likes_count,
  })

  const togglePlay = useCallback(() => {
    if (playing) pause()
    else play(beat.id)
  }, [playing, play, pause, beat.id])

  // Double-tap to like (TikTok style)
  function handleDoubleTap() {
    const now = Date.now()
    if (now - lastTap.current < 300) {
      if (!interaction.liked) {
        interaction.like()
        setShowHeart(true)
        setTimeout(() => setShowHeart(false), 900)
      }
    }
    lastTap.current = now
  }

  async function handleShare() {
    if (navigator.share) {
      await navigator.share({ title: beat.title, url: window.location.href })
    } else {
      await navigator.clipboard.writeText(window.location.href)
    }
  }

  const producerName = beat.producer?.display_name ?? beat.producer?.username ?? 'Unknown'
  const producerUsername = beat.producer?.username ?? 'unknown'
  const genres = beat.genre?.slice(0, 2) ?? []

  return (
    <div ref={cardRef} className="beat-card select-none" onClick={handleDoubleTap}>

      {/* ── Background ─────────────────────────────────────────────────── */}
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
        {/* Gradient: dark top + dark bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent via-50% to-black/75" />
      </div>

      {/* ── Double-tap heart burst ──────────────────────────────────────── */}
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

      {/* ── Play/pause tap (center area only, avoids UI elements) ──────── */}
      <button
        onClick={(e) => { e.stopPropagation(); togglePlay() }}
        className="absolute inset-0 z-10"
        aria-label={playing ? 'Pause' : 'Play'}
      >
        <AnimatePresence>
          {!playing && (
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

      {/* ── Right side actions ─────────────────────────────────────────── */}
      <div
        className="absolute right-3 z-20 flex flex-col items-center gap-4"
        style={{ bottom: 'calc(7rem + env(safe-area-inset-bottom, 0px))' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Producer avatar */}
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

        {/* Like */}
        <SideAction
          icon={<Heart className={`w-7 h-7 ${interaction.liked ? 'fill-rose-500 text-rose-500' : 'text-white/70'}`} />}
          label={fmtCount(interaction.likesCount)}
          onClick={interaction.like}
          active={interaction.liked}
        />

        {/* Message producer */}
        <Link href={`/messages/new?producer=${producerUsername}`} className="flex flex-col items-center gap-1">
          <div className="p-1">
            <MessageCircle className="w-7 h-7 text-white/70" />
          </div>
          <span className="text-white/70 text-xs font-semibold drop-shadow">Message</span>
        </Link>

        {/* Download */}
        <SideAction
          icon={<Download className={`w-6 h-6 ${interaction.downloaded ? 'text-primary' : 'text-white/70'}`} />}
          label={fmtCount(beat.downloads_count)}
          onClick={() => interaction.download(beat.audio_url, beat.title)}
          active={interaction.downloaded}
        />

        {/* Share */}
        <SideAction
          icon={<Share2 className="w-6 h-6 text-white/70" />}
          label="Share"
          onClick={handleShare}
          active={false}
        />

        {/* Spinning disc — producer avatar */}
        <SpinningDisc avatarUrl={beat.producer?.avatar_url ?? null} isPlaying={playing} />
      </div>

      {/* ── Bottom left: producer + beat info + waveform ───────────────── */}
      <div
        className="absolute left-3 right-20 z-20 space-y-1.5"
        style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Producer name */}
        <Link href={`/profile/${producerUsername}`}>
          <p className="text-white font-bold text-[15px] drop-shadow">@{producerUsername}</p>
        </Link>

        {/* Beat title */}
        <p className="text-white font-semibold text-lg leading-tight drop-shadow">{beat.title}</p>

        {/* Description (tap to expand) */}
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

        {/* Tags row */}
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

        {/* Waveform strip */}
        {beat.audio_url && (
          <div className="pt-1">
            <WaveformPlayer
              beatId={beat.id}
              audioUrl={beat.audio_url}
              isActive={isActive && playing}
              onFinish={() => pause()}
            />
          </div>
        )}

        {/* Beat credits line */}
        <div className="flex items-center gap-1.5 text-white/70 text-xs">
          <Music2 className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">
            {beat.title} — {producerName}
          </span>
        </div>
      </div>

    </div>
  )
}

// ── Side action button ────────────────────────────────────────────────────────
function SideAction({
  icon, label, onClick, active,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  active: boolean
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.8 }}
      onClick={onClick}
      className="flex flex-col items-center gap-1"
    >
      <div className={`p-1 transition-transform ${active ? 'scale-110' : ''}`}>{icon}</div>
      <span className="text-white/70 text-xs font-semibold drop-shadow">{label}</span>
    </motion.button>
  )
}

// ── Spinning disc — producer avatar ──────────────────────────────────────────
function SpinningDisc({ avatarUrl, isPlaying }: { avatarUrl: string | null; isPlaying: boolean }) {
  return (
    <div
      className={`mt-1 w-10 h-10 rounded-full border-2 border-white/20 bg-zinc-800 overflow-hidden shadow-lg relative ${isPlaying ? 'animate-spin' : ''}`}
      style={{ animationDuration: '4s' }}
    >
      {avatarUrl ? (
        <Image src={avatarUrl} alt="producer" fill className="object-cover" sizes="40px" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Music2 className="w-4 h-4 text-white/60" />
        </div>
      )}
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
