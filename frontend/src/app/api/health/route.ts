import { NextResponse } from "next/server"
import { connectDB } from "@/server/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** Liveness + DB reachability, handy for uptime checks after a deploy. */
export async function GET() {
  try {
    await connectDB()
    return NextResponse.json({ status: "ok", db: "connected" })
  } catch {
    return NextResponse.json({ status: "degraded", db: "unreachable" }, { status: 503 })
  }
}
