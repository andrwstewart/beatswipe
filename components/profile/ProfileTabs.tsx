'use client'

import { useState } from 'react'
import { Grid3x3, Heart } from 'lucide-react'
import { BeatGrid } from './BeatGrid'
import type { Beat } from '@/types'

interface ProfileTabsProps {
  myBeats: Beat[]
  likedBeats: Beat[]
  userId?: string
  isOwnProfile: boolean
}

export function ProfileTabs({ myBeats, likedBeats, userId, isOwnProfile }: ProfileTabsProps) {
  const [tab, setTab] = useState<'beats' | 'liked'>('beats')

  const beats = tab === 'beats' ? myBeats : likedBeats

  return (
    <div>
      {isOwnProfile && (
        <div className="flex border-b border-border/60">
          <button
            onClick={() => setTab('beats')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              tab === 'beats'
                ? 'text-foreground border-b-2 border-primary'
                : 'text-muted-foreground'
            }`}
          >
            <Grid3x3 className="w-4 h-4" />
            Beats
          </button>
          <button
            onClick={() => setTab('liked')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              tab === 'liked'
                ? 'text-foreground border-b-2 border-primary'
                : 'text-muted-foreground'
            }`}
          >
            <Heart className="w-4 h-4" />
            Liked
          </button>
        </div>
      )}

      {tab === 'liked' && likedBeats.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <Heart className="w-8 h-8 text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm">No liked beats yet.</p>
        </div>
      ) : (
        <BeatGrid beats={beats} userId={userId} />
      )}
    </div>
  )
}
