"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { LogOutIcon } from "lucide-react"

import { api } from "@/lib/api"
import { useRealtime } from "@/lib/realtime"
import type { Message, User } from "@/lib/types"
import { useAuth } from "@/components/providers/auth-provider"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ConversationList } from "@/components/chat/conversation-list"
import { ChatWindow } from "@/components/chat/chat-window"
import { BlueprintNav } from "@/components/chat/blueprint-nav"

export function ChatShell({ me }: { me: User }) {
  const router = useRouter()
  const { logout } = useAuth()

  const [search, setSearch] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [usersLoading, setUsersLoading] = useState(true)

  const [selected, setSelected] = useState<User | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)

  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set())
  const [typingPeer, setTypingPeer] = useState(false)

  // mirrored into a ref so the poll callbacks and composer handlers can read
  // the current thread without being re-created on every selection change
  const selectedRef = useRef<User | null>(null)
  useEffect(() => {
    selectedRef.current = selected
  }, [selected])

  // ---- user directory (debounced search) -------------------------------
  useEffect(() => {
    let active = true
    const timer = setTimeout(() => {
      setUsersLoading(true)
      api
        .users(search.trim() || undefined)
        .then((list) => {
          if (active) setUsers(list)
        })
        .catch(() => {
          if (active) setUsers([])
        })
        .finally(() => {
          if (active) setUsersLoading(false)
        })
    }, 250)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [search])

  // ---- realtime (polling) ----------------------------------------------
  /** Upsert by `_id`: the poll returns new messages *and* read-flag changes. */
  const mergeMessages = useCallback(
    (incoming: Message[]) => {
      const peer = selectedRef.current
      if (!peer) return

      // a poll issued before the user switched threads can land after it
      const relevant = incoming.filter(
        (m) =>
          (m.sender === peer._id && m.receiver === me._id) ||
          (m.sender === me._id && m.receiver === peer._id)
      )
      if (relevant.length === 0) return

      setMessages((prev) => {
        const byId = new Map(prev.map((m) => [m._id, m]))
        for (const m of relevant) byId.set(m._id, m)
        return [...byId.values()].sort(
          (a, b) => a.createdAt.localeCompare(b.createdAt) || a._id.localeCompare(b._id)
        )
      })
    },
    [me._id]
  )

  const handleOnline = useCallback((ids: string[]) => setOnlineIds(new Set(ids)), [])

  const realtime = useRealtime({
    enabled: true,
    peerId: selected?._id ?? null,
    onMessages: mergeMessages,
    onOnline: handleOnline,
    onTyping: setTypingPeer,
  })

  // ---- load a conversation ---------------------------------------------
  const openConversation = useCallback((user: User) => {
    setSelected(user)
    setTypingPeer(false)
    setMessages([])
    setMessagesLoading(true)
    api
      .conversation(user._id)
      .then((history) => setMessages(history))
      .catch(() => setMessages([]))
      .finally(() => setMessagesLoading(false))
  }, [])

  const sendMessage = useCallback(
    (text: string) => {
      const peer = selectedRef.current
      if (!peer) return
      api
        .send(peer._id, text)
        .then((message) => {
          mergeMessages([message])
          // pull the peer's side of the exchange without waiting for the tick
          realtime.poke()
        })
        .catch(() => {
          // the message did not persist; the composer already cleared, so the
          // next poll simply will not show it - nothing to roll back
        })
    },
    [mergeMessages, realtime]
  )

  const sendTyping = useCallback(
    (typing: boolean) => {
      const peer = selectedRef.current
      if (!peer) return
      realtime.sendTyping(peer._id, typing)
    },
    [realtime]
  )

  async function handleLogout() {
    await logout()
    router.replace("/signin")
  }

  const peerOnline = useMemo(
    () => (selected ? onlineIds.has(selected._id) : false),
    [selected, onlineIds]
  )

  return (
    <div className="flex h-svh w-full overflow-hidden">
      <aside className="flex w-72 shrink-0 flex-col border-r bg-sidebar">
        <div className="flex items-center gap-2 border-b px-3 py-3">
          <Avatar className="size-8">
            <AvatarFallback>{me.username.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1 truncate text-sm font-semibold">
            {me.username}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleLogout}
            aria-label="Sign out"
          >
            <LogOutIcon />
          </Button>
        </div>

        <div className="min-h-0 flex-1">
          <ConversationList
            users={users}
            loading={usersLoading}
            search={search}
            onSearch={setSearch}
            selectedId={selected?._id ?? null}
            onSelect={openConversation}
            onlineIds={onlineIds}
          />
        </div>

        <BlueprintNav />
      </aside>

      <main className="min-w-0 flex-1">
        {/* keyed on the peer so per-thread state (the draft) resets on switch */}
        <ChatWindow
          key={selected?._id ?? "none"}
          me={me}
          peer={selected}
          messages={messages}
          loading={messagesLoading}
          peerOnline={peerOnline}
          peerTyping={typingPeer}
          onSend={sendMessage}
          onType={sendTyping}
        />
      </main>
    </div>
  )
}
