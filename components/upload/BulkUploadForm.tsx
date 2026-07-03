'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Upload, Music2, ImageIcon, X, Check, ChevronDown,
  Loader2, AlertCircle, Sparkles, ExternalLink,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { GENRES, KEYS, type Genre, type Key } from '@/types'
import { TypeBeatSelector } from '@/components/upload/TypeBeatSelector'

// ── Types ─────────────────────────────────────────────────────────────────────

type UploadStatus = 'pending' | 'uploading' | 'done' | 'error'
type AnalysisStatus = 'pending' | 'analyzing' | 'done' | 'failed'
type Phase = 'select' | 'uploading' | 'review' | 'publishing' | 'done'

interface BulkBeat {
  uid: string
  beatId: string | null
  file: File
  filename: string
  audioUrl: string | null

  // Editable
  typeBeat: string       // mandatory → stored as title
  typeBeatTags: string[] // artist type beat tags (up to 3)
  bpm: string
  key: string
  genres: Genre[]

  // Per-beat cover override
  customCoverFile: File | null
  customCoverPreview: string | null

  // Status
  uploadStatus: UploadStatus
  uploadError: string | null
  analysisStatus: AnalysisStatus
  aiGenres: string[] | null
  aiMood: string | null
  aiEnergy: number | null

