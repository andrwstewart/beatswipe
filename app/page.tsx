import Link from 'next/link'
import { BeatSwipeLogo } from '@/components/ui/BeatSwipeLogo'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-background flex flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center text-center gap-8 w-full max-w-xs">
        {/* Logo mark */}
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/30 flex items-center justify-center neon-glow mx-auto">
            <BeatSwipeLogo size={40} className="text-primary" />
          </div>
          <div className="absolute -inset-4 rounded-3xl bg-primary/5 blur-xl -z-10" />
        </div>

        <h1 className="text-5xl font-extrabold tracking-tight leading-none">
          <span className="neon-text">Beat</span>
          <span className="text-foreground">Swipe</span>
        </h1>

        <p className="text-xl text-muted-foreground leading-relaxed">
          Swipe through beats like TikTok. Discover, download, and collab with producers.
        </p>

        <div className="flex flex-col gap-3 w-full">
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
      </div>
    </div>
  )
}
