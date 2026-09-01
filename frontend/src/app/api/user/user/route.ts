import { NextResponse } from "next/server"
import { connectDB } from "@/server/db"
import { UserModel } from "@/server/models/user"
import { requireUserId } from "@/server/auth"
import { HttpError, handle } from "@/server/http"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** GET /api/user/user - the signed-in user. */
export async function GET() {
  return handle(async () => {
    const me = await requireUserId()
    await connectDB()

    const user = await UserModel.findById(me).select("-password").lean()
    if (!user) throw new HttpError(401, "Invalid session")

    return NextResponse.json({
      _id: String(user._id),
      username: user.username,
      email: user.email,
      avatar: user.avatar ?? null,
    })
  })
}
