'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { MessageCircle, MapPin, Music2, Camera } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types'

interface ProfileHeaderProps {
  profile: Profile
  beatCount: number
  isOwnProfile: boolean
  initialFollowing: boolean
  currentUserId?: string
  totalPlays?: number
  totalLikes?: number
  totalDownloads?: number
}

export function ProfileHeader({
  profile,
  beatCount,
  isOwnProfile,
  initialFollowing,
  currentUserId,
  totalPlays,
  totalLikes,
  totalDownloads,
}: ProfileHeaderProps) {
  const router = useRouter()
  const [following, setFollowing] = useState(initialFollowing)
  const [loading, setLoading] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  // Edit form state
  const [displayName, setDisplayName] = useState(profile.display_name ?? '')
  const [bio, setBio] = useState(profile.bio ?? '')
  const [instagram, setInstagram] = useState(profile.instagram_url ?? '')
  const [discord, setDiscord] = useState(profile.discord_url ?? '')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function toggleFollow() {
    if (!currentUserId || loading) return
    setLoading(true)
    const supabase = createClient()

    if (following) {
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', profile.id)
    } else {
      await supabase
        .from('follows')
        .insert({ follower_id: currentUserId, following_id: profile.id })
    }

    setFollowing(!following)
    setLoading(false)
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  async function saveProfile() {
    if (!currentUserId || saving) return
    setSaving(true)
    const supabase = createClient()

    let avatarUrl = profile.avatar_url

    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop()
      const path = `${currentUserId}/avatar.${ext}`
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(path, avatarFile, { upsert: true })
      if (data && !error) {
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
        avatarUrl = urlData.publicUrl
      }
    }

    const instagramUrl = instagram.trim()
      ? instagram.trim().startsWith('http') ? instagram.trim() : `https://instagram.com/${instagram.trim().replace(/^@/, '')}`
      : null

    const discordUrl = discord.trim()
      ? discord.trim().startsWith('http') ? discord.trim() : `https://discord.gg/${discord.trim()}`
      : null

    await supabase
      .from('profiles')
      .update({
        display_name: displayName || null,
        bio: bio || null,
        avatar_url: avatarUrl,
        instagram_url: instagramUrl,
        discord_url: discordUrl,
      })
      .eq('id', currentUserId)

    setSaving(false)
    setEditOpen(false)
    router.refresh()
  }

  const displayNameVal = profile.display_name ?? profile.username
  const roleBadge =
    profile.role === 'producer' ? 'Producer' : profile.role === 'both' ? 'Artist & Producer' : 'Artist'

  return (
    <div className="relative">
      {/* Banner */}
      <div className="h-40 w-full bg-gradient-to-br from-primary/20 via-zinc-900 to-zinc-900 relative overflow-hidden">
        {profile.banner_url && (
          <Image src={profile.banner_url} alt="Banner" fill className="object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />
      </div>

      {/* Avatar + info */}
      <div className="px-4 pb-4 relative">
        <div className="flex items-end justify-between -mt-12 mb-3">
          <Avatar className="w-24 h-24 border-2 border-background ring-2 ring-primary/40">
            <AvatarImage src={avatarPreview ?? profile.avatar_url ?? undefined} />
            <AvatarFallback className="bg-primary/20 text-primary text-3xl font-bold">
              {displayNameVal[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {isOwnProfile ? (
            <Button
              variant="outline"
              size="sm"
              className="mb-2 border-border"
              onClick={() => setEditOpen(true)}
            >
              Edit profile
            </Button>
          ) : currentUserId ? (
            <div className="flex gap-2 pb-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-border"
                onClick={toggleFollow}
                disabled={loading}
              >
                {following ? 'Following' : 'Follow'}
              </Button>
              <a
                href={`/messages/new?producer=${profile.username}`}
                className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5')}
              >
                <MessageCircle className="w-4 h-4" />
                Message
              </a>
            </div>
          ) : null}
        </div>

        <div className="space-y-2">
          <div>
            <h1 className="text-xl font-bold">{displayNameVal}</h1>
            <p className="text-muted-foreground text-sm">@{profile.username}</p>
          </div>

          <Badge variant="secondary" className="text-xs">{roleBadge}</Badge>

          {profile.bio && (
            <p className="text-sm text-foreground/80 leading-relaxed">{profile.bio}</p>
          )}

          {profile.location && (
            <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
              <MapPin className="w-3.5 h-3.5" />
              {profile.location}
            </div>
          )}

          {/* Social links */}
          {(profile.instagram_url || profile.discord_url) && (
            <div className="flex flex-wrap gap-2 pt-0.5">
              {profile.instagram_url && (
                <a
                  href={profile.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-border bg-secondary/40 hover:bg-secondary/70 transition-colors"
                  style={{ touchAction: 'manipulation' }}
                >
                  <InstagramIcon />
                  Instagram
                </a>
              )}
              {profile.discord_url && (
                <a
                  href={profile.discord_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-border bg-secondary/40 hover:bg-secondary/70 transition-colors"
                  style={{ touchAction: 'manipulation' }}
                >
                  <DiscordIcon />
                  Discord
                </a>
              )}
            </div>
          )}

          {profile.placements && profile.placements.length > 0 && (
            <div className="flex items-center gap-1.5 text-sm">
              <Music2 className="w-3.5 h-3.5 text-primary" />
              <span className="text-muted-foreground">Placed on:</span>
              <span className="text-foreground font-medium">{profile.placements.join(', ')}</span>
            </div>
          )}

          {/* Stats row */}
          <div className="flex gap-6 pt-1">
            <div className="text-center">
              <p className="font-bold text-lg">{beatCount}</p>
              <p className="text-xs text-muted-foreground">Beats</p>
            </div>
            {isOwnProfile && totalPlays !== undefined && (
              <>
                <div className="text-center">
                  <p className="font-bold text-lg">{fmtCount(totalPlays)}</p>
                  <p className="text-xs text-muted-foreground">Plays</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg">{fmtCount(totalLikes ?? 0)}</p>
                  <p className="text-xs text-muted-foreground">Likes</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg">{fmtCount(totalDownloads ?? 0)}</p>
                  <p className="text-xs text-muted-foreground">DLs</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Edit profile dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-card border-border max-w-sm mx-auto rounded-2xl p-6">
          <h2 className="text-base font-bold mb-4">Edit profile</h2>

          {/* Avatar upload */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              <Avatar className="w-16 h-16 border border-border">
                <AvatarImage src={avatarPreview ?? profile.avatar_url ?? undefined} />
                <AvatarFallback className="bg-primary/20 text-primary text-xl font-bold">
                  {displayNameVal[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <label className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center cursor-pointer">
                <Camera className="w-3 h-3 text-black" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </label>
            </div>
            <p className="text-sm text-muted-foreground">Tap the camera to change your photo</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="edit-name">Display name</Label>
              <Input
                id="edit-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={profile.username}
                className="bg-secondary/50"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="edit-bio">Bio</Label>
              <Textarea
                id="edit-bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell people about yourself…"
                className="bg-secondary/50 resize-none"
                rows={3}
                maxLength={200}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="edit-instagram" className="flex items-center gap-1.5">
                <InstagramIcon /> Instagram
              </Label>
              <Input
                id="edit-instagram"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="yourhandle or instagram.com/you"
                className="bg-secondary/50"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="edit-discord" className="flex items-center gap-1.5">
                <DiscordIcon /> Discord
              </Label>
              <Input
                id="edit-discord"
                value={discord}
                onChange={(e) => setDiscord(e.target.value)}
                placeholder="discord.gg/invite or username"
                className="bg-secondary/50"
              />
            </div>

            <Button className="w-full" onClick={saveProfile} disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function fmtCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

function InstagramIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  )
}

function DiscordIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.102 18.081.114 18.104.13 18.12a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
    </svg>
  )
}
