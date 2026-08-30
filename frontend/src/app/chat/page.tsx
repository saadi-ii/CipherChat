"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"
import { ChatShell } from "@/components/chat/chat-shell"
import { Spinner } from "@/components/ui/spinner"

export default function ChatPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) router.replace("/signin")
  }, [user, loading, router])

  if (loading || !user) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Spinner className="size-6" />
      </div>
    )
  }

  return <ChatShell me={user} />
}
