'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Upload, Music2, Image as ImageIcon, Video, X, Check, ExternalLink } from 'lucide-react'
import { KEYS } from '@/types'
import { TypeBeatSelector } from '@/components/upload/TypeBeatSelector'

type FormData = {
  title: string
  bpm?: string
  key?: string
  description?: string
}

interface UploadFormProps {
  userId: string
}

export function UploadForm({ userId }: UploadFormProps) {
  const router = useRouter()
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [price, setPrice] = useState('')
  const [stripeConnected, setStripeConnected] = useState(false)
  const [typeBeatTags, setTypeBeatTags] = useState<string[]>([])
  const [typeBeatError, setTypeBeatError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState('')
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>()

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('profiles')
      .select('stripe_payouts_enabled')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        if (data?.stripe_payouts_enabled) setStripeConnected(true)
      })
  }, [userId])

  async function connectStripe() {
    const res = await fetch('/api/stripe/connect/onboard', { method: 'POST' })
    const data = await res.json()
    if (data.url) window.location.href = data.url
  }

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  function handleVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setVideoFile(file)
    setVideoPreview(URL.createObjectURL(file))
  }

  async function onSubmit(data: FormData) {
    if (!audioFile) return
    if (typeBeatTags.length === 0) {
      setTypeBeatError('Add at least one Type Beat tag before uploading.')
      return
    }
    setTypeBeatError(null)
    setUploading(true)
    setError(null)
    setProgress(5)

    const supabase = createClient()

    try {
      // ── 1. Upload audio ───────────────────────────────────────────────────
      setProgressLabel('Uploading audio…')
      const audioExt = audioFile.name.split('.').pop()
      const audioPath = `${userId}/${Date.now()}.${audioExt}`
      const { data: audioData, error: audioError } = await supabase.storage
        .from('beats-audio')
        .upload(audioPath, audioFile)
      if (audioError || !audioData) throw new Error(audioError?.message ?? 'Audio upload failed')
      const { data: audioUrlData } = supabase.storage.from('beats-audio').getPublicUrl(audioPath)
      setProgress(35)

      // ── 2. Upload cover image (optional) ─────────────────────────────────
      let coverUrl: string | null = null
      if (coverFile) {
        setProgressLabel('Uploading cover image…')
        const coverExt = coverFile.name.split('.').pop()
        const coverPath = `${userId}/${Date.now()}-cover.${coverExt}`
        const { data: coverData } = await supabase.storage
          .from('beats-cover')
          .upload(coverPath, coverFile)
        if (coverData) {
          const { data: cu } = supabase.storage.from('beats-cover').getPublicUrl(coverPath)
          coverUrl = cu.publicUrl
        }
      }
      setProgress(60)

      // ── 3. Upload video loop (optional) ───────────────────────────────────
      let videoUrl: string | null = null
      if (videoFile) {
        setProgressLabel('Uploading video…')
        const videoExt = videoFile.name.split('.').pop()
        const videoPath = `${userId}/${Date.now()}-video.${videoExt}`
        const { data: videoData } = await supabase.storage
          .from('beats-video')
          .upload(videoPath, videoFile)
        if (videoData) {
          const { data: vu } = supabase.storage.from('beats-video').getPublicUrl(videoPath)
          videoUrl = vu.publicUrl
        }
      }
      setProgress(85)

      // ── 4. Insert beat record ─────────────────────────────────────────────
      setProgressLabel('Saving beat…')
      const bpmNum = data.bpm ? parseInt(data.bpm, 10) : null
      // Convert price to cents; 0 = free
      const priceCents = price && parseFloat(price) >= 0.99
        ? Math.round(parseFloat(price) * 100)
        : 0
      const { data: newBeat, error: insertError } = await supabase
        .from('beats')
        .insert({
          producer_id: userId,
          title: data.title,
          bpm: bpmNum,
          key: data.key || null,
          description: data.description || null,
          type_beat_tags: typeBeatTags.length > 0 ? typeBeatTags : null,
          audio_url: audioUrlData.publicUrl,
          cover_url: coverUrl,
          video_url: videoUrl,
          price_cents: priceCents,
        })
        .select('id')
        .single()
      if (insertError) throw new Error(insertError.message)

      // Fire-and-forget AI analysis + audio embedding — run in parallel, don't block UX
      if (newBeat?.id) {
        const beatPayload = JSON.stringify({ beatId: newBeat.id })
        fetch('/api/beats/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: beatPayload,
        }).catch(() => {})
        fetch('/api/ai/generate-embedding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: beatPayload,
        }).catch(() => {})
      }

      setProgress(100)
      setSuccess(true)
      setTimeout(() => router.push('/feed'), 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.')
      setUploading(false)
      setProgress(0)
      setProgressLabel('')
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
          <Check className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold">Beat uploaded!</h2>
        <p className="text-muted-foreground text-sm">Redirecting to the feed…</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-32">

      {/* ── Audio file ───────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <Label>Beat file <span className="text-destructive">*</span></Label>
        <label
          className={`flex flex-col items-center justify-center gap-3 h-32 rounded-2xl border-2 border-dashed transition-colors cursor-pointer ${
            audioFile ? 'border-primary/60 bg-primary/5' : 'border-border hover:border-primary/40'
          }`}
        >
          <input
            type="file"
            accept="audio/*,.wav,.mp3,.aiff,.flac"
            className="hidden"
            onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
          />
          {audioFile ? (
            <div className="flex flex-col items-center gap-1">
              <Music2 className="w-8 h-8 text-primary" />
              <p className="text-sm font-medium text-primary">{audioFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {(audioFile.size / 1024 / 1024).toFixed(1)} MB
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <Upload className="w-8 h-8" />
              <p className="text-sm font-medium">Tap to upload beat</p>
              <p className="text-xs">WAV, MP3, AIFF, FLAC</p>
            </div>
          )}
        </label>
      </div>

      {/* ── Title ────────────────────────────────────────────────────────── */}
      <div className="space-y-1">
        <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
        <Input
          id="title"
          placeholder="e.g. Midnight Drip"
          className="bg-secondary/50"
          {...register('title', { required: 'Title is required' })}
        />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>

      {/* ── Description ──────────────────────────────────────────────────── */}
      <div className="space-y-1">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Tell artists about this beat — the vibe, the story, how you made it…"
          className="bg-secondary/50 resize-none"
          rows={3}
          maxLength={500}
          {...register('description')}
        />
      </div>

      {/* ── Price ────────────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <Label>Download price</Label>
        {!stripeConnected ? (
          <div className="flex items-center justify-between px-3 py-3 rounded-xl border border-border bg-secondary/40">
            <div>
              <p className="text-sm font-medium">Connect Stripe to charge for beats</p>
              <p className="text-xs text-muted-foreground mt-0.5">Set up payouts to unlock paid downloads</p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="ml-3 flex-shrink-0 gap-1.5 border-border text-xs"
              onClick={connectStripe}
            >
              <ExternalLink className="w-3 h-3" />
              Connect
            </Button>
          </div>
        ) : (
          <>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <Input
                type="number"
                placeholder="0.00 — leave blank for free"
                min={0}
                step={0.01}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="bg-secondary/50 pl-6"
              />
            </div>
            {price && parseFloat(price) > 0 && parseFloat(price) < 0.99 && (
              <p className="text-xs text-destructive">Minimum paid price is $0.99</p>
            )}
            {(!price || parseFloat(price) === 0) && (
              <p className="text-xs text-muted-foreground">Free download for all artists</p>
            )}
          </>
        )}
      </div>

      {/* ── BPM + Key ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="bpm">BPM</Label>
          <Input
            id="bpm"
            type="number"
            placeholder="140"
            min={40}
            max={300}
            className="bg-secondary/50"
            {...register('bpm')}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="key">Key</Label>
          <select
            id="key"
            className="w-full h-10 rounded-lg bg-secondary/50 border border-border px-3 text-sm text-foreground"
            {...register('key')}
          >
            <option value="">Select key</option>
            {KEYS.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Type Beat Tags ────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <Label>
          Type Beat <span className="text-destructive">*</span>{' '}
          <span className="text-muted-foreground text-xs font-normal">(up to 3 artists)</span>
        </Label>
        <TypeBeatSelector
          selected={typeBeatTags}
          onChange={(tags) => { setTypeBeatTags(tags); if (tags.length > 0) setTypeBeatError(null) }}
          error={typeBeatError}
        />
      </div>

      {/* ── Cover image ──────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <Label>Cover image</Label>
        <label className="flex items-center gap-4 cursor-pointer group">
          <div
            className={`w-20 h-20 rounded-xl border-2 border-dashed transition-colors flex items-center justify-center overflow-hidden flex-shrink-0 ${
              coverPreview ? 'border-primary/40' : 'border-border group-hover:border-primary/40'
            }`}
          >
            {coverPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverPreview} alt="cover" className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="w-6 h-6 text-muted-foreground" />
            )}
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
          <div className="flex-1">
            <p className="text-sm font-medium">{coverPreview ? 'Change image' : 'Add cover art'}</p>
            <p className="text-xs text-muted-foreground">JPG, PNG, WebP — shown on the beat card</p>
          </div>
          {coverPreview && (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); setCoverFile(null); setCoverPreview(null) }}
              className="text-muted-foreground hover:text-destructive flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </label>
      </div>

      {/* ── Video loop ───────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <Label>
          Background video{' '}
          <span className="text-muted-foreground text-xs font-normal">
            (plays behind your beat in the feed)
          </span>
        </Label>
        <label
          className={`flex flex-col items-center justify-center gap-3 h-28 rounded-2xl border-2 border-dashed transition-colors cursor-pointer relative overflow-hidden ${
            videoFile ? 'border-primary/60' : 'border-border hover:border-primary/40'
          }`}
        >
          <input
            type="file"
            accept="video/*,.mp4,.mov,.webm"
            className="hidden"
            onChange={handleVideoChange}
          />
          {videoPreview ? (
            <>
              <video
                src={videoPreview}
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover opacity-50"
              />
              <div className="relative flex flex-col items-center gap-1">
                <Video className="w-6 h-6 text-primary" />
                <p className="text-sm font-medium text-primary">{videoFile!.name}</p>
                <p className="text-xs text-white/70">
                  {(videoFile!.size / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <Video className="w-7 h-7" />
              <p className="text-sm font-medium">Add a video loop</p>
              <p className="text-xs">MP4, MOV, WebM — keep it under 30s</p>
            </div>
          )}
        </label>
        {videoFile && (
          <button
            type="button"
            onClick={() => { setVideoFile(null); setVideoPreview(null) }}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
          >
            <X className="w-3 h-3" /> Remove video
          </button>
        )}
      </div>

      {/* ── Error ────────────────────────────────────────────────────────── */}
      {error && (
        <div className="px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* ── Progress bar ─────────────────────────────────────────────────── */}
      {uploading && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{progressLabel}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={!audioFile || uploading}
        size="lg"
      >
        {uploading ? 'Uploading…' : 'Upload beat'}
      </Button>
    </form>
  )
}
