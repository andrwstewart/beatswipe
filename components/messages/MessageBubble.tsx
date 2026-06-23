import type { Message } from '@/types'

interface MessageBubbleProps {
  message: Message
  isMine: boolean
}

export function MessageBubble({ message, isMine }: MessageBubbleProps) {
  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-2`}>
      <div
        className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
          isMine
            ? 'bg-primary text-primary-foreground rounded-br-sm'
            : 'bg-secondary text-foreground rounded-bl-sm'
        }`}
      >
        {message.content && <p className="leading-relaxed">{message.content}</p>}

        {message.audio_url && (
          <audio controls src={message.audio_url} className="mt-1 w-full max-w-[200px]" />
        )}

        {message.file_url && !message.audio_url && (
          <a
            href={message.file_url}
            download
            className="flex items-center gap-2 mt-1 text-xs underline underline-offset-2"
          >
            📎 Download file
          </a>
        )}

        <p
          className={`text-[10px] mt-1 ${
            isMine ? 'text-primary-foreground/60' : 'text-muted-foreground'
          }`}
        >
          {new Date(message.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  )
}
