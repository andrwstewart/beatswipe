'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { searchArtists } from '@/lib/type-beat-artists'

interface TypeBeatSelectorProps {
  selected: string[]       // array of artist names, e.g. ["Playboi Carti", "Lil Uzi Vert"]
  onChange: (artists: string[]) => void
  error?: string | null
}

export function TypeBeatSelector({ selected, onChange, error }: TypeBeatSelectorProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const suggestions = searchArtists(query, 8).filter((a) => !selected.includes(a))
  const canAddMore = selected.length < 3

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function select(artist: string) {
    if (!canAddMore || selected.includes(artist)) return
    onChange([...selected, artist])
    setQuery('')
    setOpen(false)
    inputRef.current?.focus()
  }

  function remove(artist: string) {
    onChange(selected.filter((a) => a !== artist))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && query === '' && selected.length > 0) {
      remove(selected[selected.length - 1])
    }
    if (e.key === 'Escape') {
      setOpen(false)
      setQuery('')
    }
    if (e.key === 'Enter' && suggestions.length > 0) {
      e.preventDefault()
      select(suggestions[0])
    }
  }

  return (
    <div ref={containerRef} className="space-y-2">
      {/* Selected tags */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((artist) => (
            <span
              key={artist}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-sm text-primary font-medium"
            >
              {artist} Type Beat
              <button
                type="button"
                onClick={() => remove(artist)}
                className="hover:text-primary/60 transition-colors"
                aria-label={`Remove ${artist}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      {canAddMore && (
        <div className="relative">
          <div
            className={`flex items-center gap-2 bg-secondary/50 border rounded-lg px-3 py-2.5 transition-colors ${
              error ? 'border-destructive/60' : open ? 'border-primary/50' : 'border-border'
            }`}
          >
            <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
              onFocus={() => setOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder={
                selected.length === 0
                  ? 'Search artist… (e.g. Playboi Carti)'
                  : `Add ${3 - selected.length} more…`
              }
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(''); inputRef.current?.focus() }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Dropdown */}
          {open && suggestions.length > 0 && (
            <div className="absolute z-40 top-full left-0 right-0 mt-1.5 bg-popover border border-border rounded-xl shadow-xl overflow-hidden">
              {suggestions.map((artist) => (
                <button
                  key={artist}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); select(artist) }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-secondary/60 active:bg-secondary transition-colors flex items-center gap-2"
                >
                  <span className="font-medium">{artist}</span>
                  <span className="text-muted-foreground text-xs">Type Beat</span>
                </button>
              ))}
            </div>
          )}

          {open && query.trim().length > 0 && suggestions.length === 0 && (
            <div className="absolute z-40 top-full left-0 right-0 mt-1.5 bg-popover border border-border rounded-xl shadow-xl px-4 py-3 text-sm text-muted-foreground">
              No matches for &ldquo;{query}&rdquo;
            </div>
          )}
        </div>
      )}

      {selected.length >= 3 && (
        <p className="text-xs text-muted-foreground">Maximum 3 type beat tags added.</p>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
