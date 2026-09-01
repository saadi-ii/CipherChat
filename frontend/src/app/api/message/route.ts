import { NextResponse } from "next/server"
import { connectDB } from "@/server/db"
import { requireUserId } from "@/server/auth"
import { createMessage, isMessageTooLong } from "@/server/messages"
import { HttpError, handle, isObjectId, readJson } from "@/server/http"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

interface Body {
  to?: string
  text?: string
}

/** POST /api/message - send a 1:1 message (replaces the `message:send` event). */
export async function POST(req: Request) {
  return handle(async () => {
    const me = await requireUserId()
    const body = await readJson<Body>(req)

    const text = String(body?.text ?? "").trim()
    const to = String(body?.to ?? "")

    if (!text || !isObjectId(to)) throw new HttpError(400, "invalid payload")
    if (isMessageTooLong(text)) throw new HttpError(413, "message too long")

    await connectDB()
    const message = await createMessage(me, to, text)

    return NextResponse.json(message, { status: 201 })
  })
}
