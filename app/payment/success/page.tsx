'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Download, ArrowLeft, Music2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import type { Beat } from '@/types'

function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const beatId = searchParams.get('beat_id')
  const [beat, setBeat] = useState<Beat | null>(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (!beatId) return
    const supabase = createClient()
    supabase
      .from('beats')
      .select('*, producer:profiles(username, display_name)')
      .eq('id', beatId)
      .single()
      .then(({ data }) => setBeat(data as Beat))
  }, [beatId])

  async function handleDownload() {
    if (!beat?.audio_url) return
    setDownloading(true)
    try {
      const response = await fetch(beat.audio_url)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${beat.title}.mp3`
      document.body.appendChild(a)
      a.click()
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url) }, 150)
    } catch {
      window.open(beat.audio_url, '_blank')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-8 text-center">

        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-primary" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Payment successful</h1>
          <p className="text-muted-foreground">
            {beat
              ? <>You now own <span className="text-foreground font-semibold">{beat.title}</span></>
              : 'Your beat is ready to download.'}
          </p>
          {beat?.producer && (
            <p className="text-sm text-muted-foreground">
              by {(beat.producer as { display_name: string | null; username: string }).display_name
                ?? (beat.producer as { username: string }).username}
            </p>
          )}
        </div>

        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center">
            <Music2 className="w-8 h-8 text-muted-foreground" />
          </div>
        </div>

        <div className="space-y-3">
          <Button
            className="w-full gap-2"
            size="lg"
            onClick={handleDownload}
            disabled={!beat || downloading}
          >
            <Download className="w-4 h-4" />
            {downloading ? 'Downloading…' : 'Download Beat'}
          </Button>

          <Link href="/feed">
            <Button variant="ghost" className="w-full gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Feed
            </Button>
          </Link>
        </div>

      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense>
      <PaymentSuccessContent />
    </Suspense>
  )
}
