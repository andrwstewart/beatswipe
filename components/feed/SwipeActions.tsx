'use client'

import { useEffect, useRef, useState } from 'react'
import { Heart, Star, Download, Share2, ThumbsDown } from 'lucide-react'
import { motion } from 'framer-motion'

interface SwipeActionsProps {
  liked: boolean
  favorited: boolean
  downloaded: boolean
  likesCount: number
  onLike: () => void
  onDislike: () => void
  onFavorite: () => void
  onDownload: () => void
  onShare: () => void
}

export function SwipeActions({
  liked,
  favorited,
  downloaded,
  likesCount,
  onLike,
  onDislike,
  onFavorite,
  onDownload,
  onShare,
}: SwipeActionsProps) {
  return (
    <div className="flex flex-col items-center gap-5">
      {/* Like */}
      <ActionButton
        onClick={onLike}
        active={liked}
        activeColor="text-rose-400"
        glowColor="rgba(251,113,133,0.9)"
        label={likesCount > 0 ? formatCount(likesCount) : undefined}
        icon={<Heart className={`w-7 h-7 ${liked ? 'fill-current' : ''}`} />}
        popOnActive
      />

      {/* Dislike */}
      <ActionButton
        onClick={onDislike}
        active={false}
        activeColor="text-muted-foreground"
        icon={<ThumbsDown className="w-6 h-6" />}
      />

      {/* Favorite */}
      <ActionButton
        onClick={onFavorite}
        active={favorited}
        activeColor="text-yellow-400"
        glowColor="rgba(250,204,21,0.9)"
        icon={<Star className={`w-7 h-7 ${favorited ? 'fill-current' : ''}`} />}
        popOnActive
      />

      {/* Download */}
      <ActionButton
        onClick={onDownload}
        active={downloaded}
        activeColor="text-primary"
        glowColor="rgba(0,255,136,0.9)"
        icon={<Download className="w-7 h-7" />}
        popOnActive
      />

      {/* Share */}
      <ActionButton
        onClick={onShare}
        active={false}
        activeColor="text-sky-400"
        icon={<Share2 className="w-6 h-6" />}
      />
    </div>
  )
}

function ActionButton({
  onClick,
  active,
  activeColor,
  glowColor,
  icon,
  label,
  popOnActive,
}: {
  onClick: () => void
  active: boolean
  activeColor: string
  glowColor?: string
  icon: React.ReactNode
  label?: string
  popOnActive?: boolean
}) {
  const [popping, setPopping] = useState(false)
  const prevActive = useRef(active)

  useEffect(() => {
    if (popOnActive && !prevActive.current && active) {
      setPopping(true)
      const t = setTimeout(() => setPopping(false), 400)
      return () => clearTimeout(t)
    }
    prevActive.current = active
  }, [active, popOnActive])

  return (
    <div className="flex flex-col items-center gap-0.5">
      <motion.button
        whileTap={{ scale: 0.78 }}
        animate={popping ? { scale: [1, 1.4, 0.88, 1.12, 1] } : { scale: 1 }}
        transition={popping ? { duration: 0.38, times: [0, 0.3, 0.55, 0.78, 1] } : { duration: 0.15 }}
        onClick={onClick}
        className={`p-2 rounded-full transition-colors ${
          active
            ? `${activeColor} bg-white/10`
            : 'text-white/75 hover:text-white hover:bg-white/10'
        }`}
        style={
          active && glowColor
            ? { filter: `drop-shadow(0 0 10px ${glowColor}) drop-shadow(0 0 4px ${glowColor})` }
            : undefined
        }
      >
        {icon}
      </motion.button>
      {label && (
        <span className={`text-xs font-semibold ${active ? activeColor : 'text-white/70'}`}>
          {label}
        </span>
      )}
    </div>
  )
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}
