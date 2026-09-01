import { NextResponse } from "next/server"
import bcryptjs from "bcryptjs"
import { connectDB } from "@/server/db"
import { UserModel } from "@/server/models/user"
import { setAuthCookie } from "@/server/auth"
import { rateLimit } from "@/server/rate-limit"
import { HttpError, handle, readJson } from "@/server/http"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

interface Body {
  username?: string
  password?: string
}

export async function POST(req: Request) {
  return handle(async () => {
    await rateLimit(req, "signin", { limit: 20, windowMs: 15 * 60 * 1000 })

    const { username, password } = await readJson<Body>(req)

    if (!username || !password) {
      throw new HttpError(400, "username and password are required")
    }

    await connectDB()

    const user = await UserModel.findOne({
      $or: [{ username }, { email: String(username).toLowerCase() }],
    })

    if (!user) throw new HttpError(401, "Please sign up first")

    const ok = await bcryptjs.compare(password, user.password)
    if (!ok) throw new HttpError(401, "Incorrect password")

    return setAuthCookie(
      NextResponse.json({
        _id: String(user._id),
        username: user.username,
        email: user.email,
      }),
      String(user._id)
    )
  })
}
