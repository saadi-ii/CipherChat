import { NextResponse } from "next/server"

/** JSON body of a failed request. Mirrors the shape the client's ApiError reads. */
export const jsonError = (status: number, message: string) =>
  NextResponse.json({ message }, { status })

/**
 * Thrown by helpers (auth, validation) to unwind to a specific HTTP response.
 * `handle()` turns it into that response; anything else becomes a 500.
 */
export class HttpError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = "HttpError"
  }
}

/**
 * Wraps a Route Handler body: logs server-side, never leaks internals.
 * Route Handlers have no Express-style error middleware, so every handler
 * routes its failures through here instead of repeating try/catch.
 */
export async function handle(fn: () => Promise<NextResponse>): Promise<NextResponse> {
  try {
    return await fn()
  } catch (err) {
    if (err instanceof HttpError) return jsonError(err.status, err.message)
    console.error("Unhandled request error:", err)
    return jsonError(500, "Server Error")
  }
}

/** Parse a JSON body, treating malformed input as a 400 rather than a crash. */
export async function readJson<T>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T
  } catch {
    throw new HttpError(400, "Invalid JSON body")
  }
}

export const isObjectId = (value: string): boolean => /^[0-9a-fA-F]{24}$/.test(value)

/**
 * Best-effort client IP for rate limiting. On Vercel the platform sets
 * x-forwarded-for and it cannot be spoofed by the client (the proxy appends).
 */
export const clientIp = (req: Request): string =>
  req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
  req.headers.get("x-real-ip") ||
  "unknown"
