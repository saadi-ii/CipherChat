import { cn } from "@/lib/utils"
import type { Message } from "@/lib/types"

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

export function MessageBubble({
  message,
  mine,
  showStatus,
}: {
  message: Message
  mine: boolean
  showStatus: boolean
}) {
  return (
    <div className={cn("flex w-full", mine ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-3 py-2 text-sm break-words",
          mine
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-muted text-foreground rounded-bl-sm"
        )}
      >
        <p className="whitespace-pre-wrap">{message.text}</p>
        <span
          className={cn(
            "mt-1 flex items-center justify-end gap-1 text-[10px]",
            mine ? "text-primary-foreground/70" : "text-muted-foreground"
          )}
        >
          {formatTime(message.createdAt)}
          {mine && showStatus ? <span>{message.read ? "Read" : "Sent"}</span> : null}
        </span>
      </div>
    </div>
  )
}
