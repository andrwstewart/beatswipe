import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Music2, Users, Mic2, Headphones } from 'lucide-react'
import { AdminCharts } from './AdminCharts'
import type { AdminChartsData } from './AdminCharts'

// Group an array of { created_at } records into daily buckets for the
// past `days` days. Index 0 = oldest, index (days-1) = today.
function bucketByDay(items: { created_at: string }[], days = 30): number[] {
  const counts = new Array(days).fill(0)
  const now = Date.now()
  for (const item of items) {
    const daysAgo = Math.floor((now - new Date(item.created_at).getTime()) / 86_400_000)
    if (daysAgo >= 0 && daysAgo < days) {
      counts[days - 1 - daysAgo]++
    }
  }
  return counts
}

function getDayLabels(days = 30): string[] {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(Date.now() - (days - 1 - i) * 86_400_000)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  })
}

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const sevenDaysAgo  = new Date(Date.now() -  7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { count: beatCount },
    { count: userCount },
    { count: producerCount },
    { count: artistCount },
    { data: profiles },
    { data: beats },
    { data: downloadInteractions },
    { data: messages },
    // ── chart data ──────────────────────────────────────────────
    { data: recentSignups },
    { data: recentBeatUploads },
    { data: recentDownloads },
    { data: activeInteractions },
  ] = await Promise.all([
    supabase.from('beats').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).in('role', ['producer', 'both']),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).in('role', ['artist', 'both']),
    supabase.from('profiles').select('id, username, display_name, role').order('created_at', { ascending: false }),
    supabase.from('beats').select('id, producer_id, title, downloads_count, genre'),
    supabase.from('interactions').select('user_id, beat_id, beats(title)').eq('type', 'download'),
    supabase.from('messages').select('sender_id'),
    supabase.from('profiles').select('created_at').gte('created_at', thirtyDaysAgo),
    supabase.from('beats').select('created_at').gte('created_at', thirtyDaysAgo),
    supabase.from('interactions').select('created_at').eq('type', 'download').gte('created_at', thirtyDaysAgo),
    supabase.from('interactions').select('user_id').gte('created_at', sevenDaysAgo),
  ])

  // ── Per-user table rows (unchanged) ──────────────────────────────
  const userRows = (profiles ?? []).map((profile) => {
    const userBeats = (beats ?? []).filter((b) => b.producer_id === profile.id)
    const uploadsCount = userBeats.length
    const downloadsReceived = userBeats.reduce((sum, b) => sum + (b.downloads_count ?? 0), 0)

    const beatsDownloaded = (downloadInteractions ?? [])
      .filter((d) => d.user_id === profile.id)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((d) => (d.beats as any)?.title ?? 'Unknown')

    const messagesSent = (messages ?? []).filter((m) => m.sender_id === profile.id).length

    return { ...profile, uploadsCount, downloadsReceived, beatsDownloaded, messagesSent }
  })

  // ── Stat tiles ────────────────────────────────────────────────────
  const stats = [
    { label: 'Beats',     value: beatCount     ?? 0, icon: <Music2 className="w-4 h-4" /> },
    { label: 'Users',     value: userCount      ?? 0, icon: <Users className="w-4 h-4" /> },
    { label: 'Producers', value: producerCount  ?? 0, icon: <Mic2 className="w-4 h-4" /> },
    { label: 'Artists',   value: artistCount    ?? 0, icon: <Headphones className="w-4 h-4" /> },
  ]

  // ── Chart data ────────────────────────────────────────────────────
  const activeUsers = new Set((activeInteractions ?? []).map(i => i.user_id)).size

  const signupsPerDay    = bucketByDay(recentSignups     ?? [])
  const beatsPerDay      = bucketByDay(recentBeatUploads ?? [])
  const downloadsPerDay  = bucketByDay(recentDownloads   ?? [])
  const dayLabels        = getDayLabels()

  const topBeats = [...(beats ?? [])]
    .sort((a, b) => (b.downloads_count ?? 0) - (a.downloads_count ?? 0))
    .slice(0, 5)
    .filter(b => (b.downloads_count ?? 0) > 0)
    .map(b => ({ title: b.title, downloads: b.downloads_count ?? 0 }))

  const genreCounts: Record<string, number> = {}
  for (const beat of beats ?? []) {
    for (const g of beat.genre ?? []) {
      genreCounts[g] = (genreCounts[g] ?? 0) + 1
    }
  }
  const genres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([genre, count]) => ({ genre, count }))

  const chartData: AdminChartsData = {
    activeUsers,
    signupsPerDay,
    beatsPerDay,
    downloadsPerDay,
    dayLabels,
    topBeats,
    genres,
  }

  return (
    <div
      className="min-h-dvh p-4 flex flex-col gap-6"
      style={{ paddingTop: 'calc(4rem + env(safe-area-inset-top, 0px))', paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <h1 className="text-2xl font-bold">Admin</h1>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-secondary/30 p-5 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              {s.icon}
              {s.label}
            </div>
            <span className="text-4xl font-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {s.value}
            </span>
          </div>
        ))}
      </div>

      {/* Charts */}
      <AdminCharts data={chartData} />

      {/* User table */}
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">All Users ({userRows.length})</h2>
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-border bg-secondary/40">
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Name</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Role</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-medium">Uploads</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-medium">Downloads Recv'd</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Beats Downloaded</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-medium">Messages Sent</th>
              </tr>
            </thead>
            <tbody>
              {userRows.map((u, i) => (
                <tr key={u.id} className={`border-b border-border/50 last:border-0 ${i % 2 === 0 ? '' : 'bg-secondary/10'}`}>
                  <td className="px-4 py-3">
                    <div className="font-medium">{u.display_name ?? u.username}</div>
                    <div className="text-xs text-muted-foreground">@{u.username}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                      u.role === 'producer' ? 'bg-primary/15 text-primary' :
                      u.role === 'both'     ? 'bg-purple-500/15 text-purple-400' :
                                             'bg-secondary text-muted-foreground'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{u.uploadsCount}</td>
                  <td className="px-4 py-3 text-right font-mono">{u.downloadsReceived}</td>
                  <td className="px-4 py-3">
                    {u.beatsDownloaded.length === 0 ? (
                      <span className="text-muted-foreground text-xs">—</span>
                    ) : (
                      <div className="flex flex-col gap-0.5">
                        {u.beatsDownloaded.slice(0, 3).map((title: string, j: number) => (
                          <span key={j} className="text-xs text-muted-foreground truncate max-w-[180px]">{title}</span>
                        ))}
                        {u.beatsDownloaded.length > 3 && (
                          <span className="text-xs text-primary">+{u.beatsDownloaded.length - 3} more</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{u.messagesSent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
