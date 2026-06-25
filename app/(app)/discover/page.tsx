'use client'

import { useState, useCallback, useEffect } from 'react'
import { Search, Music2, User, ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import { BeatCard } from '@/components/feed/BeatCard'
import { useAudio } from '@/hooks/useAudio'
import { searchArtists } from '@/lib/type-beat-artists'
import type { Beat, Profile } from '@/types'

type Results = { beats: Beat[]; profiles: Profile[] }

function useDebounce<T extends (...args: Parameters<T>) => void>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout>
  return ((...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }) as T
}

export default function DiscoverPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Results | null>(null)
  const [loading, setLoading] = useState(false)
  const [previewBeat, setPreviewBeat] = useState<Beat | null>(null)
  const [userId, setUserId] = useState('')
  const { pause } = useAudio()

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id)
    })
  }, [])

  async function search(q: string) {
    if (!q.trim()) { setResults(null); return }
    setLoading(true)
    const supabase = createClient()
    const term = q.trim()

    // Expand the query to matching artist/style names for type beat search
    const matchingTags = searchArtists(term, 20)

    const [{ data: popular }, { data: recent }, { data: profiles }] = await Promise.all([
      supabase
        .from('beats')
        .select('*, producer:profiles(*)')
        .or(`title.ilike.%${term}%,description.ilike.%${term}%`)
        .order('likes_count', { ascending: false })
        .limit(15),
      supabase
        .from('beats')
        .select('*, producer:profiles(*)')
        .or(`title.ilike.%${term}%,description.ilike.%${term}%`)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${term}%,display_name.ilike.%${term}%`)
        .limit(8),
    ])

    // Type beat tag search — separate query so a missing column can't break the main results
    let tagMatches: Beat[] = []
    if (matchingTags.length > 0) {
      const { data } = await supabase
        .from('beats')
        .select('*, producer:profiles(*)')
        .overlaps('type_beat_tags', matchingTags)
        .order('likes_count', { ascending: false })
        .limit(15)
      tagMatches = (data ?? []) as Beat[]
    }

    // Merge: popular first (most liked), then tag matches, then recent (deduplicated)
    const seen = new Set<string>()
    const beats: Beat[] = []
    for (const b of [...(popular ?? []), ...tagMatches, ...(recent ?? [])]) {
      if (!seen.has(b.id)) { seen.add(b.id); beats.push(b as Beat) }
    }

    setResults({ beats, profiles: (profiles as Profile[]) ?? [] })
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(useDebounce(search, 350), [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value
    setQuery(q)
    debouncedSearch(q)
  }

  function closePreview() {
    pause()
    setPreviewBeat(null)
  }

  const hasResults = results && (results.beats.length > 0 || results.profiles.length > 0)

  return (
    <>
      {/* Full-screen beat preview overlay */}
      {previewBeat && (
        <div className="fixed inset-0 z-50">
          <BeatCard beat={previewBeat} userId={userId} isActive={true} />
          <button
            onClick={closePreview}
            className="absolute z-[60] w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"
            style={{ top: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)', left: '1rem' }}
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
        </div>
      )}

      <div className="min-h-dvh pb-24" style={{ paddingTop: 'calc(3.5rem + env(safe-area-inset-top, 0px))' }}>
        {/* Search bar */}
        <div className="px-4 pb-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={handleChange}
              placeholder="Search beats, genres, producers…"
              autoFocus
              className="w-full bg-secondary/60 rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && !results && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-8">
            <Search className="w-10 h-10 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">Search by beat title, genre, description, or producer name.</p>
          </div>
        )}

        {!loading && results && !hasResults && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-8">
            <p className="text-muted-foreground text-sm">No results for &ldquo;{query}&rdquo;</p>
          </div>
        )}

        {!loading && hasResults && (
          <div className="divide-y divide-border/50">
            {/* Producers */}
            {results.profiles.length > 0 && (
              <section className="py-3">
                <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Producers</p>
                <div className="space-y-0.5">
                  {results.profiles.map((p) => (
                    <Link
                      key={p.id}
                      href={`/profile/${p.username}`}
                      className="flex items-center gap-3 px-4 py-2.5 active:bg-secondary/30 transition-colors"
                    >
                      <Avatar className="w-10 h-10 flex-shrink-0">
                        <AvatarImage src={p.avatar_url ?? undefined} />
                        <AvatarFallback className="bg-primary/20 text-primary text-sm font-bold">
                          {(p.display_name ?? p.username)[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{p.display_name ?? p.username}</p>
                        <p className="text-muted-foreground text-xs">@{p.username}</p>
                      </div>
                      <User className="w-4 h-4 text-muted-foreground ml-auto flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Beats */}
            {results.beats.length > 0 && (
              <section className="py-3">
                <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Beats — {results.beats.length} results
                </p>
                <div className="space-y-0.5">
                  {results.beats.map((beat) => (
                    <button
                      key={beat.id}
                      onClick={() => setPreviewBeat(beat)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 active:bg-secondary/30 transition-colors text-left"
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-secondary relative">
                        {beat.cover_url ? (
                          <Image
                            src={beat.cover_url}
                            alt={beat.title}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Music2 className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{beat.title}</p>
                        <p className="text-muted-foreground text-xs truncate">
                          @{beat.producer?.username ?? 'unknown'}
                          {beat.bpm ? ` · ${beat.bpm} BPM` : ''}
                          {beat.genre?.[0] ? ` · ${beat.genre[0]}` : ''}
                        </p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-muted-foreground/60 text-[10px]">♥ {beat.likes_count}</span>
                          <span className="text-muted-foreground/60 text-[10px]">↓ {beat.downloads_count}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </>
  )
}
