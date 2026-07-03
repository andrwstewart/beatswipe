'use client'

import { startTransition, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
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

const LOAD_AHEAD = 4

function ForYouTabs() {
  const [tab, setTab] = useState<'following' | 'foryou'>('foryou')
  return (
    <div className="fixed top-0 inset-x-0 z-30 flex items-center justify-center pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] pb-2 pointer-events-none">
      <div className="flex items-center gap-7 pointer-events-auto">
        <button
          onClick={() => setTab('following')}
          className={`text-sm font-semibold tracking-wide transition-all drop-shadow ${tab === 'following' ? 'text-white' : 'text-white/45'}`}
        >
          Following
        </button>
        <button
          onClick={() => setTab('foryou')}
          className="relative text-sm font-semibold tracking-wide text-white drop-shadow"
        >
          For You
          {tab === 'foryou' && (
            <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-[2px] rounded-full bg-white" />
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

  // Start with every beat so the user sees the full library before any repeat.
  const [display, setDisplay] = useState<LoopBeat[]>(() =>
    stampBeats(initialBeats, seq.current)
  )

  // Start after the initial display so the first extension continues from
  // where we left off rather than replaying beat 0 again.
  const sourceIndexRef = useRef(initialBeats.length)

  const extendingRef = useRef(false)
  const [displayVersion, setDisplayVersion] = useState(0)

  // Index to scroll to after the next DOM paint (used when we trim the front).
  const pendingJumpRef = useRef<number | null>(null)

  // Latest activeIndex captured as a ref so the async extend closure always
  // has a fresh value when it schedules a trim.
  const activeIndexRef = useRef(0)

  const { activeIndex, setCardRef, scrollTo } = useSwipeFeed(display.length, displayVersion)
  const { play } = useAudio()

  const playStartRef = useRef<number | null>(null)
  const prevBeatIdRef = useRef<string | null>(null)

  // Keep the ref in sync.
  useEffect(() => { activeIndexRef.current = activeIndex }, [activeIndex])

  // Auto-play the active beat + track listen time for the one we just left.
  // Audio start is debounced 160ms so rapid scrolling doesn't thrash audio.
  useEffect(() => {
    const activeBeat = display[activeIndex]

    // Track listen time immediately (don't debounce — we want accurate numbers)
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
    prevBeatIdRef.current = null
    playStartRef.current = null

    // Debounce audio start: if user scrolls past quickly, don't start audio
    const t = setTimeout(() => {
      if (activeBeat?.audio_url) {
        play(activeBeat.id)
        playStartRef.current = Date.now()
        prevBeatIdRef.current = activeBeat.id
      }
    }, 160)

    return () => clearTimeout(t)
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

  const extendFeed = useCallback(() => {
    if (extendingRef.current) return
    extendingRef.current = true

    try {
      const src = sourceRef.current
      if (src.length === 0) return

      // Always add a full loop so every beat appears before any repeat.
      // sourceIndexRef wraps to 0 after each full pass.
      const start = sourceIndexRef.current % src.length
      const chunk: Beat[] = []
      for (let i = 0; i < src.length; i++) {
        chunk.push(src[(start + i) % src.length])
      }
      sourceIndexRef.current = 0

      const stamped = stampBeats(chunk, seq.current)
      const capturedActiveIndex = activeIndexRef.current

      // Non-urgent: extending the feed shouldn't block scroll input
      startTransition(() => {
        setDisplay((prev) => {
          const next = [...prev, ...stamped]
          // Keep at most 2 full loops in the DOM; trim by exactly one loop
          // so we never cut through the middle of a cycle.
          const maxDisplay = src.length * 2
          if (next.length > maxDisplay) {
            const trim = next.length - maxDisplay
            pendingJumpRef.current = Math.max(0, capturedActiveIndex - trim)
            return next.slice(trim)
          }
          return next
        })
        // Bump version so useSwipeFeed re-attaches the IntersectionObserver to
        // the new card elements — without this, count stays the same after a
        // trim+add and the observer never sees the fresh DOM nodes.
        setDisplayVersion((v) => v + 1)
      })
    } finally {
      extendingRef.current = false
    }
  }, []) // sourceRef and sourceIndexRef are refs — always fresh

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
