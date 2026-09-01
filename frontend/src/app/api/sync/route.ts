import { NextResponse } from "next/server"
import { connectDB } from "@/server/db"
import { UserModel } from "@/server/models/user"
import { requireUserId } from "@/server/auth"
import { getConversationUpdates, markConversationRead } from "@/server/messages"
import { handle, isObjectId } from "@/server/http"
import {
  CURSOR_OVERLAP_MS,
  PRESENCE_WINDOW_MS,
  TYPING_WINDOW_MS,
} from "@/server/realtime"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/sync?peer=<id>&since=<ISO>&open=1
 *
 * The single polling endpoint that stands in for the Socket.IO connection.
 * One round trip carries everything the old socket pushed:
 *
 *   message:new / message:read  -> `messages` (upserts since the cursor)
 *   presence:list/online/offline -> `online`
 *   typing                       -> `typing`
 *
 * It also *writes* the caller's presence heartbeat, so simply polling keeps a
 * user online - there is no connection whose lifetime could stand in for that.
 */
export async function GET(req: Request) {
  return handle(async () => {
    const me = await requireUserId()

    const url = new URL(req.url)
    const peer = url.searchParams.get("peer") ?? ""
    const sinceParam = url.searchParams.get("since")
    // `open=1` means the thread is on screen, so incoming messages are read
    const threadOpen = url.searchParams.get("open") === "1"

    await connectDB()

    const now = new Date()

    // presence heartbeat for the caller
    await UserModel.updateOne({ _id: me }, { $set: { lastSeen: now } })

    const onlineDocs = await UserModel.find({
      lastSeen: { $gt: new Date(now.getTime() - PRESENCE_WINDOW_MS) },
    })
      .select("_id")
      .limit(500)
      .lean()

    const online = onlineDocs.map((u) => String(u._id))

    let messages: Awaited<ReturnType<typeof getConversationUpdates>> = []
    let typing = false

    if (isObjectId(peer)) {
      const since = sinceParam ? new Date(sinceParam) : new Date(now.getTime() - 60_000)

      if (threadOpen) {
        // the peer's messages to me are being looked at right now
        await markConversationRead(peer, me)
      }

      messages = await getConversationUpdates(me, peer, since)

      const peerDoc = await UserModel.findById(peer)
        .select("typingTo typingAt")
        .lean()

      typing =
        !!peerDoc?.typingAt &&
        String(peerDoc.typingTo ?? "") === me &&
        now.getTime() - new Date(peerDoc.typingAt).getTime() < TYPING_WINDOW_MS
    }

    return NextResponse.json({
      // hand back the next cursor rather than letting the client guess: it is
      // derived from *this* instance's clock, the same one that stamps writes
      cursor: new Date(now.getTime() - CURSOR_OVERLAP_MS).toISOString(),
      online,
      typing,
      messages,
    })
  })
}
