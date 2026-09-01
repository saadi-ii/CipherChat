import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * BLUEPRINT ONLY - group chat is not implemented yet.
 * The route surface is reserved and answers 501 for every method, so the API
 * shape is fixed without shipping behaviour. Schema: server/models/group.ts.
 */
const notImplemented = () =>
  NextResponse.json(
    { message: "Groups are not implemented yet (blueprint)" },
    { status: 501 }
  )

export const GET = notImplemented
export const POST = notImplemented
export const PUT = notImplemented
export const PATCH = notImplemented
export const DELETE = notImplemented
