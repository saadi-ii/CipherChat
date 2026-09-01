import { LockKeyholeIcon } from "lucide-react"
import { cn } from "@/lib/utils"

/** App wordmark: a gradient lock glyph + gradient "CipherChat" text. */
export function BrandMark({
  className,
  iconClassName,
  textClassName,
}: {
  className?: string
  iconClassName?: string
  textClassName?: string
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-chart-3 text-primary-foreground shadow-sm",
          iconClassName
        )}
      >
        <LockKeyholeIcon className="size-4.5" strokeWidth={2.25} />
      </span>
      <span
        className={cn(
          "bg-gradient-to-r from-primary to-chart-3 bg-clip-text text-lg font-bold tracking-tight text-transparent",
          textClassName
        )}
      >
        CipherChat
      </span>
    </div>
  )
}
