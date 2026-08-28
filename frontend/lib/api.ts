import type { Message, User } from "./types"

const BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:5000"

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
    throw new ApiError(res.status, data?.message ?? "Request failed")
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
  conversation: (userId: string) =>
    request<Message[]>(`/message/${userId}`),
}
