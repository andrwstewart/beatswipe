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
  const [tiktok, setTiktok] = useState(profile.tiktok_url ?? '')
  const [soundcloud, setSoundcloud] = useState(profile.soundcloud_url ?? '')
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

    const tiktokUrl = tiktok.trim()
      ? tiktok.trim().startsWith('http') ? tiktok.trim() : `https://tiktok.com/@${tiktok.trim().replace(/^@/, '')}`
      : null

    const soundcloudUrl = soundcloud.trim()
      ? soundcloud.trim().startsWith('http') ? soundcloud.trim() : `https://soundcloud.com/${soundcloud.trim()}`
      : null

    await supabase
      .from('profiles')
      .update({
        display_name: displayName || null,
        bio: bio || null,
        avatar_url: avatarUrl,
        instagram_url: instagramUrl,
        discord_url: discordUrl,
        tiktok_url: tiktokUrl,
        soundcloud_url: soundcloudUrl,
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
          {(profile.instagram_url || profile.discord_url || profile.tiktok_url || profile.soundcloud_url) && (
            <div className="flex flex-wrap gap-2 pt-0.5">
              {profile.instagram_url && (
                <a href={profile.instagram_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-border bg-secondary/40 hover:bg-secondary/70 transition-colors"
                  style={{ touchAction: 'manipulation' }}>
                  <InstagramIcon />
                  Instagram
                </a>
              )}
              {profile.tiktok_url && (
                <a href={profile.tiktok_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-border bg-secondary/40 hover:bg-secondary/70 transition-colors"
                  style={{ touchAction: 'manipulation' }}>
                  <TikTokIcon />
                  TikTok
                </a>
              )}
              {profile.soundcloud_url && (
                <a href={profile.soundcloud_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-border bg-secondary/40 hover:bg-secondary/70 transition-colors"
                  style={{ touchAction: 'manipulation' }}>
                  <SoundCloudIcon />
                  SoundCloud
                </a>
              )}
              {profile.discord_url && (
                <a href={profile.discord_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-border bg-secondary/40 hover:bg-secondary/70 transition-colors"
                  style={{ touchAction: 'manipulation' }}>
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
              <Label htmlFor="edit-tiktok" className="flex items-center gap-1.5">
                <TikTokIcon /> TikTok
              </Label>
              <Input
                id="edit-tiktok"
                value={tiktok}
                onChange={(e) => setTiktok(e.target.value)}
                placeholder="yourhandle or tiktok.com/@you"
                className="bg-secondary/50"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="edit-soundcloud" className="flex items-center gap-1.5">
                <SoundCloudIcon /> SoundCloud
              </Label>
              <Input
                id="edit-soundcloud"
                value={soundcloud}
                onChange={(e) => setSoundcloud(e.target.value)}
                placeholder="yourname or soundcloud.com/you"
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

function TikTokIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/>
    </svg>
  )
}

function SoundCloudIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M1.175 12.225c-.015.132-.023.264-.023.396 0 .13.008.262.023.393l-.003-.017c.002.014.003.03.003.046 0 .276-.224.5-.5.5s-.5-.224-.5-.5c0-.015.001-.03.003-.044l-.003.014c-.015-.13-.023-.263-.023-.393 0-.132.008-.264.023-.396L.175 12.6c.015.13.023.263.023.393 0 .145-.011.288-.032.428l.032-.035zm1.7-1.688c-.132-.03-.284-.047-.44-.047-.58 0-1.107.219-1.504.577l.003-.003c-.168.158-.296.357-.366.582l-.003.012c-.027.088-.042.19-.042.294 0 .132.024.258.068.374l-.002-.007c.044.116.108.216.188.3l-.001-.001c.168.176.4.286.658.286.009 0 .018 0 .027-.001h-.001c.012 0 .025.001.038.001.276 0 .5-.224.5-.5s-.224-.5-.5-.5c-.008 0-.016 0-.024.001h.001c-.03 0-.06-.005-.087-.013l.002.001c-.03-.008-.057-.02-.082-.036l.001.001c-.025-.016-.047-.036-.065-.058l-.001-.001c-.016-.021-.028-.046-.035-.073l-.001-.003c-.006-.024-.01-.051-.01-.079 0-.028.004-.055.01-.08l-.001.003c.011-.044.029-.084.054-.118l-.001.001c.036-.05.082-.09.136-.116l.002-.001c.072-.036.157-.057.247-.057.05 0 .098.006.144.018l-.004-.001c.05.013.094.033.134.058l-.002-.001c.04.025.074.056.103.092l.001.001c.03.037.054.08.069.126l.001.003c.015.045.023.096.023.15 0 .032-.003.063-.009.093l.001-.004zm4.325-3.324c-.222-.068-.477-.107-.74-.107-.38 0-.74.082-1.065.228l.015-.006c-.326.146-.607.349-.841.6l-.002.002c-.234.25-.42.543-.542.867l-.005.015c-.122.324-.193.698-.193 1.089 0 .39.07.763.197 1.107l-.007-.019c.127.344.312.638.546.886l-.002-.002c.235.249.517.453.833.597l.013.005c.316.144.686.228 1.076.228.26 0 .51-.036.746-.103l-.018.004c.236-.067.447-.166.636-.295l-.007.004c.19-.13.355-.285.494-.462l.004-.005c.14-.177.252-.38.33-.6l.005-.015c.078-.22.123-.474.123-.738 0-.39-.09-.759-.25-1.087l.007.016c-.16-.328-.39-.604-.672-.812l-.006-.004c-.283-.208-.62-.353-.983-.414l-.013-.002zm2.525-1.176c-.232-.04-.5-.063-.773-.063-.566 0-1.107.103-1.607.29l.028-.009c-.5.187-.935.46-1.302.806l-.002.002c-.367.347-.659.767-.854 1.238l-.009.024c-.195.47-.308.996-.308 1.548 0 .87.236 1.684.648 2.38l-.012-.022c.412.696.995 1.25 1.692 1.604l.022.01c.697.354 1.524.562 2.4.562.86 0 1.67-.2 2.39-.556l-.03.013c.696-.356 1.28-.91 1.698-1.58l.012-.021c.418-.67.664-1.48.664-2.346 0-.562-.102-1.1-.288-1.597l.01.03c-.186-.497-.46-.929-.806-1.292l-.002-.002c-.346-.363-.76-.654-1.222-.852l-.022-.008c-.462-.198-.99-.316-1.546-.326h-.006zm5.625.9c-.187-.025-.402-.04-.621-.04-.82 0-1.596.193-2.284.535l.03-.013c-.688.343-1.263.835-1.68 1.441l-.01.015c-.416.606-.68 1.34-.712 2.132l-.001.015c0 .04-.002.087-.002.134 0 .807.2 1.567.553 2.234l-.013-.027c.353.667.868 1.213 1.49 1.598l.018.01c.622.385 1.374.614 2.18.614.61 0 1.19-.118 1.72-.332l-.03.01c.53-.214.99-.52 1.376-.906l.002-.002c.386-.386.692-.845.902-1.356l.01-.027c.21-.512.332-1.1.332-1.718 0-.698-.152-1.36-.424-1.956l.012.03c-.273-.595-.666-1.1-1.15-1.494l-.01-.008c-.483-.393-1.066-.675-1.7-.807l-.02-.003zm4.875-1.45c-.21-.023-.453-.036-.7-.036-.867 0-1.69.186-2.434.52l.038-.015c-.743.334-1.376.81-1.87 1.406l-.01.013c-.494.596-.854 1.308-1.04 2.087l-.01.047c-.187.779-.22 1.605-.1 2.407l.008.056c.12.802.398 1.527.807 2.161l-.013-.022c.41.634.954 1.153 1.59 1.52l.022.012c.635.366 1.39.583 2.196.583.71 0 1.385-.15 1.995-.42l-.03.012c.61-.27 1.14-.654 1.574-1.13l.007-.008c.434-.476.763-1.053.952-1.692l.009-.035c.19-.638.23-1.315.118-1.972l-.007-.04c-.113-.656-.38-1.247-.763-1.745l.008.011c-.382-.497-.878-.896-1.45-1.16l-.022-.009c-.572-.264-1.238-.42-1.94-.428h-.005z"/>
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
