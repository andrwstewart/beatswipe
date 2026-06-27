'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Home, Search, MessageCircle, User, Plus } from 'lucide-react'
import { useUnreadCount } from '@/hooks/useUnreadCount'

export function BottomNav({ username, userId }: { username?: string; userId?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const unreadCount = useUnreadCount(userId)

  const isActive = (path: string) => pathname.startsWith(path)
  const formattedCount = unreadCount > 99 ? '99+' : unreadCount > 0 ? String(unreadCount) : null

  // Prefetch all routes so tapping is instant
  useEffect(() => {
    router.prefetch('/feed')
    router.prefetch('/discover')
    router.prefetch('/upload')
    router.prefetch('/messages')
    if (username) router.prefetch(`/profile/${username}`)
  }, [username, router])

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-black/90 backdrop-blur-xl border-t border-white/10 pb-safe">
      <div className="flex items-center justify-around px-2 h-14 max-w-lg mx-auto">

        <NavItem href="/feed" active={isActive('/feed')} icon={<Home className="w-6 h-6" />} label="Home" />
        <NavItem href="/discover" active={isActive('/discover')} icon={<Search className="w-6 h-6" />} label="Discover" />

        {/* Upload — center button */}
        <Link
          href="/upload"
          className="relative flex items-center justify-center -mt-1 select-none active:scale-90 transition-transform duration-75"
          style={{ touchAction: 'manipulation' }}
        >
          <div className="w-11 h-11 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center">
            <Plus className="w-5 h-5 text-primary" />
          </div>
        </Link>

        {/* Messages */}
        <NavItem
          href="/messages"
          active={isActive('/messages')}
          icon={
            <div className="relative">
              <MessageCircle className="w-6 h-6" />
              {formattedCount && (
                <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                  {formattedCount}
                </span>
              )}
            </div>
          }
          label="Inbox"
        />

        <NavItem
          href={username ? `/profile/${username}` : '/login'}
          active={isActive('/profile')}
          icon={<User className="w-6 h-6" />}
          label="Me"
        />

      </div>
    </nav>
  )
}

function NavItem({
  href,
  active,
  icon,
  label,
}: {
  href: string
  active: boolean
  icon: React.ReactNode
  label: string
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-0.5 px-3 py-1 min-w-[52px] text-white/60 transition-all duration-75 select-none active:scale-90 active:opacity-50"
      style={{ touchAction: 'manipulation' }}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
      {active && <span className="w-1 h-1 rounded-full bg-white/60 mt-0.5" />}
    </Link>
  )
}
