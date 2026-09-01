import { NextResponse } from "next/server"
import { clearAuthCookie } from "@/server/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST() {
  return clearAuthCookie(NextResponse.json({ message: "Logged out successfully" }))
}
