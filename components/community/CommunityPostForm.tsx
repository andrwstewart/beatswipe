'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

export function CommunityPostForm({ userId }: { userId: string }) {
  const [content, setContent] = useState('')
  const [posting, setPosting] = useState(false)
  const [done, setDone] = useState(false)

  async function handlePost() {
    const text = content.trim()
    if (!text || posting) return
    setPosting(true)

    const supabase = createClient()
    await supabase.from('community_posts').insert({ user_id: userId, content: text })

    setContent('')
    setPosting(false)
    setDone(true)
    setTimeout(() => setDone(false), 3000)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          Ask a question, start a conversation, or shout out a vibe. Your post will appear in the Community feed on the inbox page.
        </p>
      </div>

      <Textarea
        value={content}
        onChange={(e) => { setContent(e.target.value); setDone(false) }}
        placeholder={'e.g. "Does anyone have dark phonk beats around 140 BPM?"'}
        className="bg-secondary/50 resize-none"
        rows={5}
        maxLength={500}
      />

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{content.length}/500</span>
        {done && <span className="text-xs text-primary">Posted!</span>}
      </div>

      <Button
        className="w-full"
        onClick={handlePost}
        disabled={!content.trim() || posting}
      >
        {posting ? 'Posting…' : 'Post to Community'}
      </Button>
    </div>
  )
}
