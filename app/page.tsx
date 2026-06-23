import Link from 'next/link'
import { Music2, Zap, MessageCircle, Download } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-background flex flex-col">
      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 pb-12 pt-20">
        {/* Logo mark */}
        <div className="relative mb-8">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/30 flex items-center justify-center neon-glow mx-auto">
            <Music2 className="w-10 h-10 text-primary" />
          </div>
          <div className="absolute -inset-4 rounded-3xl bg-primary/5 blur-xl -z-10" />
        </div>

        <h1 className="text-5xl font-extrabold tracking-tight leading-none mb-4">
          <span className="neon-text">Beat</span>
          <span className="text-foreground">Swipe</span>
        </h1>

        <p className="text-xl text-muted-foreground max-w-xs leading-relaxed mb-8">
          Swipe through beats like TikTok. Discover, download, and collab with producers.
        </p>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Link
            href="/signup"
            className={cn(
              buttonVariants({ size: 'lg' }),
              'w-full text-base font-semibold h-14 rounded-2xl neon-glow justify-center'
            )}
          >
            Get started free
          </Link>
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: 'outline', size: 'lg' }),
              'w-full text-base h-14 rounded-2xl justify-center'
            )}
          >
            Sign in
          </Link>
        </div>
      </main>

      {/* Features */}
      <section className="px-6 pb-16 max-w-sm mx-auto w-full">
        <div className="space-y-4">
          <FeatureRow
            icon={<Zap className="w-5 h-5 text-yellow-400" />}
            title="Infinite swipe feed"
            desc="Swipe through beats like TikTok — addictive, fast, and personalised to your taste."
          />
          <FeatureRow
            icon={<Music2 className="w-5 h-5 text-primary" />}
            title="Live waveform preview"
            desc="Every beat auto-plays with an animated waveform. Your next favourite is one swipe away."
          />
          <FeatureRow
            icon={<Download className="w-5 h-5 text-blue-400" />}
            title="One-tap download"
            desc="Download WAV or MP3 instantly. Free beats ready to record over."
          />
          <FeatureRow
            icon={<MessageCircle className="w-5 h-5 text-rose-400" />}
            title="Direct collab"
            desc="Message producers directly. Share stems, lyrics, and ideas in the app."
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center pb-8 text-xs text-muted-foreground">
        Built for Gen Z creators. No cap.
      </footer>
    </div>
  )
}

function FeatureRow({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode
  title: string
  desc: string
}) {
  return (
    <div className="flex gap-4 items-start">
      <div className="w-10 h-10 rounded-xl bg-secondary/60 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}
