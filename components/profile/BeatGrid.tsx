'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Heart, Download, Music2, Play, Pause, MoreHorizontal, Trash2 } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { WaveformPlayer } from '@/components/audio/WaveformPlayer'
import { PaywallModal } from '@/components/feed/PaywallModal'
import { useAudio } from '@/hooks/useAudio'
import { useInteraction } from '@/hooks/useInteraction'
import { createClient } from '@/lib/supabase/client'
import type { Beat } from '@/types'

interface BeatGridProps {
  beats: Beat[]
  userId?: string
}

export function BeatGrid({ beats, userId }: BeatGridProps) {
  const [selected, setSelected] = useState<Beat | null>(null)

  if (beats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
        <div className="text-4xl">🎹</div>
        <p className="text-muted-foreground text-sm">No beats uploaded yet.</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-px bg-border">
        {beats.map((beat) => (
          <BeatTile key={beat.id} beat={beat} onSelect={setSelected} />
        ))}
      </div>

      {selected && (
        <BeatDetailModal
          beat={selected}
          userId={userId}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}

function BeatTile({ beat, onSelect }: { beat: Beat; onSelect: (b: Beat) => void }) {
  return (
    <button
      className="relative aspect-square bg-card overflow-hidden group w-full"
      onClick={() => onSelect(beat)}
    >
      {beat.cover_url ? (
        <Image
          src={beat.cover_url}
          alt={beat.title}
          fill
          className="object-cover group-active:scale-95 transition-transform duration-150"
          sizes="33vw"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
          <div className="text-2xl">🎵</div>
        </div>
      )}

      <div className="absolute inset-0 bg-black/0 group-active:bg-black/30 transition-colors" />

      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-1.5 py-1">
        <div className="flex items-center gap-1.5 text-white/70 text-[10px]">
          <Heart className="w-2.5 h-2.5" />
          <span>{beat.likes_count}</span>
        </div>
      </div>
    </button>
  )
}

function BeatDetailModal({
  beat,
  userId,
  onClose,
}: {
  beat: Beat
  userId?: string
  onClose: () => void
}) {
  const router = useRouter()
  const { play, pause, isPlaying } = useAudio()
  const playing = isPlaying(beat.id)
  const producerName = beat.producer?.display_name ?? beat.producer?.username ?? 'Unknown'
  const isOwnBeat = !!userId && userId === beat.producer_id

  const [paywallOpen, setPaywallOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const interaction = useInteraction({
    beatId: beat.id,
    userId: userId ?? '',
    producerId: beat.producer_id,
  })

  const isPaid = !!(beat.price_cents && beat.price_cents > 0)

  function handleClose() {
    pause()
    onClose()
  }

  function togglePlay() {
    if (playing) pause()
    else play(beat.id)
  }

  function handleDownloadClick() {
    if (isPaid && !interaction.downloaded) {
      setPaywallOpen(true)
    } else {
      interaction.download(beat.audio_url!, beat.title)
    }
  }

  async function handleDelete() {
    if (!isOwnBeat || deleting) return
    setDeleting(true)
    const supabase = createClient()
    await supabase.from('beats').delete().eq('id', beat.id)
    handleClose()
    router.refresh()
  }

  return (
    <>
      <Dialog open onOpenChange={(open) => { if (!open) handleClose() }}>
        <DialogContent
          showCloseButton={false}
          className="bg-card border-border p-0 max-w-sm mx-auto overflow-hidden rounded-2xl"
        >
          {/* Cover */}
          <div className="relative w-full aspect-square bg-zinc-900">
            {beat.cover_url ? (
              <Image src={beat.cover_url} alt={beat.title} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music2 className="w-16 h-16 text-white/20" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />

            <button
              onClick={handleClose}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white font-bold text-lg leading-none"
            >
              ×
            </button>

            <button
              onClick={togglePlay}
              className="absolute bottom-4 right-4 w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg"
            >
              {playing
                ? <Pause className="w-5 h-5 text-black fill-black" />
                : <Play className="w-5 h-5 text-black fill-black ml-0.5" />}
            </button>
          </div>

          {/* Info */}
          <div className="px-4 py-3 space-y-2">
            <div>
              <p className="font-bold text-base">{beat.title}</p>
              <p className="text-muted-foreground text-sm">@{beat.producer?.username ?? 'unknown'} · {producerName}</p>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5">
              {beat.bpm && (
                <span className="text-xs font-mono bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">
                  {beat.bpm} BPM
                </span>
              )}
              {beat.key && (
                <span className="text-xs font-mono bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">
                  {beat.key}
                </span>
              )}
              {beat.genre?.slice(0, 2).map((g) => (
                <span key={g} className="text-xs bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">
                  #{g}
                </span>
              ))}
            </div>

            {/* Waveform */}
            {beat.audio_url && (
              <WaveformPlayer
                beatId={beat.id}
                audioUrl={beat.audio_url}
                isActive={playing}
                durationSeconds={beat.duration_seconds}
                onFinish={pause}
              />
            )}

            {/* Stats + Download + 3-dot */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5" /> {beat.likes_count}
                </span>
                <span className="flex items-center gap-1">
                  <Download className="w-3.5 h-3.5" /> {beat.downloads_count}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* 3-dot menu — own beats only */}
                {isOwnBeat && (
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen((v) => !v)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>

                    {menuOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                        <div className="absolute bottom-10 right-0 z-20 bg-card border border-border rounded-xl shadow-xl overflow-hidden min-w-[140px]">
                          <button
                            onClick={handleDelete}
                            disabled={deleting}
                            className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            {deleting ? 'Deleting…' : 'Delete post'}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Download / Buy button */}
                {userId && beat.audio_url && (
                  <button
                    onClick={handleDownloadClick}
                    disabled={interaction.downloaded || interaction.loading}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      interaction.downloaded
                        ? 'bg-primary/20 text-primary'
                        : 'bg-primary text-black'
                    }`}
                  >
                    <Download className="w-4 h-4" />
                    {interaction.downloaded
                      ? 'Downloaded'
                      : isPaid
                        ? `$${((beat.price_cents ?? 0) / 100).toFixed(2)}`
                        : 'Download'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {paywallOpen && userId && (
        <PaywallModal
          beat={beat}
          userId={userId}
          onClose={() => setPaywallOpen(false)}
          onFreeDownload={() => interaction.download(beat.audio_url!, beat.title)}
        />
      )}
    </>
  )
}
