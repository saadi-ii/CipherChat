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
  email?: string
  password?: string
}

export async function POST(req: Request) {
  return handle(async () => {
    await rateLimit(req, "signup", { limit: 20, windowMs: 15 * 60 * 1000 })

    const { username, email, password } = await readJson<Body>(req)

    if (!username || !email || !password) {
      throw new HttpError(400, "username, email and password are required")
    }
    if (String(password).length < 8) {
      throw new HttpError(400, "Password must be at least 8 characters")
    }

    await connectDB()

    const exists = await UserModel.findOne({
      $or: [{ username }, { email: String(email).toLowerCase() }],
    })
      .select("_id")
      .lean()

    if (exists) throw new HttpError(409, "User already exists")

    const user = await UserModel.create({
      username,
      email,
      password: await bcryptjs.hash(password, 10),
    })

    return setAuthCookie(
      NextResponse.json(
        { _id: String(user._id), username: user.username, email: user.email },
        { status: 201 }
      ),
      String(user._id)
    )
  })
}