  removed: boolean
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function cleanFilename(name: string): string {
  return name
    .replace(/\.[^.]+$/, '')       // strip extension
    .replace(/[-_]/g, ' ')         // underscores/hyphens → spaces
    .replace(/\s+/g, ' ')
    .trim()
}

function titleCase(str: string): string {
  return str.replace(/\b\w/g, (c) => c.toUpperCase())
}

function initBeat(file: File): BulkBeat {
  return {
    uid: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    beatId: null,
    file,
    filename: file.name,
    audioUrl: null,
    typeBeat: titleCase(cleanFilename(file.name)),
    typeBeatTags: [],
    bpm: '',
    key: '',
    genres: [],
    customCoverFile: null,
    customCoverPreview: null,
    uploadStatus: 'pending',
    uploadError: null,
    analysisStatus: 'pending',
    aiGenres: null,
    aiMood: null,
    aiEnergy: null,
    removed: false,
  }
}

// ── Main Component ─────────────────────────────────────────────────────────────

interface BulkUploadFormProps {
  userId: string
}

export function BulkUploadForm({ userId }: BulkUploadFormProps) {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('select')
  const [beats, setBeats] = useState<BulkBeat[]>([])
  const [defaultCoverFile, setDefaultCoverFile] = useState<File | null>(null)
  const [defaultCoverPreview, setDefaultCoverPreview] = useState<string | null>(null)
  const [defaultCoverUrl, setDefaultCoverUrl] = useState<string | null>(null)
  const [publishError, setPublishError] = useState<string | null>(null)
  const [price, setPrice] = useState('')
  const [stripeConnected, setStripeConnected] = useState(false)

  useEffect(() => {
    createClient()
      .from('profiles')
      .select('stripe_payouts_enabled')
      .eq('id', userId)
      .single()
      .then(({ data }) => { if (data?.stripe_payouts_enabled) setStripeConnected(true) })
  }, [userId])

  async function connectStripe() {
    const res = await fetch('/api/stripe/connect/onboard', { method: 'POST' })
    const data = await res.json()
    if (data.url) window.location.href = data.url
  }

  // ── File selection ───────────────────────────────────────────────────────────

  function handleAudioFiles(files: FileList | null) {
    if (!files) return
    const valid = Array.from(files)
      .filter((f) => f.type.startsWith('audio/') || /\.(mp3|wav|aiff|flac|ogg)$/i.test(f.name))
      .slice(0, 10 - beats.length)
    setBeats((prev) => [...prev, ...valid.map(initBeat)].slice(0, 10))
  }

  function handleDefaultCover(file: File | null) {
    setDefaultCoverFile(file)
    if (file) setDefaultCoverPreview(URL.createObjectURL(file))
    else setDefaultCoverPreview(null)
  }

  function removeAudioFile(uid: string) {
    setBeats((prev) => prev.filter((b) => b.uid !== uid))
  }

  // ── Upload & analyze ─────────────────────────────────────────────────────────

  async function startUpload() {
    if (beats.length === 0) return
    setPhase('uploading')

    const supabase = createClient()

    // Upload default cover first
    let globalCoverUrl: string | null = null
    if (defaultCoverFile) {
      const ext = defaultCoverFile.name.split('.').pop()
      const path = `${userId}/bulk-${Date.now()}-cover.${ext}`
      const { data } = await supabase.storage.from('beats-cover').upload(path, defaultCoverFile)
      if (data) {
        globalCoverUrl = supabase.storage.from('beats-cover').getPublicUrl(path).data.publicUrl
        setDefaultCoverUrl(globalCoverUrl)
      }
    }

    // Upload all audio files in parallel, updating state per-file
    await Promise.all(
      beats.map(async (beat) => {
        setBeats((prev) =>
          prev.map((b) => (b.uid === beat.uid ? { ...b, uploadStatus: 'uploading' } : b))
        )

        try {
          const ext = beat.file.name.split('.').pop()
          const path = `${userId}/bulk-${Date.now()}-${beat.uid}.${ext}`
          const { data: audioData, error: audioErr } = await supabase.storage
            .from('beats-audio')
            .upload(path, beat.file)

          if (audioErr || !audioData) throw new Error(audioErr?.message ?? 'Upload failed')

          const audioUrl = supabase.storage.from('beats-audio').getPublicUrl(path).data.publicUrl

          // Insert beat record
          const { data: newBeat, error: insertErr } = await supabase
            .from('beats')
            .insert({
              producer_id: userId,
              title: beat.typeBeat || cleanFilename(beat.file.name),
              audio_url: audioUrl,
              cover_url: globalCoverUrl,
              analysis_status: 'pending',
            })
            .select('id')
            .single()

          if (insertErr || !newBeat) throw new Error(insertErr?.message ?? 'Insert failed')

          const beatId = newBeat.id

          // Fire AI analysis + embedding (fire-and-forget)
          const payload = JSON.stringify({ beatId })
          fetch('/api/beats/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
          }).catch(() => {})
          fetch('/api/ai/generate-embedding', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
          }).catch(() => {})

          // Extract file metadata (BPM/key from ID3 tags) — await for pre-fill
          let extractedBpm = ''
          let extractedKey = ''
          try {
            const metaRes = await fetch('/api/beats/extract-metadata', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ beatId }),
            })
            if (metaRes.ok) {
              const meta = await metaRes.json()
              if (meta.bpm) extractedBpm = String(meta.bpm)
              if (meta.key && KEYS.includes(meta.key as Key)) extractedKey = meta.key
            }
          } catch { /* metadata is best-effort */ }

          setBeats((prev) =>
            prev.map((b) =>
              b.uid === beat.uid
                ? {
                    ...b,
                    beatId,
                    audioUrl,
                    uploadStatus: 'done',
                    analysisStatus: 'analyzing',
                    bpm: extractedBpm,
                    key: extractedKey,
                  }
                : b
            )
          )
        } catch (err) {
          setBeats((prev) =>
            prev.map((b) =>
              b.uid === beat.uid
                ? { ...b, uploadStatus: 'error', uploadError: String(err) }
                : b
            )
          )
        }
      })
    )

    setPhase('review')
  }

  // ── Polling for AI analysis status ───────────────────────────────────────────

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (phase !== 'review') return

    pollingRef.current = setInterval(async () => {
      const pending = beats.filter(
        (b) => !b.removed && b.beatId && b.analysisStatus === 'analyzing'
      )
      if (pending.length === 0) {
        if (pollingRef.current) clearInterval(pollingRef.current)
        return
      }

      const supabase = createClient()
      const { data } = await supabase
        .from('beats')
        .select('id, analysis_status, ai_genres, ai_mood, ai_energy')
        .in('id', pending.map((b) => b.beatId!))

      if (!data) return

      setBeats((prev) =>
        prev.map((b) => {
          const updated = data.find((d: { id: string }) => d.id === b.beatId)
          if (!updated) return b
          const isDone = updated.analysis_status === 'completed'
          const isFailed = updated.analysis_status === 'failed'
          return {
            ...b,
            analysisStatus: isDone ? 'done' : isFailed ? 'failed' : b.analysisStatus,
            aiGenres: updated.ai_genres ?? b.aiGenres,
            aiMood: updated.ai_mood ?? b.aiMood,
            aiEnergy: updated.ai_energy ?? b.aiEnergy,
          }
        })
      )
    }, 3000)

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Publish ─────────────────────────────────────────────────────────────────

  async function publishAll() {
    setPhase('publishing')
    setPublishError(null)
    const supabase = createClient()

    const active = beats.filter((b) => !b.removed && b.beatId)

    try {
      await Promise.all(
        active.map(async (beat) => {
          let coverUrl: string | null = defaultCoverUrl

          // Upload per-beat custom cover if set
          if (beat.customCoverFile) {
            const ext = beat.customCoverFile.name.split('.').pop()
            const path = `${userId}/bulk-${Date.now()}-${beat.uid}-cover.${ext}`
            const { data } = await supabase.storage
              .from('beats-cover')
              .upload(path, beat.customCoverFile)
            if (data) {
              coverUrl = supabase.storage.from('beats-cover').getPublicUrl(path).data.publicUrl
            }
          }

          const priceCents = price && parseFloat(price) >= 0.99
            ? Math.round(parseFloat(price) * 100)
            : 0

          await supabase
            .from('beats')
            .update({
              title: beat.typeBeat.trim(),
              bpm: beat.bpm ? parseInt(beat.bpm, 10) : null,
              key: beat.key || null,
              genre: beat.genres.length > 0 ? beat.genres : null,
              type_beat_tags: beat.typeBeatTags.length > 0 ? beat.typeBeatTags : null,
              cover_url: coverUrl,
              price_cents: priceCents,
            })
            .eq('id', beat.beatId!)
        })
      )

      setPhase('done')
      setTimeout(() => router.push('/feed'), 1800)
    } catch (err) {
      setPublishError(String(err))
      setPhase('review')
    }
  }

  // ── Render phases ────────────────────────────────────────────────────────────

  if (phase === 'done') {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
          <Check className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold">
          {beats.filter((b) => !b.removed).length} beats published!
        </h2>
        <p className="text-muted-foreground text-sm">Redirecting to feed…</p>
      </div>
    )
  }

  if (phase === 'uploading') {
    return (
      <UploadingPhase beats={beats} />
    )
  }

  if (phase === 'publishing') {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground text-sm">
          Publishing {beats.filter((b) => !b.removed).length} beats…
        </p>
      </div>
    )
  }

  if (phase === 'review') {
    return (
      <ReviewPhase
        beats={beats}
        setBeats={setBeats}
        defaultCoverUrl={defaultCoverUrl}
        defaultCoverPreview={defaultCoverPreview}
        onPublish={publishAll}
        publishError={publishError}
      />
    )
  }

  // Phase: select
  return (
    <SelectPhase
      beats={beats}
      onAudioFiles={handleAudioFiles}
      onRemoveAudio={removeAudioFile}
      defaultCoverPreview={defaultCoverPreview}
      onDefaultCover={handleDefaultCover}
      onStart={startUpload}
      price={price}
      onPriceChange={setPrice}
      stripeConnected={stripeConnected}
      onConnectStripe={connectStripe}
    />
  )
}

