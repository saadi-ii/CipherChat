import { NextResponse } from "next/server"
import { connectDB } from "@/server/db"
import { UserModel } from "@/server/models/user"
import { requireUserId } from "@/server/auth"
import { handle } from "@/server/http"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/user/users?search=<term>
 * Every user except the caller; `search` filters by username or email
 * (case-insensitive, partial match).
 */
export async function GET(req: Request) {
  return handle(async () => {
    const me = await requireUserId()
    const search = new URL(req.url).searchParams.get("search")?.trim() ?? ""

    await connectDB()

    const filter: Record<string, unknown> = { _id: { $ne: me } }
    if (search) {
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")
      filter.$or = [{ username: rx }, { email: rx }]
    }

    const users = await UserModel.find(filter)
      .select("username email avatar lastSeen")
      .sort({ username: 1 })
      .limit(50)
      .lean()

    return NextResponse.json(
      users.map((u) => ({
        _id: String(u._id),
        username: u.username,
        email: u.email,
        avatar: u.avatar ?? null,
        lastSeen: u.lastSeen ? new Date(u.lastSeen).toISOString() : undefined,
      }))
    )
  })
}
