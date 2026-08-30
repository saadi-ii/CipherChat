"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { LogOutIcon } from "lucide-react"

import { api } from "@/lib/api"
import { getSocket } from "@/lib/socket"
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
  const [typingPeer, setTypingPeer] = useState<string | null>(null)

  const selectedRef = useRef<User | null>(null)
  selectedRef.current = selected

  // ---- user directory (debounced search) -------------------------------
  useEffect(() => {
    let active = true
    setUsersLoading(true)
    const timer = setTimeout(() => {
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

  // ---- socket lifecycle ------------------------------------------------
  useEffect(() => {
    const socket = getSocket()
    if (!socket.connected) socket.connect()

    const onPresenceList = ({ online }: { online: string[] }) =>
      setOnlineIds(new Set(online))
    const onOnline = ({ userId }: { userId: string }) =>
      setOnlineIds((prev) => new Set(prev).add(userId))
    const onOffline = ({ userId }: { userId: string }) =>
      setOnlineIds((prev) => {
        const next = new Set(prev)
        next.delete(userId)
        return next
      })

    const onMessage = (message: Message) => {
      const peer = selectedRef.current
      const involvesPeer =
        peer &&
        ((message.sender === peer._id && message.receiver === me._id) ||
          (message.sender === me._id && message.receiver === peer._id))

      if (involvesPeer) {
        setMessages((prev) =>
          prev.some((m) => m._id === message._id) ? prev : [...prev, message]
        )
        if (message.sender === peer!._id) {
          socket.emit("message:read", { from: peer!._id })
        }
      }
    }

    const onRead = ({ by, ids }: { by: string; ids: string[] }) => {
      const peer = selectedRef.current
      if (!peer || by !== peer._id) return
      setMessages((prev) =>
        prev.map((m) => (ids.includes(m._id) ? { ...m, read: true } : m))
      )
    }

    const onTyping = ({ from, typing }: { from: string; typing: boolean }) => {
      const peer = selectedRef.current
      if (!peer || from !== peer._id) return
      setTypingPeer(typing ? from : null)
    }

    socket.on("presence:list", onPresenceList)
    socket.on("presence:online", onOnline)
    socket.on("presence:offline", onOffline)
    socket.on("message:new", onMessage)
    socket.on("message:read", onRead)
    socket.on("typing", onTyping)

    return () => {
      socket.off("presence:list", onPresenceList)
      socket.off("presence:online", onOnline)
      socket.off("presence:offline", onOffline)
      socket.off("message:new", onMessage)
      socket.off("message:read", onRead)
      socket.off("typing", onTyping)
    }
  }, [me._id])

  // ---- load a conversation ------------------------------------------------
  const openConversation = useCallback((user: User) => {
    setSelected(user)
    setTypingPeer(null)
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
      getSocket().emit("message:send", { to: peer._id, text })
    },
    []
  )

  const sendTyping = useCallback((typing: boolean) => {
    const peer = selectedRef.current
    if (!peer) return
    getSocket().emit("typing", { to: peer._id, typing })
  }, [])

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
        <ChatWindow
          me={me}
          peer={selected}
          messages={messages}
          loading={messagesLoading}
          peerOnline={peerOnline}
          peerTyping={typingPeer !== null}
          onSend={sendMessage}
          onType={sendTyping}
        />
      </main>
    </div>
  )
}
