'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageBubble } from './MessageBubble'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, Paperclip, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import type { Message, Profile } from '@/types'

interface ChatWindowProps {
  conversationId: string
  currentUserId: string
  otherUser: Profile
  initialMessages: Message[]
}

export function ChatWindow({
  conversationId,
  currentUserId,
  otherUser,
  initialMessages,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Mark all unread messages in this conversation as read, then fire a
  // custom event so the badge count in BottomNav updates instantly.
  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .neq('sender_id', currentUserId)
      .is('read_at', null)
      .then(() => {
        window.dispatchEvent(new CustomEvent('messages-read', { detail: { conversationId } }))
      })
  }, [conversationId, currentUserId])

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message
          setMessages((prev) => {
            if (prev.find((m) => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
          // If the incoming message is from the other user, mark it read immediately
          if (newMsg.sender_id !== currentUserId) {
            supabase
              .from('messages')
              .update({ read_at: new Date().toISOString() })
              .eq('id', newMsg.id)
              .then(() => {
                window.dispatchEvent(new CustomEvent('messages-read', { detail: { conversationId } }))
              })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, currentUserId])

  async function sendMessage() {
    if (!text.trim() || sending) return
    setSending(true)

    const content = text.trim()
    setText('')

    const supabase = createClient()
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: currentUserId,
      content,
    })

    setSending(false)
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `${conversationId}/${Date.now()}.${ext}`

    const { data: uploadData, error } = await supabase.storage
      .from('message-files')
      .upload(path, file)

    if (error || !uploadData) return

    const { data: urlData } = supabase.storage.from('message-files').getPublicUrl(path)

    const isAudio = file.type.startsWith('audio/')
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: currentUserId,
      audio_url: isAudio ? urlData.publicUrl : null,
      file_url: !isAudio ? urlData.publicUrl : null,
      content: isAudio ? null : `📎 ${file.name}`,
    })
  }

  const displayName = otherUser.display_name ?? otherUser.username

  return (
    <div className="flex flex-col bg-background" style={{ height: 'calc(100dvh - 3.5rem - env(safe-area-inset-bottom, 0px))' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pb-3 border-b border-border bg-card/50 backdrop-blur-sm" style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top, 0px))' }}>
        <Link href="/messages" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <Avatar className="w-9 h-9">
          <AvatarImage src={otherUser.avatar_url ?? undefined} />
          <AvatarFallback className="bg-primary/20 text-primary text-sm font-bold">
            {displayName[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{displayName}</p>
          <p className="text-xs text-muted-foreground">@{otherUser.username}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground text-sm">
              Start the conversation with {displayName} 👋
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} isMine={msg.sender_id === currentUserId} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pt-2 border-t border-border bg-background" style={{ paddingBottom: '0.75rem' }}>
        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.wav,.mp3,.mp4,.pdf,.zip"
            className="hidden"
            onChange={handleFileUpload}
          />
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
            placeholder="Message..."
            className="flex-1 min-h-[40px] max-h-32 resize-none bg-secondary/50 border-border text-sm py-2.5"
            rows={1}
          />
          <Button
            size="icon"
            onClick={sendMessage}
            disabled={!text.trim() || sending}
            className="flex-shrink-0 w-10 h-10 rounded-full"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
