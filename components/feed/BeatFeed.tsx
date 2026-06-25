'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { BeatCard } from './BeatCard'
import { useSwipeFeed } from '@/hooks/useSwipeFeed'
import { useAudio } from '@/hooks/useAudio'
import type { Beat } from '@/types'

// Each entry in the display list gets a unique stamp so React never sees
// duplicate keys, even when the same beat appears multiple times in the loop.
type LoopBeat = Beat & { _loopKey: string }

function stampBeats(beats: Beat[], seq: { n: number }): LoopBeat[] {
  return beats.map((b) => ({ ...b, _loopKey: `${b.id}__${seq.n++}` }))
}

// Max items kept in the DOM at once. Trimming from the front is invisible
// because we do an instant scrollIntoView after the DOM updates.
const MAX_DISPLAY = 30
// Append a new batch when this many items remain below the current card.
const LOAD_AHEAD = 4

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

export function BeatFeed({ initialBeats, userId }: BeatFeedProps) {
  // Monotone key sequence — never resets, so every stamped entry is unique.
  const seq = useRef({ n: 0 })

  // All beats ever fetched from the API. Used as the loop source when the
  // API has no more pages.
  const sourceRef = useRef<Beat[]>(initialBeats)

  // The display buffer starts with two copies so there is always something
  // below the first card to swipe to.
  const [display, setDisplay] = useState<LoopBeat[]>(() => [
    ...stampBeats(initialBeats, seq.current),
    ...stampBeats(initialBeats, seq.current),
  ])

  const [apiPage, setApiPage] = useState(1)
  const [hasMoreApi, setHasMoreApi] = useState(initialBeats.length >= 10)
  // Ref (not state) so the guard inside extendFeed always sees the live value
  // regardless of closure staleness.
  const extendingRef = useRef(false)

  // Index to scroll to after the next DOM paint (used when we trim the front).
  const pendingJumpRef = useRef<number | null>(null)

  // Latest activeIndex captured as a ref so the async extend closure always
  // has a fresh value when it schedules a trim.
  const activeIndexRef = useRef(0)

  const { activeIndex, setCardRef, scrollTo } = useSwipeFeed(display.length)
  const { play } = useAudio()

  const playStartRef = useRef<number | null>(null)
  const prevBeatIdRef = useRef<string | null>(null)

  // Keep the ref in sync.
  useEffect(() => { activeIndexRef.current = activeIndex }, [activeIndex])

  // Auto-play the active beat + track listen time for the one we just left.
  useEffect(() => {
    const activeBeat = display[activeIndex]

    const prevId = prevBeatIdRef.current
    const startMs = playStartRef.current
    if (prevId && startMs !== null) {
      const seconds = Math.round((Date.now() - startMs) / 1000)
      if (seconds >= 3) {
        fetch('/api/beats/listen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ beatId: prevId, listenSeconds: seconds }),
        }).catch(() => {})
      }
    }

    if (activeBeat?.audio_url) {
      play(activeBeat.id)
      playStartRef.current = Date.now()
      prevBeatIdRef.current = activeBeat.id
    } else {
      playStartRef.current = null
      prevBeatIdRef.current = null
    }
  }, [activeIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  // After trimming from the front, instantly scroll so the current card
  // stays in view. useLayoutEffect fires after DOM mutation, before paint,
  // so the user never sees the jump.
  useLayoutEffect(() => {
    if (pendingJumpRef.current !== null) {
      scrollTo(pendingJumpRef.current, 'instant')
      pendingJumpRef.current = null
    }
  }, [display]) // eslint-disable-line react-hooks/exhaustive-deps

  // Trigger extension when near the bottom.
  useEffect(() => {
    if (activeIndex >= display.length - LOAD_AHEAD) {
      extendFeed()
    }
  }, [activeIndex, display.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const extendFeed = useCallback(async () => {
    if (extendingRef.current) return
    extendingRef.current = true

    try {
      let incoming: Beat[] = []

      // 1. Try to get a fresh page from the personalized feed API.
      if (hasMoreApi) {
        try {
          const res = await fetch(`/api/beats/feed?page=${apiPage}`)
          if (res.ok) {
            const { beats: fresh, hasMore } = await res.json()
            if (Array.isArray(fresh) && fresh.length > 0) {
              incoming = fresh
              sourceRef.current = [
                ...sourceRef.current,
                ...fresh.filter((b: Beat) => !sourceRef.current.some((s) => s.id === b.id)),
              ]
              setApiPage((p) => p + 1)
              if (!hasMore) setHasMoreApi(false)
            }
          }
        } catch {
          // Network error — fall through to loop.
        }
      }

      // 2. If the API gave nothing, loop back through everything we've seen.
      if (incoming.length === 0) {
        incoming = sourceRef.current
      }

      const stamped = stampBeats(incoming, seq.current)

      // 3. Append and optionally trim the front to keep the DOM bounded.
      setDisplay((prev) => {
        const next = [...prev, ...stamped]
        if (next.length > MAX_DISPLAY) {
          const trim = next.length - MAX_DISPLAY
          pendingJumpRef.current = Math.max(0, activeIndexRef.current - trim)
          return next.slice(trim)
        }
        return next
      })
    } finally {
      extendingRef.current = false
    }
  }, [hasMoreApi, apiPage]) // eslint-disable-line react-hooks/exhaustive-deps

  if (display.length === 0) {
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
        {display.map(({ _loopKey, ...beat }, index) => (
          <BeatCard
            key={_loopKey}
            beat={beat}
            userId={userId}
            isActive={index === activeIndex}
            cardRef={setCardRef(index)}
          />
        ))}
      </div>
    </>
  )
}
