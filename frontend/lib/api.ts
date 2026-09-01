import type { Message, User } from "./types"

/**
 * The API ships with the app as Next.js Route Handlers, so it is same-origin by
 * default (`/api`) - no CORS, and the auth cookie is first-party. Set
 * NEXT_PUBLIC_API_URL only to point at a separately hosted backend.
 */
const BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "/api"

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = "ApiError"
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, {
      credentials: "include",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      ...init,
    })
  } catch {
    throw new ApiError(0, "Cannot reach the server")
  }

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    throw new ApiError(res.status, (data as { message?: string })?.message ?? "Request failed")
  }
  return data as T
}

export interface Credentials {
  username: string
  password: string
}

export interface SignupPayload extends Credentials {
  email: string
}

/** One poll of the realtime endpoint - see src/app/api/sync/route.ts. */
export interface SyncResult {
  cursor: string
  online: string[]
  typing: boolean
  messages: Message[]
}

export const api = {
  signup: (body: SignupPayload) =>
    request<User>("/user/signup", { method: "POST", body: JSON.stringify(body) }),
  signin: (body: Credentials) =>
    request<User>("/user/signin", { method: "POST", body: JSON.stringify(body) }),
  signout: () => request<{ message: string }>("/user/signout", { method: "POST" }),
  me: () => request<User>("/user/user"),
  users: (search?: string) =>
    request<User[]>(
      `/user/users${search ? `?search=${encodeURIComponent(search)}` : ""}`
    ),
  conversation: (userId: string) => request<Message[]>(`/message/${userId}`),

  send: (to: string, text: string) =>
    request<Message>("/message", { method: "POST", body: JSON.stringify({ to, text }) }),

  typing: (to: string, typing: boolean) =>
    request<{ ok: true }>("/typing", {
      method: "POST",
      body: JSON.stringify({ to, typing }),
    }),

  sync: (params: { peer?: string | null; since?: string | null; open?: boolean }) => {
    const qs = new URLSearchParams()
    if (params.peer) qs.set("peer", params.peer)
    if (params.since) qs.set("since", params.since)
    if (params.open) qs.set("open", "1")
    return request<SyncResult>(`/sync${qs.size ? `?${qs}` : ""}`)
  },
}
