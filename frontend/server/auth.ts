import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { connectDB } from "./db"
import { UserModel } from "./models/user"
import { HttpError } from "./http"
import { cookieOptions } from "./env"
import { TOKEN_COOKIE, TOKEN_MAX_AGE_SECONDS, signToken, verifyToken } from "./token"

/**
 * The Route Handler equivalent of the old Express `protect` middleware:
 * verify the httpOnly JWT cookie and confirm the user still exists.
 * Throws HttpError(401) - `handle()` turns that into the JSON 401 response.
 */
export async function requireUserId(): Promise<string> {
  const token = (await cookies()).get(TOKEN_COOKIE)?.value
  if (!token) throw new HttpError(401, "Please sign in first")

  let decodedId: string
  try {
    const decoded = verifyToken(token)
    decodedId = String(decoded._id ?? "")
  } catch {
    throw new HttpError(401, "Invalid or expired session")
  }

  await connectDB()
  const user = await UserModel.findById(decodedId).select("_id").lean()
  if (!user) throw new HttpError(401, "Please sign in first")

  return String(user._id)
}

/** Attach a fresh session cookie to a response. */
export function setAuthCookie(res: NextResponse, userId: string): NextResponse {
  res.cookies.set(TOKEN_COOKIE, signToken(userId), {
    ...cookieOptions(),
    maxAge: TOKEN_MAX_AGE_SECONDS,
  })
  return res
}

export function clearAuthCookie(res: NextResponse): NextResponse {
  res.cookies.set(TOKEN_COOKIE, "", { ...cookieOptions(), maxAge: 0 })
  return res
}
