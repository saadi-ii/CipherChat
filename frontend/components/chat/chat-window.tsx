"use client"

import { useEffect, useRef, useState } from "react"
import { SendIcon } from "lucide-react"
import type { Message, User } from "@/lib/types"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { MessageBubble } from "@/components/chat/message-bubble"

function initials(name: string): string {
  return name.slice(0, 2).toUpperCase()
}

export function ChatWindow({
  me,
  peer,
  messages,
  loading,
  peerOnline,
  peerTyping,
  onSend,
  onType,
}: {
  me: User
  peer: User | null
  messages: Message[]
  loading: boolean
  peerOnline: boolean
  peerTyping: boolean
  onSend: (text: string) => void
  onType: (typing: boolean) => void
}) {
  const [draft, setDraft] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, peerTyping])

  useEffect(() => {
    setDraft("")
  }, [peer?._id])

  if (!peer) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No conversation selected</EmptyTitle>
            <EmptyDescription>
              Pick someone from the list to start chatting.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    )
  }

  function handleChange(value: string) {
    setDraft(value)
    onType(true)
    if (typingTimeout.current) clearTimeout(typingTimeout.current)
    typingTimeout.current = setTimeout(() => onType(false), 1500)
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return
    onSend(text)
    setDraft("")
    onType(false)
    if (typingTimeout.current) clearTimeout(typingTimeout.current)
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <Avatar className="size-9">
          <AvatarFallback>{initials(peer.username)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{peer.username}</p>
          <p className="text-xs text-muted-foreground">
            {peerTyping ? "typing…" : peerOnline ? "Online" : "Offline"}
          </p>
        </div>
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {loading ? (
          <p className="text-center text-sm text-muted-foreground">Loading…</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            No messages yet. Say hello 👋
          </p>
        ) : (
          messages.map((message, i) => (
            <MessageBubble
              key={message._id}
              message={message}
              mine={message.sender === me._id}
              showStatus={i === messages.length - 1}
            />
          ))
        )}
        {peerTyping ? (
          <p className="text-xs text-muted-foreground">{peer.username} is typing…</p>
        ) : null}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={submit} className="flex items-center gap-2 border-t p-3">
        <Input
          value={draft}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={`Message ${peer.username}`}
          autoComplete="off"
        />
        <Button type="submit" size="icon" disabled={!draft.trim()}>
          <SendIcon />
          <span className="sr-only">Send</span>
        </Button>
      </form>
    </div>
  )
}
