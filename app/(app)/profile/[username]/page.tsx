import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { ProfileTabs } from '@/components/profile/ProfileTabs'
import type { Beat, Profile } from '@/types'

interface Props {
  params: Promise<{ username: string }>
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (!profile) notFound()

  const isOwnProfile = user?.id === profile.id

  const [{ data: beats }, { data: followRow }, { data: likedRows }] = await Promise.all([
    supabase
      .from('beats')
      .select('*, producer:profiles(*)')
      .eq('producer_id', profile.id)
      .order('created_at', { ascending: false }),
    user
      ? supabase
          .from('follows')
          .select('follower_id')
          .eq('follower_id', user.id)
          .eq('following_id', profile.id)
          .single()
      : Promise.resolve({ data: null }),
    // Fetch liked beats only for own profile
    isOwnProfile && user
      ? supabase
          .from('interactions')
          .select('beats(*, producer:profiles(*))')
          .eq('user_id', user.id)
          .eq('type', 'like')
          .order('created_at', { ascending: false })
          .limit(100)
      : Promise.resolve({ data: [] }),
  ])

  const likedBeats = (likedRows ?? [])
    .map((r: Record<string, unknown>) => r.beats)
    .filter(Boolean) as Beat[]

  // Analytics — only needed on own profile
  let totalPlays: number | undefined
  let totalLikes: number | undefined
  let totalDownloads: number | undefined

  if (isOwnProfile && beats) {
    totalPlays = beats.reduce((s, b) => s + (b.plays ?? 0), 0)
    totalLikes = beats.reduce((s, b) => s + (b.likes_count ?? 0), 0)
    totalDownloads = beats.reduce((s, b) => s + (b.downloads_count ?? 0), 0)
  }

  return (
    <div className="min-h-dvh pb-20">
      <ProfileHeader
        profile={profile as Profile}
        beatCount={beats?.length ?? 0}
        isOwnProfile={isOwnProfile}
        initialFollowing={!!followRow}
        currentUserId={user?.id}
        totalPlays={totalPlays}
        totalLikes={totalLikes}
        totalDownloads={totalDownloads}
      />
      <div className="mt-1">
        <ProfileTabs
          myBeats={(beats as Beat[]) ?? []}
          likedBeats={likedBeats}
          userId={user?.id}
          isOwnProfile={isOwnProfile}
        />
      </div>
    </div>
  )
}
