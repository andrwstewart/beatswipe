'use client'

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
        label={likesCount > 0 ? formatCount(likesCount) : undefined}
        icon={<Heart className={`w-7 h-7 ${liked ? 'fill-current' : ''}`} />}
      />

      {/* Dislike */}
      <ActionButton
        onClick={onDislike}
        active={false}
        activeColor="text-muted-foreground"
        icon={<ThumbsDown className="w-6 h-6" />}
      />

      {/* Favorite / save */}
      <ActionButton
        onClick={onFavorite}
        active={favorited}
        activeColor="text-yellow-400"
        icon={<Star className={`w-7 h-7 ${favorited ? 'fill-current' : ''}`} />}
      />

      {/* Download */}
      <ActionButton
        onClick={onDownload}
        active={downloaded}
        activeColor="text-primary"
        icon={<Download className="w-7 h-7" />}
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
  icon,
  label,
}: {
  onClick: () => void
  active: boolean
  activeColor: string
  icon: React.ReactNode
  label?: string
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <motion.button
        whileTap={{ scale: 0.82 }}
        onClick={onClick}
        className={`p-2 rounded-full backdrop-blur-sm transition-all ${
          active
            ? `${activeColor} bg-white/10`
            : 'text-white/80 hover:text-white hover:bg-white/10'
        }`}
      >
        {icon}
      </motion.button>
      {label && (
        <span className="text-xs text-white/70 font-medium">{label}</span>
      )}
    </div>
  )
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}
