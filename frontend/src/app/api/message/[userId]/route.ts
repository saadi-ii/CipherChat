import { NextResponse } from "next/server"
import { connectDB } from "@/server/db"
import { requireUserId } from "@/server/auth"
import { getConversation, markConversationRead } from "@/server/messages"
import { HttpError, handle, isObjectId } from "@/server/http"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** GET /api/message/:userId - conversation history with the given user. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  return handle(async () => {
    const me = await requireUserId()
    const { userId: other } = await params

    if (!isObjectId(other)) throw new HttpError(400, "invalid user id")

    await connectDB()
    const messages = await getConversation(me, other)

    // opening the thread marks their messages to me as read
    await markConversationRead(other, me)

    return NextResponse.json(messages)
  })
}
