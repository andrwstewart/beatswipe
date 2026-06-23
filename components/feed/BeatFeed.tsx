'use client'

import { useCallback, useEffect, useState } from 'react'
import { BeatCard } from './BeatCard'
import { useSwipeFeed } from '@/hooks/useSwipeFeed'
import { useAudio } from '@/hooks/useAudio'
import { createClient } from '@/lib/supabase/client'
import type { Beat } from '@/types'

function ForYouTabs() {
  const [tab, setTab] = useState<'following' | 'foryou'>('foryou')
  return (
    <div className="fixed top-0 inset-x-0 z-30 flex items-center justify-center gap-6 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] pb-2 pointer-events-none">
      <div className="flex items-center gap-6 pointer-events-auto">
        <button
          onClick={() => setTab('following')}
          className={`text-[15px] font-semibold transition-colors drop-shadow ${tab === 'following' ? 'text-white' : 'text-white/50'}`}
        >
          Following
        </button>
        <button
          onClick={() => setTab('foryou')}
          className="relative text-[15px] font-semibold text-white drop-shadow"
        >
          For You
          {tab === 'foryou' && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-white" />
          )}
        </button>
      </div>
    </div>
  )
}

interface BeatFeedProps {
  initialBeats: Beat[]
  userId: string
}

const PAGE_SIZE = 10

export function BeatFeed({ initialBeats, userId }: BeatFeedProps) {
  const [beats, setBeats] = useState<Beat[]>(initialBeats)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(initialBeats.length >= PAGE_SIZE)
  const [loading, setLoading] = useState(false)

  const { activeIndex, setCardRef } = useSwipeFeed(beats.length)
  const { play } = useAudio()

  // Auto-play when active card changes
  useEffect(() => {
    const activeBeat = beats[activeIndex]
    if (activeBeat?.audio_url) {
      play(activeBeat.id)
    }
  }, [activeIndex])

  // Infinite scroll: load more when 3 from end
  useEffect(() => {
    if (activeIndex >= beats.length - 3 && hasMore && !loading) {
      loadMore()
    }
  }, [activeIndex, beats.length, hasMore, loading])

  const loadMore = useCallback(async () => {
    if (loading) return
    setLoading(true)

    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('beats')
        .select('*, producer:profiles(*)')
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

      if (!data || data.length === 0) {
        setHasMore(false)
      } else {
        setBeats((prev) => {
          const existingIds = new Set(prev.map((b) => b.id))
          const fresh = (data as Beat[]).filter((b) => !existingIds.has(b.id))
          return [...prev, ...fresh]
        })
        setPage((p) => p + 1)
        if (data.length < PAGE_SIZE) setHasMore(false)
      }
    } finally {
      setLoading(false)
    }
  }, [page, loading])

  if (beats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-dvh gap-4 text-center px-8">
        <div className="text-5xl">🎹</div>
        <h2 className="text-xl font-bold">No beats yet</h2>
        <p className="text-muted-foreground text-sm">
          Be the first to upload a beat and get discovered.
        </p>
      </div>
    )
  }

  return (
    <>
      <ForYouTabs />
      <div className="beat-feed">
      {beats.map((beat, index) => (
        <BeatCard
          key={beat.id}
          beat={beat}
          userId={userId}
          isActive={index === activeIndex}
          cardRef={setCardRef(index)}
        />
      ))}

      {/* Loading indicator at bottom */}
      {loading && (
        <div className="beat-card flex items-center justify-center">
          <div className="flex gap-2 items-center text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Loading more beats…</span>
          </div>
        </div>
      )}
    </div>
    </>
  )
}
