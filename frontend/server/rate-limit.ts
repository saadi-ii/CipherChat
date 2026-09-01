import { connectDB } from "./db"
import { RateLimitModel } from "./models/rate-limit"
import { HttpError, clientIp } from "./http"

/**
 * Fixed-window rate limiter backed by MongoDB.
 *
 * `express-rate-limit`'s in-memory store is meaningless on Vercel: each
 * Function instance would keep its own counter and scaling would multiply the
 * allowance. A tiny TTL collection gives every instance the same view.
 */
export async function rateLimit(
  req: Request,
  bucket: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): Promise<void> {
  await connectDB()

  const now = Date.now()
  // The key embeds the window start, so a new window is simply a new document
  // and the TTL index sweeps the old one - no reset bookkeeping needed.
  const windowStart = Math.floor(now / windowMs) * windowMs
  const key = `${bucket}:${clientIp(req)}:${windowStart}`

  try {
    const doc = await RateLimitModel.findOneAndUpdate(
      { key },
      { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(windowStart + windowMs) } },
      { upsert: true, new: true }
    ).lean()

    if (doc && doc.count > limit) {
      throw new HttpError(429, "Too many attempts, please try again later")
    }
  } catch (err) {
    if (err instanceof HttpError) throw err
    // A limiter outage must not take auth down with it - log and allow.
    console.error("rate limit check failed:", err)
  }
}
