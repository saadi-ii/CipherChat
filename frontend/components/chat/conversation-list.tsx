"use client"

import { SearchIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { User } from "@/lib/types"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"

function initials(name: string): string {
  return name.slice(0, 2).toUpperCase()
}

export function ConversationList({
  users,
  loading,
  search,
  onSearch,
  selectedId,
  onSelect,
  onlineIds,
}: {
  users: User[]
  loading: boolean
  search: string
  onSearch: (value: string) => void
  selectedId: string | null
  onSelect: (user: User) => void
  onlineIds: Set<string>
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="p-3">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search people"
            className="pl-8"
            aria-label="Search people"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <ul className="space-y-0.5 px-2 pb-2">
          {loading && users.length === 0
            ? Array.from({ length: 6 }).map((_, i) => (
                <li key={i} className="flex items-center gap-3 px-2 py-2">
                  <Skeleton className="size-9 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </li>
              ))
            : null}

          {!loading && users.length === 0 ? (
            <li className="px-2 py-6 text-center text-sm text-muted-foreground">
              No people found
            </li>
          ) : null}

          {users.map((user) => {
            const isOnline = onlineIds.has(user._id)
            return (
              <li key={user._id}>
                <button
                  type="button"
                  onClick={() => onSelect(user)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors",
                    selectedId === user._id
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  <span className="relative">
                    <Avatar className="size-9">
                      <AvatarFallback>{initials(user.username)}</AvatarFallback>
                    </Avatar>
                    <span
                      className={cn(
                        "absolute right-0 bottom-0 size-2.5 rounded-full border-2 border-background",
                        isOnline ? "bg-emerald-500" : "bg-muted-foreground/40"
                      )}
                      aria-hidden
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {user.username}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {isOnline ? "Online" : "Offline"}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </ScrollArea>
    </div>
  )
}