// ── Select Phase ──────────────────────────────────────────────────────────────

function SelectPhase({
  beats,
  onAudioFiles,
  onRemoveAudio,
  defaultCoverPreview,
  onDefaultCover,
  onStart,
  price,
  onPriceChange,
  stripeConnected,
  onConnectStripe,
}: {
  beats: BulkBeat[]
  onAudioFiles: (files: FileList | null) => void
  onRemoveAudio: (uid: string) => void
  defaultCoverPreview: string | null
  onDefaultCover: (file: File | null) => void
  onStart: () => void
  price: string
  onPriceChange: (v: string) => void
  stripeConnected: boolean
  onConnectStripe: () => void
}) {
  const remaining = 10 - beats.length

  return (
    <div className="space-y-6">
      {/* Audio dropzone */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Beat files <span className="text-destructive">*</span></p>
          <span className="text-xs text-muted-foreground">{beats.length}/10 selected</span>
        </div>

        {remaining > 0 && (
          <label className="flex flex-col items-center justify-center gap-2 h-28 rounded-2xl border-2 border-dashed border-border hover:border-primary/40 transition-colors cursor-pointer bg-secondary/20">
            <input
              type="file"
              accept="audio/*,.wav,.mp3,.aiff,.flac"
              multiple
              className="hidden"
              onChange={(e) => onAudioFiles(e.target.files)}
            />
            <Upload className="w-7 h-7 text-muted-foreground" />
            <p className="text-sm text-muted-foreground font-medium">
              Tap to add up to {remaining} more beat{remaining !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-muted-foreground">WAV, MP3, AIFF, FLAC</p>
          </label>
        )}

        {beats.length > 0 && (
          <div className="space-y-2">
            {beats.map((beat) => (
              <div
                key={beat.uid}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/40"
              >
                <Music2 className="w-4 h-4 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{beat.filename}</p>
                  <p className="text-xs text-muted-foreground">
                    {(beat.file.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>
                <button
                  onClick={() => onRemoveAudio(beat.uid)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Default cover image */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Default cover image <span className="text-muted-foreground font-normal text-xs">(applied to all beats)</span></p>
        <label className="flex items-center gap-4 cursor-pointer group">
          <div className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden flex-shrink-0">
            {defaultCoverPreview ? (
              <Image src={defaultCoverPreview} alt="cover" width={80} height={80} className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="w-6 h-6 text-muted-foreground" />
            )}
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={(e) => onDefaultCover(e.target.files?.[0] ?? null)} />
          <div className="flex-1">
            <p className="text-sm font-medium">{defaultCoverPreview ? 'Change cover' : 'Add cover art'}</p>
            <p className="text-xs text-muted-foreground">JPG, PNG, WebP — optional</p>
          </div>
          {defaultCoverPreview && (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); onDefaultCover(null) }}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </label>
      </div>

      {/* Price — applied to all beats */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Download price <span className="text-muted-foreground font-normal text-xs">(applied to all beats)</span></p>
        {!stripeConnected ? (
          <div className="flex items-center justify-between px-3 py-3 rounded-xl border border-border bg-secondary/40">
            <div>
              <p className="text-sm font-medium">Connect Stripe to charge for beats</p>
              <p className="text-xs text-muted-foreground mt-0.5">Set up payouts to unlock paid downloads</p>
            </div>
            <button
              type="button"
              onClick={onConnectStripe}
              className="ml-3 flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium bg-secondary/60 hover:bg-secondary transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Connect
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <input
                type="number"
                placeholder="0.00 — leave blank for free"
                min={0}
                step={0.01}
                value={price}
                onChange={(e) => onPriceChange(e.target.value)}
                className="w-full bg-secondary/50 border border-border/40 rounded-lg pl-6 pr-3 py-2 text-sm outline-none focus:border-primary/60"
              />
            </div>
            {price && parseFloat(price) > 0 && parseFloat(price) < 0.99 && (
              <p className="text-xs text-destructive">Minimum paid price is $0.99</p>
            )}
            {(!price || parseFloat(price) === 0) && (
              <p className="text-xs text-muted-foreground">Free download for all artists</p>
            )}
          </div>
        )}
      </div>

      <button
        onClick={onStart}
        disabled={beats.length === 0}
        className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-40 transition-opacity"
      >
        Upload & Analyze {beats.length > 0 ? `${beats.length} Beat${beats.length !== 1 ? 's' : ''}` : ''}
      </button>
    </div>
  )
}

// ── Uploading Phase ───────────────────────────────────────────────────────────

function UploadingPhase({ beats }: { beats: BulkBeat[] }) {
  const done = beats.filter((b) => b.uploadStatus === 'done').length
  const total = beats.length

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold mb-0.5">Uploading & analyzing…</p>
        <p className="text-xs text-muted-foreground">{done}/{total} files uploaded</p>
      </div>
      <div className="space-y-2">
        {beats.map((beat) => (
          <div
            key={beat.uid}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-secondary/30 border border-border/30"
          >
            <Music2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <p className="text-sm truncate flex-1">{beat.filename}</p>
            {beat.uploadStatus === 'pending' && (
              <span className="w-2 h-2 rounded-full bg-muted-foreground/30 flex-shrink-0" />
            )}
            {beat.uploadStatus === 'uploading' && (
              <Loader2 className="w-4 h-4 text-primary animate-spin flex-shrink-0" />
            )}
            {beat.uploadStatus === 'done' && (
              <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
            )}
            {beat.uploadStatus === 'error' && (
              <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Review Phase ──────────────────────────────────────────────────────────────

function ReviewPhase({
  beats,
  setBeats,
  defaultCoverUrl,
  defaultCoverPreview,
  onPublish,
  publishError,
}: {
  beats: BulkBeat[]
  setBeats: React.Dispatch<React.SetStateAction<BulkBeat[]>>
  defaultCoverUrl: string | null
  defaultCoverPreview: string | null
  onPublish: () => void
  publishError: string | null
}) {
  const active = beats.filter((b) => !b.removed)
  const ready = active.filter((b) => b.typeBeat.trim().length > 0)
  const allReady = active.length > 0 && ready.length === active.length

  function updateBeat(uid: string, patch: Partial<BulkBeat>) {
    setBeats((prev) => prev.map((b) => (b.uid === uid ? { ...b, ...patch } : b)))
  }

  function removeBeat(uid: string) {
    setBeats((prev) => prev.map((b) => (b.uid === uid ? { ...b, removed: true } : b)))
  }

  function setCustomCover(uid: string, file: File) {
    const preview = URL.createObjectURL(file)
    updateBeat(uid, { customCoverFile: file, customCoverPreview: preview })
  }

  if (active.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground text-sm">All beats removed. Go back and try again.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-32">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{active.length} Beat{active.length !== 1 ? 's' : ''} — Review & Edit</p>
        <p className="text-xs text-muted-foreground">{ready.length}/{active.length} ready</p>
      </div>

      {active.map((beat) => (
        <BeatReviewCard
          key={beat.uid}
          beat={beat}
          defaultCoverPreview={defaultCoverPreview}
          defaultCoverUrl={defaultCoverUrl}
          onUpdate={(patch) => updateBeat(beat.uid, patch)}
          onRemove={() => removeBeat(beat.uid)}
          onCustomCover={(file) => setCustomCover(beat.uid, file)}
        />
      ))}

      {publishError && (
        <div className="px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
          {publishError}
        </div>
      )}

      {/* Sticky publish button */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-background/90 backdrop-blur-xl border-t border-border px-4 py-3"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}>
        {!allReady && (
          <p className="text-xs text-muted-foreground text-center mb-2">
            {active.length - ready.length} beat{active.length - ready.length !== 1 ? 's' : ''} missing a Type Beat name
          </p>
        )}
        <button
          onClick={onPublish}
          disabled={!allReady}
          className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-40 transition-opacity"
        >
          Publish {ready.length} Beat{ready.length !== 1 ? 's' : ''}
        </button>
      </div>
    </div>
  )
}

// ── Beat Review Card ───────────────────────────────────────────────────────────

function BeatReviewCard({
  beat,
  defaultCoverPreview,
  defaultCoverUrl: _defaultCoverUrl,
  onUpdate,
  onRemove,
  onCustomCover,
}: {
  beat: BulkBeat
  defaultCoverPreview: string | null
  defaultCoverUrl: string | null
  onUpdate: (patch: Partial<BulkBeat>) => void
  onRemove: () => void
  onCustomCover: (file: File) => void
}) {
  const coverPreview = beat.customCoverPreview ?? defaultCoverPreview
  const typeBeatMissing = beat.typeBeat.trim().length === 0
  const [genreOpen, setGenreOpen] = useState(false)

  function toggleGenre(g: Genre) {
    const current = beat.genres
    const next = current.includes(g)
      ? current.filter((x) => x !== g)
      : [...current, g].slice(0, 3)
    onUpdate({ genres: next })
  }

  return (
    <div className={`rounded-2xl border bg-card overflow-hidden ${typeBeatMissing ? 'border-destructive/40' : 'border-border/60'}`}>
      {/* Card header: cover + filename + remove */}
      <div className="flex items-center gap-3 px-3 pt-3 pb-2">
        <label className="relative w-14 h-14 rounded-lg overflow-hidden bg-secondary flex-shrink-0 cursor-pointer">
          {coverPreview ? (
            <Image src={coverPreview} alt="cover" fill className="object-cover" sizes="56px" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-muted-foreground" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
            <Upload className="w-4 h-4 text-white" />
          </div>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onCustomCover(f) }}
          />
        </label>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground truncate">{beat.filename}</p>
          <AIStatusBadge status={beat.analysisStatus} aiMood={beat.aiMood} aiEnergy={beat.aiEnergy} aiGenres={beat.aiGenres} />
        </div>
        <button onClick={onRemove} className="text-muted-foreground hover:text-destructive transition-colors ml-1 flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="px-3 pb-3 space-y-2.5">
        {/* Type Beat — mandatory */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
            Type Beat
            <span className="text-destructive">*</span>
          </label>
          <input
            value={beat.typeBeat}
            onChange={(e) => onUpdate({ typeBeat: e.target.value })}
            placeholder="e.g. Playboi Carti Type Beat"
            className={`w-full bg-secondary/50 border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/60 transition-colors ${
              typeBeatMissing ? 'border-destructive/50' : 'border-border/40'
            }`}
          />
          {typeBeatMissing && (
            <p className="text-xs text-destructive mt-0.5">Required before publishing</p>
          )}
        </div>

        {/* Type Beat Artist Tags */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            Type Beat Artists <span className="text-muted-foreground font-normal">(up to 3)</span>
          </label>
          <TypeBeatSelector
            selected={beat.typeBeatTags}
            onChange={(tags) => onUpdate({ typeBeatTags: tags })}
          />
        </div>

        {/* BPM + Key */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">BPM</label>
            <input
              value={beat.bpm}
              onChange={(e) => onUpdate({ bpm: e.target.value.replace(/\D/g, '') })}
              placeholder="140"
              inputMode="numeric"
              className="w-full bg-secondary/50 border border-border/40 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/60"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Key</label>
            <div className="relative">
              <select
                value={beat.key}
                onChange={(e) => onUpdate({ key: e.target.value })}
                className="w-full appearance-none bg-secondary/50 border border-border/40 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary/60 pr-7"
              >
                <option value="">Select</option>
                {KEYS.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Genres */}
        <div>
          <button
            onClick={() => setGenreOpen((v) => !v)}
            className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1.5"
          >
            Genres {beat.genres.length > 0 ? `(${beat.genres.length}/3)` : ''}
            <ChevronDown className={`w-3 h-3 transition-transform ${genreOpen ? 'rotate-180' : ''}`} />
          </button>

          {beat.genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {beat.genres.map((g) => (
                <button
                  key={g}
                  onClick={() => toggleGenre(g)}
                  className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/15 text-primary border border-primary/30"
                >
                  {g} ×
                </button>
              ))}
            </div>
          )}

          {genreOpen && (
            <div className="flex flex-wrap gap-1.5">
              {GENRES.map((g) => {
                const selected = beat.genres.includes(g)
                const maxed = beat.genres.length >= 3 && !selected
                return (
                  <button
                    key={g}
                    onClick={() => toggleGenre(g)}
                    disabled={maxed}
                    className={`px-2 py-0.5 rounded-full text-xs font-medium border transition-all disabled:opacity-30 ${
                      selected
                        ? 'bg-primary/15 text-primary border-primary/30'
                        : 'border-border text-muted-foreground'
                    }`}
                  >
                    {g}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── AI Status Badge ───────────────────────────────────────────────────────────

function AIStatusBadge({
  status,
  aiMood,
  aiEnergy,
  aiGenres,
}: {
  status: AnalysisStatus
  aiMood: string | null
  aiEnergy: number | null
  aiGenres: string[] | null
}) {
  if (status === 'pending' || status === 'analyzing') {
    return (
      <div className="flex items-center gap-1.5 mt-0.5">
        <Loader2 className="w-3 h-3 text-muted-foreground animate-spin" />
        <span className="text-xs text-muted-foreground">AI analyzing…</span>
      </div>
    )
  }

  if (status === 'failed') {
    return (
      <div className="flex items-center gap-1 mt-0.5">
        <AlertCircle className="w-3 h-3 text-muted-foreground/50" />
        <span className="text-xs text-muted-foreground/50">Analysis unavailable</span>
      </div>
    )
  }

  const parts: string[] = []
  if (aiMood) parts.push(aiMood)
  if (aiEnergy != null) parts.push(`E${aiEnergy}/10`)
  if (aiGenres?.length) parts.push(aiGenres.slice(0, 2).join(', '))

  if (parts.length === 0) return null

  return (
    <div className="flex items-center gap-1 mt-0.5">
      <Sparkles className="w-3 h-3 text-primary/60 flex-shrink-0" />
      <span className="text-xs text-muted-foreground truncate">{parts.join(' · ')}</span>
    </div>
  )
}
