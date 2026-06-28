'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from '@/lib/utils'

interface PostProfile {
  username: string
  display_name: string | null
  avatar_url: string | null
}

interface CommunityPost {
  id: string
  user_id: string
  content: string
  created_at: string
  profiles: PostProfile
  reply_count?: number
}

interface CommunityReply {
  id: string
  user_id: string
  content: string
  created_at: string
  profiles: PostProfile
}

interface Props {
  initialPosts: CommunityPost[]
  currentUserId?: string
}

export function CommunityCarousel({ initialPosts, currentUserId }: Props) {
  const router = useRouter()
  const [posts, setPosts] = useState<CommunityPost[]>(initialPosts)
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<CommunityPost | null>(null)
  const [replies, setReplies] = useState<CommunityReply[]>([])
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const advance = useCallback(() => {
    setCurrent((c) => (c + 1) % Math.max(posts.length, 1))
  }, [posts.length])

  const prev = () => setCurrent((c) => (c - 1 + posts.length) % posts.length)
  const next = () => { advance() }

  // Auto-rotate every 5s
  useEffect(() => {
    if (posts.length <= 1 || selected) return
    timerRef.current = setInterval(advance, 5000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [posts.length, selected, advance])

  // Realtime: new posts
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('community-posts-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_posts' }, async () => {
        const { data } = await supabase
          .from('community_posts')
          .select('*, profiles(username, display_name, avatar_url)')
          .order('created_at', { ascending: false })
          .limit(20)
        if (data) setPosts(data as CommunityPost[])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  async function openPost(post: CommunityPost) {
    setSelected(post)
    const supabase = createClient()
    const { data } = await supabase
      .from('community_replies')
      .select('*, profiles(username, display_name, avatar_url)')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true })
    setReplies((data as CommunityReply[]) ?? [])
  }

  async function sendReply() {
    if (!replyText.trim() || !selected || !currentUserId || sending) return
    setSending(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('community_replies')
      .insert({ post_id: selected.id, user_id: currentUserId, content: replyText.trim() })
      .select('*, profiles(username, display_name, avatar_url)')
      .single()
    if (data) setReplies((r) => [...r, data as CommunityReply])
    setReplyText('')
    setSending(false)
  }

  if (posts.length === 0) return null

  const post = posts[current]

  return (
    <>
      {/* Carousel strip */}
      <div className="border-b border-border px-4 pt-3 pb-3 bg-secondary/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-primary tracking-wide uppercase">Community</span>
          {posts.length > 1 && (
            <div className="flex items-center gap-1">
              <button onClick={prev} className="p-0.5 text-muted-foreground hover:text-foreground transition-colors" style={{ touchAction: 'manipulation' }}>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex gap-1">
                {posts.slice(0, Math.min(posts.length, 5)).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${i === current % Math.min(posts.length, 5) ? 'bg-primary' : 'bg-white/20'}`}
                    style={{ touchAction: 'manipulation' }}
                  />
                ))}
              </div>
              <button onClick={next} className="p-0.5 text-muted-foreground hover:text-foreground transition-colors" style={{ touchAction: 'manipulation' }}>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <button
          className="w-full text-left"
          onClick={() => openPost(post)}
          style={{ touchAction: 'manipulation' }}
        >
          <div className="flex gap-3 items-start">
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarImage src={post.profiles?.avatar_url ?? undefined} />
              <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                {(post.profiles?.display_name ?? post.profiles?.username ?? '?')[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="text-xs font-semibold">{post.profiles?.display_name ?? post.profiles?.username}</span>
                <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(post.created_at))}</span>
              </div>
              <p className="text-sm text-foreground/85 leading-snug line-clamp-2 mt-0.5">{post.content}</p>
            </div>
          </div>
        </button>
      </div>

      {/* Expanded post modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border" style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top, 0px))' }}>
            <button
              onClick={() => { setSelected(null); setReplyText('') }}
              className="text-muted-foreground hover:text-foreground transition-colors"
              style={{ touchAction: 'manipulation' }}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="font-semibold text-sm">Community Post</span>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto">
            {/* Post body */}
            <div className="px-4 py-4 border-b border-border">
              <div className="flex gap-3 items-start">
                <button
                  onClick={() => router.push(`/profile/${selected.profiles?.username}`)}
                  style={{ touchAction: 'manipulation' }}
                >
                  <Avatar className="w-11 h-11 flex-shrink-0">
                    <AvatarImage src={selected.profiles?.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-primary/20 text-primary font-bold">
                      {(selected.profiles?.display_name ?? selected.profiles?.username ?? '?')[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </button>
                <div className="flex-1">
                  <button
                    onClick={() => router.push(`/profile/${selected.profiles?.username}`)}
                    className="text-left"
                    style={{ touchAction: 'manipulation' }}
                  >
                    <p className="font-semibold text-sm">{selected.profiles?.display_name ?? selected.profiles?.username}</p>
                    <p className="text-xs text-muted-foreground">@{selected.profiles?.username} · {formatDistanceToNow(new Date(selected.created_at))}</p>
                  </button>
                  <p className="text-sm leading-relaxed mt-2">{selected.content}</p>
                </div>
              </div>
            </div>

            {/* Replies */}
            <div className="px-4 py-3">
              <div className="flex items-center gap-1.5 mb-3">
                <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-medium">{replies.length} {replies.length === 1 ? 'reply' : 'replies'}</span>
              </div>
              <div className="space-y-4">
                {replies.map((reply) => (
                  <div key={reply.id} className="flex gap-3 items-start">
                    <button
                      onClick={() => router.push(`/profile/${reply.profiles?.username}`)}
                      style={{ touchAction: 'manipulation' }}
                    >
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarImage src={reply.profiles?.avatar_url ?? undefined} />
                        <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                          {(reply.profiles?.display_name ?? reply.profiles?.username ?? '?')[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                    <div className="flex-1 bg-secondary/30 rounded-2xl px-3 py-2">
                      <div className="flex items-baseline gap-1.5 mb-0.5">
                        <span className="text-xs font-semibold">{reply.profiles?.display_name ?? reply.profiles?.username}</span>
                        <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(reply.created_at))}</span>
                      </div>
                      <p className="text-sm leading-snug">{reply.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Reply input */}
          {currentUserId ? (
            <div className="px-4 pt-2 pb-3 border-t border-border bg-background flex gap-2 items-end">
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply…"
                className="flex-1 bg-secondary/50 resize-none text-sm min-h-[40px] max-h-28 py-2.5"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply() }
                }}
              />
              <Button
                size="sm"
                onClick={sendReply}
                disabled={!replyText.trim() || sending}
                className="flex-shrink-0 h-10"
              >
                {sending ? '…' : 'Reply'}
              </Button>
            </div>
          ) : (
            <div className="px-4 py-3 border-t border-border text-center text-sm text-muted-foreground">
              <a href="/login" className="text-primary hover:underline">Sign in</a> to reply
            </div>
          )}
        </div>
      )}
    </>
  )
}
