'use client'

import { useState } from 'react'
import { Music2, Layers } from 'lucide-react'
import { UploadForm } from './UploadForm'
import { BulkUploadForm } from './BulkUploadForm'

type Mode = 'single' | 'bulk'

export function UploadModeSwitcher({ userId }: { userId: string }) {
  const [mode, setMode] = useState<Mode>('single')

  return (
    <div>
      {/* Mode tabs */}
      <div className="flex gap-2 mb-6">
        <ModeTab
          active={mode === 'single'}
          onClick={() => setMode('single')}
          icon={<Music2 className="w-4 h-4" />}
          label="Single Beat"
        />
        <ModeTab
          active={mode === 'bulk'}
          onClick={() => setMode('bulk')}
          icon={<Layers className="w-4 h-4" />}
          label="Bulk Upload"
          badge="up to 10"
        />
      </div>

      {mode === 'single' && <UploadForm userId={userId} />}
      {mode === 'bulk' && <BulkUploadForm userId={userId} />}
    </div>
  )
}

function ModeTab({
  active,
  onClick,
  icon,
  label,
  badge,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  badge?: string
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all ${
        active
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border text-muted-foreground bg-secondary/30 hover:border-primary/30'
      }`}
    >
      {icon}
      {label}
      {badge && (
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${active ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'}`}>
          {badge}
        </span>
      )}
    </button>
  )
}
