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

    await supabase
      .from('profiles')
      .update({
        display_name: displayName || null,
        bio: bio || null,
        avatar_url: avatarUrl,
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
