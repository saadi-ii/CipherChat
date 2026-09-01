import { NextResponse } from "next/server"
import { Types } from "mongoose"
import { connectDB } from "@/server/db"
import { UserModel } from "@/server/models/user"
import { requireUserId } from "@/server/auth"
import { HttpError, handle, isObjectId, readJson } from "@/server/http"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

interface Body {
  to?: string
  typing?: boolean
}

/**
 * POST /api/typing - replaces the `typing` socket event.
 * The flag lives on the sender's user document and expires on read
 * (see TYPING_WINDOW_MS), so no cleanup job is needed.
 */
export async function POST(req: Request) {
  return handle(async () => {
    const me = await requireUserId()
    const body = await readJson<Body>(req)

    const to = String(body?.to ?? "")
    if (!isObjectId(to)) throw new HttpError(400, "invalid payload")

    await connectDB()
    await UserModel.updateOne(
      { _id: me },
      body?.typing
        ? { $set: { typingTo: new Types.ObjectId(to), typingAt: new Date() } }
        : { $set: { typingTo: null, typingAt: null } }
    )

    return NextResponse.json({ ok: true })
  })
}
