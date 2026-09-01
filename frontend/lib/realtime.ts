"use client"

import { useCallback, useEffect, useMemo, useRef } from "react"
import { api } from "@/lib/api"
import type { Message } from "@/lib/types"

/**
 * Realtime without WebSockets.
 *
 * Vercel Functions are request-scoped: nothing can hold a socket open, so the
 * Socket.IO client is replaced by a short poll of /api/sync. One request per
 * tick carries new messages, read-receipt flips, presence and the peer's typing
 * flag, and doubles as this user's presence heartbeat.
 */

/** Foreground cadence - fast enough to feel live, cheap enough to run all day. */
export const POLL_ACTIVE_MS = 2_000
/** Backgrounded tab: keep presence alive without burning function time. */
export const POLL_HIDDEN_MS = 15_000

/** Re-assert "still typing" at most this often, well inside the server window. */
const TYPING_REASSERT_MS = 2_500

interface RealtimeOptions {
  /** Poll only while signed in. */
  enabled: boolean
  /** Conversation currently open, if any. */
  peerId: string | null
  /** New or changed messages for the open conversation; merge by `_id`. */
  onMessages: (messages: Message[]) => void
  onOnline: (userIds: string[]) => void
  onTyping: (typing: boolean) => void
}

export interface RealtimeHandle {
  /** Poll immediately instead of waiting for the next tick (e.g. after a send). */
  poke: () => void
  /** Publish this user's typing state to the peer, throttled. */
  sendTyping: (peerId: string, typing: boolean) => void
}

export function useRealtime({
  enabled,
  peerId,
  onMessages,
  onOnline,
  onTyping,
}: RealtimeOptions): RealtimeHandle {
  // Server-issued cursor. Reset to null on peer change so the next poll falls
  // back to the server's default window rather than trusting the client clock.
  const cursor = useRef<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inFlight = useRef(false)
  const pokeNow = useRef<() => void>(() => {})

  // Latest values without re-subscribing the poll loop on every render.
  const latest = useRef({ enabled, peerId, onMessages, onOnline, onTyping })
  useEffect(() => {
    latest.current = { enabled, peerId, onMessages, onOnline, onTyping }
  })

  const lastTypingSent = useRef(0)
  const typingActive = useRef(false)

  useEffect(() => {
    cursor.current = null
  }, [peerId])

  useEffect(() => {
    if (!enabled) return

    let cancelled = false

    const schedule = (delay: number) => {
      if (cancelled) return
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => void tick(), delay)
    }

    const tick = async () => {
      if (cancelled || inFlight.current) return
      inFlight.current = true

      const { peerId: peer, onMessages: gotMessages, onOnline: gotOnline, onTyping: gotTyping } =
        latest.current

      try {
        const result = await api.sync({
          peer,
          since: cursor.current,
          open: !!peer && document.visibilityState === "visible",
        })
        if (cancelled) return

        cursor.current = result.cursor
        gotOnline(result.online)
        if (peer) {
          gotTyping(result.typing)
          if (result.messages.length) gotMessages(result.messages)
        }
      } catch {
        // Transient failure (offline, cold start, 5xx): keep the loop alive and
        // retry on the next tick rather than tearing realtime down.
      } finally {
        inFlight.current = false
        schedule(
          document.visibilityState === "visible" ? POLL_ACTIVE_MS : POLL_HIDDEN_MS
        )
      }
    }

    pokeNow.current = () => schedule(0)

    const onVisibility = () => {
      if (document.visibilityState === "visible") schedule(0)
    }
    document.addEventListener("visibilitychange", onVisibility)

    void tick()

    return () => {
      cancelled = true
      pokeNow.current = () => {}
      document.removeEventListener("visibilitychange", onVisibility)
      if (timer.current) clearTimeout(timer.current)
    }
  }, [enabled])

  const poke = useCallback(() => pokeNow.current(), [])

  const sendTyping = useCallback((peer: string, typing: boolean) => {
    const now = Date.now()

    if (typing) {
      // chat-window calls this on every keystroke; one request per keystroke
      // would be absurd, and the server flag lasts several seconds anyway.
      if (typingActive.current && now - lastTypingSent.current < TYPING_REASSERT_MS) return
      typingActive.current = true
      lastTypingSent.current = now
    } else {
      if (!typingActive.current) return
      typingActive.current = false
    }

    void api.typing(peer, typing).catch(() => {
      // typing indicators are best-effort; a dropped one is not worth surfacing
      if (typing) typingActive.current = false
    })
  }, [])

  // stable handle so consumers' useCallback deps do not churn every render
  return useMemo(() => ({ poke, sendTyping }), [poke, sendTyping])
}
