'use client'

import { TrendingUp, Download, Music2, Hash } from 'lucide-react'

export interface AdminChartsData {
  activeUsers: number
  signupsPerDay: number[]
  beatsPerDay: number[]
  downloadsPerDay: number[]
  dayLabels: string[]
  topBeats: { title: string; downloads: number }[]
  genres: { genre: string; count: number }[]
}

function sum(arr: number[]) { return arr.reduce((a, b) => a + b, 0) }

// ── Sparkline ─────────────────────────────────────────────────────
// Single line + area fill. preserveAspectRatio="none" lets it fill
// any container width while the CSS height stays fixed.
function Sparkline({ values, color, id }: { values: number[]; color: string; id: string }) {
  if (values.length < 2) return <div className="h-12" />
  const W = 400, H = 56
  const max = Math.max(...values, 1)
  const pts = values.map((v, i) => [
    (i / (values.length - 1)) * W,
    H - 4 - (v / max) * (H - 12),
  ])
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `0,${H} ` + pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ') + ` ${W},${H}`
  const [lx, ly] = pts[pts.length - 1]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-12" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sg-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#sg-${id})`} />
      <polyline points={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r="3.5" fill={color} />
    </svg>
  )
}

// ── Daily bar chart ────────────────────────────────────────────────
function DailyBars({ values, color = '#00ff88' }: { values: number[]; color?: string }) {
  const W = 500, H = 64
  const max = Math.max(...values, 1)
  const n = values.length
  const slot = W / n
  const barW = Math.max(slot * 0.68, 1.5)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-16" preserveAspectRatio="none">
      {[0.33, 0.66].map(pct => (
        <line key={pct} x1={0} y1={H * (1 - pct)} x2={W} y2={H * (1 - pct)}
          stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      ))}
      {values.map((v, i) => {
        const bh = (v / max) * (H - 4)
        return (
          <rect key={i}
            x={i * slot + (slot - barW) / 2}
            y={H - bh - 2}
            width={barW}
            height={Math.max(bh, v > 0 ? 2 : 0)}
            rx="2"
            fill={color}
            fillOpacity={v > 0 ? 0.82 : 0.06}
          />
        )
      })}
    </svg>
  )
}

// ── Horizontal bar row ────────────────────────────────────────────
function HBar({ label, value, max, color }: {
  label: string; value: number; max: number; color: string
}) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="grid items-center gap-2" style={{ gridTemplateColumns: '1fr auto auto' }}>
      <span className="text-[11px] truncate text-white/40" title={label}>{label}</span>
      <div className="w-20 h-[4px] rounded-full overflow-hidden bg-white/[0.07]">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[11px] font-mono text-white/40 w-6 text-right" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </span>
    </div>
  )
}

// ── Section card ──────────────────────────────────────────────────
function Card({ title, icon, children }: {
  title: string; icon: React.ReactNode; children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
      <div className="flex items-center gap-2 mb-3 text-white/45">
        {icon}
        <span className="text-xs font-semibold text-white/60 tracking-wide uppercase">{title}</span>
      </div>
      {children}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────
export function AdminCharts({ data }: { data: AdminChartsData }) {
  const s30 = sum(data.signupsPerDay)
  const b30 = sum(data.beatsPerDay)
  const d30 = sum(data.downloadsPerDay)
  const maxBeat  = Math.max(...data.topBeats.map(b => b.downloads), 1)
  const maxGenre = Math.max(...data.genres.map(g => g.count), 1)
  const x0 = data.dayLabels[0] ?? ''
  const xN = data.dayLabels[data.dayLabels.length - 1] ?? ''

  return (
    <div className="flex flex-col gap-3">

      {/* Active users pill */}
      <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-primary/25 bg-primary/[0.07]">
        <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"
          style={{ boxShadow: '0 0 6px #00ff88' }} />
        <span className="text-sm font-semibold text-primary"
          style={{ fontVariantNumeric: 'tabular-nums' }}>
          {data.activeUsers} active this week
        </span>
        <span className="text-[11px] text-white/30 ml-auto">users w/ activity in last 7 days</span>
      </div>

      {/* Platform growth — dual sparklines */}
      <Card title="Platform Growth" icon={<TrendingUp className="w-3.5 h-3.5" />}>
        <div className="grid grid-cols-2 gap-4 mb-1">
          <div>
            <p className="text-2xl font-bold leading-none mb-1"
              style={{ fontVariantNumeric: 'tabular-nums' }}>+{s30}</p>
            <div className="flex items-center gap-1.5 mb-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
              <span className="text-[11px] text-white/40">new users</span>
            </div>
            <Sparkline values={data.signupsPerDay} color="#00ff88" id="signups" />
          </div>
          <div>
            <p className="text-2xl font-bold leading-none mb-1"
              style={{ fontVariantNumeric: 'tabular-nums' }}>+{b30}</p>
            <div className="flex items-center gap-1.5 mb-2.5">
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#a78bfa' }} />
              <span className="text-[11px] text-white/40">beats uploaded</span>
            </div>
            <Sparkline values={data.beatsPerDay} color="#a78bfa" id="beats" />
          </div>
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-white/20">{x0}</span>
          <span className="text-[10px] text-white/20">{xN}</span>
        </div>
      </Card>

      {/* Download activity — bar chart */}
      <Card title="Download Activity" icon={<Download className="w-3.5 h-3.5" />}>
        <div className="flex justify-between items-end mb-3">
          <div>
            <p className="text-2xl font-bold leading-none mb-0.5"
              style={{ fontVariantNumeric: 'tabular-nums' }}>{d30}</p>
            <span className="text-[11px] text-white/40">downloads in 30 days</span>
          </div>
          <span className="text-xs text-white/30" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {(d30 / 30).toFixed(1)}/day avg
          </span>
        </div>
        <DailyBars values={data.downloadsPerDay} />
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-white/20">{x0}</span>
          <span className="text-[10px] text-white/20">{xN}</span>
        </div>
      </Card>

      {/* Top beats + genre mix side by side */}
      <div className="grid grid-cols-2 gap-3">
        <Card title="Top Beats" icon={<Music2 className="w-3.5 h-3.5" />}>
          <div className="flex flex-col gap-2.5">
            {data.topBeats.length === 0 ? (
              <p className="text-[11px] text-white/25 text-center py-2">No downloads yet</p>
            ) : data.topBeats.map(b => (
              <HBar key={b.title} label={b.title} value={b.downloads} max={maxBeat} color="#00ff88" />
            ))}
          </div>
        </Card>

        <Card title="Genre Mix" icon={<Hash className="w-3.5 h-3.5" />}>
          <div className="flex flex-col gap-2.5">
            {data.genres.length === 0 ? (
              <p className="text-[11px] text-white/25 text-center py-2">No genre data</p>
            ) : data.genres.map(g => (
              <HBar key={g.genre} label={g.genre} value={g.count} max={maxGenre} color="#a78bfa" />
            ))}
          </div>
        </Card>
      </div>

    </div>
  )
}
