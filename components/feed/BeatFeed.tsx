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

const MAX_DISPLAY = 30
const LOAD_AHEAD = 4
const INITIAL_SIZE = 10  // beats per copy in the initial display
const CHUNK_SIZE = 10    // beats added per source-loop extension

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

  // Display starts with two small copies so there's always a card below.
  // Using a slice (not all beats) keeps the initial render fast even when
  // initialBeats is very large; the rest surfaces through source-loop extends.
  const [display, setDisplay] = useState<LoopBeat[]>(() => {
    const initial = initialBeats.slice(0, INITIAL_SIZE)
    return [
      ...stampBeats(initial, seq.current),
      ...stampBeats(initial, seq.current),
    ]
  })

  // Tracks our position in sourceRef so each extension advances through all
  // beats in order before wrapping — every beat is guaranteed to appear.
  const sourceIndexRef = useRef(0)

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

  const extendFeed = useCallback(() => {
    if (extendingRef.current) return
    extendingRef.current = true

    try {
      const src = sourceRef.current
      if (src.length === 0) return

      // Cycle through every beat in sourceRef in CHUNK_SIZE steps before
      // wrapping — this guarantees every uploaded beat surfaces.
      const start = sourceIndexRef.current % src.length
      const chunk: Beat[] = []
      for (let i = 0; i < CHUNK_SIZE; i++) {
        chunk.push(src[(start + i) % src.length])
      }
      sourceIndexRef.current = (start + CHUNK_SIZE) % src.length

      const stamped = stampBeats(chunk, seq.current)

      setDisplay((prev) => {
        const next = [...prev, ...stamped]
        if (next.length > MAX_DISPLAY) {
          const trim = next.length - MAX_DISPLAY
          pendingJumpRef.current = Math.max(0, activeIndexRef.current - trim)
          return next.slice(trim)
        }
        return next
      })
      // Bump version so useSwipeFeed re-attaches the IntersectionObserver to
      // the new card elements — without this, count stays the same after a
      // trim+add and the observer never sees the fresh DOM nodes.
      setDisplayVersion((v) => v + 1)
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
