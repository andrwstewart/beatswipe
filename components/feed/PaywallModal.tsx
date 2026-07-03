'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, Lock, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import type { Beat } from '@/types'

interface PaywallModalProps {
  beat: Beat
  userId: string
  onClose: () => void
  onFreeDownload: () => void // called if they've already purchased
}

type State = 'checking' | 'purchase' | 'paying' | 'error'

export function PaywallModal({ beat, userId, onClose, onFreeDownload }: PaywallModalProps) {
  const [state, setState] = useState<State>('checking')
  const [errorMsg, setErrorMsg] = useState('')

  const priceDollars = ((beat.price_cents ?? 0) / 100).toFixed(2)
  const producerShare = (((beat.price_cents ?? 0) * 0.75) / 100).toFixed(2)

  useEffect(() => {
    async function checkPurchase() {
      const supabase = createClient()
      const { data } = await supabase
        .from('purchases')
        .select('id')
        .eq('beat_id', beat.id)
        .eq('buyer_id', userId)
        .eq('status', 'completed')
        .maybeSingle()

      if (data) {
        // Already purchased — trigger download and close
        onFreeDownload()
        onClose()
      } else {
        setState('purchase')
      }
    }
    checkPurchase()
  }, [beat.id, userId, onFreeDownload, onClose])

  async function handleBuy() {
    setState('paying')
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ beatId: beat.id }),
      })
      const data = await res.json()

      if (data.alreadyPurchased) {
        onFreeDownload()
        onClose()
        return
      }

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error ?? 'Unknown error')
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Payment failed. Try again.')
      setState('error')
    }
  }

  const producerName = beat.producer?.display_name ?? beat.producer?.username ?? 'the producer'

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

        {/* Sheet */}
        <motion.div
          className="relative w-full max-w-lg bg-[oklch(0.14_0.002_240)] rounded-3xl border border-white/8 p-6 pb-8 space-y-5"
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight">{beat.title}</h2>
              <p className="text-sm text-muted-foreground">by {producerName}</p>
            </div>
          </div>

          {state === 'checking' && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {(state === 'purchase' || state === 'paying') && (
            <>
              {/* Price breakdown */}
              <div className="bg-secondary/40 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Beat price</span>
                  <span className="font-semibold">${priceDollars}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Goes to {producerName}</span>
                  <span className="text-primary font-semibold">${producerShare}</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between text-xs text-muted-foreground">
                  <span>BeatSwipe platform fee</span>
                  <span>25%</span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                One-time purchase · Full untagged download · Yours forever
              </p>

              <Button
                className="w-full gap-2"
                size="lg"
                onClick={handleBuy}
                disabled={state === 'paying'}
              >
                {state === 'paying' ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting…</>
                ) : (
                  <><Download className="w-4 h-4" /> Buy for ${priceDollars}</>
                )}
              </Button>
            </>
          )}

          {state === 'error' && (
            <div className="space-y-4">
              <p className="text-sm text-destructive text-center">{errorMsg}</p>
              <Button variant="outline" className="w-full" onClick={() => setState('purchase')}>
                Try again
              </Button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
