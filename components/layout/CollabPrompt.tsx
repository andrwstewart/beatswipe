'use client'

import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { MessageCircle, X } from 'lucide-react'
import Link from 'next/link'

interface CollabPromptProps {
  open: boolean
  onClose: () => void
  producerUsername: string
  producerName: string
  beatTitle: string
}

const QUICK_TEMPLATES = [
  "I love this beat! I have lyrics in mind — are you open to collab?",
  "This hit different 🔥 Would love to hop on this. DM me?",
  "The vibe on this is exactly what I need. Can we work?",
]

export function CollabPrompt({
  open,
  onClose,
  producerUsername,
  producerName,
  beatTitle,
}: CollabPromptProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-card border-border max-w-sm mx-auto rounded-2xl p-0 overflow-hidden">
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 bg-gradient-to-b from-primary/10 to-transparent">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-xl">
              <MessageCircle className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">You vibed with</p>
              <p className="font-semibold text-sm">
                &quot;{beatTitle}&quot; by {producerName}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Message {producerName} with your vision — great collabs start with one message.
          </p>

          {/* Quick templates */}
          <div className="space-y-2">
            {QUICK_TEMPLATES.map((t, i) => (
              <Link
                key={i}
                href={`/messages/new?producer=${producerUsername}&message=${encodeURIComponent(t)}`}
                onClick={onClose}
                className="block text-left text-sm px-3 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground/90 border border-border transition-colors"
              >
                &quot;{t}&quot;
              </Link>
            ))}
          </div>

          <div className="flex gap-2 pt-1">
            <Link
              href={`/messages/new?producer=${producerUsername}`}
              onClick={onClose}
              className={cn(buttonVariants(), 'flex-1 gap-2 justify-center')}
            >
              <MessageCircle className="w-4 h-4" />
              Custom message
            </Link>
            <Button variant="ghost" onClick={onClose} className="px-4 text-muted-foreground">
              Skip
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
