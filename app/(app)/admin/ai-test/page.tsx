'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Panel = 'analyzer' | 'knowledge' | 'status'

export default function AITestPage() {
  const [activePanel, setActivePanel] = useState<Panel>('analyzer')

  return (
    <div className="min-h-dvh p-4 pt-16" style={{ paddingTop: 'calc(4rem + env(safe-area-inset-top, 0px))' }}>
      <h1 className="text-xl font-bold mb-4 text-primary">AI Debug Panel</h1>

      <div className="flex gap-2 mb-6 flex-wrap">
        {(['analyzer', 'knowledge', 'status'] as Panel[]).map((p) => (
          <button
            key={p}
            onClick={() => setActivePanel(p)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all capitalize ${
              activePanel === p
                ? 'border-primary bg-primary/15 text-primary'
                : 'border-border text-muted-foreground'
            }`}
          >
            {p === 'analyzer' ? 'Beat Analyzer' : p === 'knowledge' ? 'Knowledge Search' : 'Status Overview'}
          </button>
        ))}
      </div>

      {activePanel === 'analyzer' && <BeatAnalyzerPanel />}
      {activePanel === 'knowledge' && <KnowledgeSearchPanel />}
      {activePanel === 'status' && <StatusOverviewPanel />}
    </div>
  )
}

function BeatAnalyzerPanel() {
  const [beatId, setBeatId] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<unknown>(null)
  const [error, setError] = useState<string | null>(null)

  async function analyze() {
    if (!beatId.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/beats/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ beatId: beatId.trim() }),
      })
      const json = await res.json()
      if (!res.ok) setError(json.error ?? 'Analysis failed')
      else setResult(json)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Paste a beat ID to trigger analysis or view cached results.</p>
      <div className="flex gap-2">
        <input
          value={beatId}
          onChange={(e) => setBeatId(e.target.value)}
          placeholder="Beat UUID"
          className="flex-1 bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50"
        />
        <button
          onClick={analyze}
          disabled={loading || !beatId.trim()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {loading ? 'Analyzing…' : 'Analyze'}
        </button>
      </div>
      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">{error}</div>
      )}
      {result !== null && (
        <pre className="p-4 rounded-xl bg-secondary/50 border border-border text-xs overflow-auto max-h-[60dvh] text-foreground/80">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  )
}

function KnowledgeSearchPanel() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<unknown[]>([])
  const [error, setError] = useState<string | null>(null)

  async function search() {
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/knowledge/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim(), limit: 10 }),
      })
      const json = await res.json()
      if (!res.ok) setError(json.error ?? 'Search failed')
      else setResults(json.results ?? [])
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Search the artist knowledge base with a natural language query.</p>
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
          placeholder="e.g. dark phonk 140bpm menacing"
          className="flex-1 bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50"
        />
        <button
          onClick={search}
          disabled={loading || !query.trim()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {loading ? 'Searching…' : 'Search'}
        </button>
      </div>
      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">{error}</div>
      )}
      {results.length > 0 && (
        <div className="space-y-3">
          {results.map((r, i) => {
            const entry = r as Record<string, unknown>
            return (
              <div key={i} className="p-3 rounded-xl bg-secondary/40 border border-border/50 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-sm">{entry.artist_name as string}</span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>sim: {((entry.similarity as number) * 100).toFixed(0)}%</span>
                    <span>underground: {entry.underground_level as number}/10</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(entry.associated_genres as string[])?.map((g) => (
                    <span key={g} className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-xs">{g}</span>
                  ))}
                  <span className="px-1.5 py-0.5 rounded bg-secondary text-muted-foreground text-xs">{entry.typical_bpm_range as string} BPM</span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{entry.style_description as string}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function StatusOverviewPanel() {
  const [loading, setLoading] = useState(false)
  const [beats, setBeats] = useState<unknown[]>([])
  const [fetched, setFetched] = useState(false)

  async function loadBeats() {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('beats')
      .select('id, title, analysis_status, ai_energy, underground_vibe, ai_mood, ai_genres, created_at')
      .order('created_at', { ascending: false })
      .limit(50)
    setBeats(data ?? [])
    setFetched(true)
    setLoading(false)
  }

  const statusColor = (s: string | null) => {
    if (s === 'completed') return 'text-green-400'
    if (s === 'processing') return 'text-yellow-400'
    if (s === 'failed') return 'text-red-400'
    return 'text-muted-foreground'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Last 50 beats and their AI analysis status.</p>
        <button
          onClick={loadBeats}
          disabled={loading}
          className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {loading ? 'Loading…' : fetched ? 'Refresh' : 'Load'}
        </button>
      </div>
      {fetched && (
        <div className="overflow-auto rounded-xl border border-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Title</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Mood</th>
                <th className="text-center px-3 py-2 font-medium text-muted-foreground">Energy</th>
                <th className="text-center px-3 py-2 font-medium text-muted-foreground">UG Vibe</th>
              </tr>
            </thead>
            <tbody>
              {beats.map((b) => {
                const beat = b as Record<string, unknown>
                return (
                  <tr key={beat.id as string} className="border-b border-border/40 hover:bg-secondary/20">
                    <td className="px-3 py-2 max-w-[140px] truncate">{beat.title as string}</td>
                    <td className={`px-3 py-2 font-medium ${statusColor(beat.analysis_status as string | null)}`}>
                      {(beat.analysis_status as string) ?? 'pending'}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{(beat.ai_mood as string) ?? '—'}</td>
                    <td className="px-3 py-2 text-center">{(beat.ai_energy as number) ?? '—'}</td>
                    <td className="px-3 py-2 text-center">{(beat.underground_vibe as number) ?? '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
