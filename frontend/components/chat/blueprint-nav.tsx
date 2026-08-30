import { HashIcon, LockIcon, UsersIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"

/**
 * Blueprint only. Groups and channels are intentionally not implemented -
 * this shows where they will live in the UI. Every row is disabled.
 */
export function BlueprintNav() {
  return (
    <div className="border-t px-2 py-3">
      <p className="px-2 pb-1 text-xs font-medium text-muted-foreground">
        Coming soon
      </p>
      <ul className="space-y-0.5">
        <li>
          <button
            type="button"
            disabled
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground opacity-60"
          >
            <UsersIcon className="size-4" />
            Groups
            <Badge variant="secondary" className="ml-auto">
              Blueprint
            </Badge>
          </button>
        </li>
        <li>
          <button
            type="button"
            disabled
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground opacity-60"
          >
            <HashIcon className="size-4" />
            Channels
            <LockIcon className="ml-auto size-3.5" />
          </button>
        </li>
      </ul>
    </div>
  )
}
