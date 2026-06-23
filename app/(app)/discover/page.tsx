'use client'

import { useState, useCallback } from 'react'
import { Search, Music2, User } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import type { Beat, Profile } from '@/types'

type Results = {
  beats: Beat[]
  profiles: Profile[]
}

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

  async function search(q: string) {
    if (!q.trim()) {
      setResults(null)
      return
    }
    setLoading(true)
    const supabase = createClient()

    const [{ data: beats }, { data: profiles }] = await Promise.all([
      supabase
        .from('beats')
        .select('*, producer:profiles(*)')
        .or(`title.ilike.%${q}%,genre.cs.{${q}}`)
        .limit(20),
      supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
        .limit(10),
    ])

    setResults({ beats: (beats as Beat[]) ?? [], profiles: (profiles as Profile[]) ?? [] })
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(useDebounce(search, 350), [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value
    setQuery(q)
    debouncedSearch(q)
  }

  const hasResults = results && (results.beats.length > 0 || results.profiles.length > 0)

  return (
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

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!loading && !results && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-8">
          <Search className="w-10 h-10 text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm">Search by beat name, genre (e.g. Trap), or producer name.</p>
        </div>
      )}

      {/* No results */}
      {!loading && results && !hasResults && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-8">
          <p className="text-muted-foreground text-sm">No results for &ldquo;{query}&rdquo;</p>
        </div>
      )}

      {/* Results */}
      {!loading && hasResults && (
        <div className="divide-y divide-border/50">
          {/* Profiles */}
          {results.profiles.length > 0 && (
            <section className="py-3">
              <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Producers</p>
              <div className="space-y-0.5">
                {results.profiles.map((p) => (
                  <Link
                    key={p.id}
                    href={`/profile/${p.username}`}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/30 transition-colors"
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
              <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Beats</p>
              <div className="space-y-0.5">
                {results.beats.map((beat) => (
                  <Link
                    key={beat.id}
                    href={`/profile/${beat.producer?.username ?? ''}`}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/30 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-secondary">
                      {beat.cover_url ? (
                        <Image
                          src={beat.cover_url}
                          alt={beat.title}
                          width={40}
                          height={40}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Music2 className="w-4 h-4 text-muted-foreground" />
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
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
