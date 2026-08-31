import express, { NextFunction, Request, Response } from "express"
import cookieParser from "cookie-parser"
import cors from "cors"
import helmet from "helmet"
import { env } from "./lib/env"
import user_routes from "./routes/user.routes"
import message_routes from "./routes/message.routes"
import group_routes from "./routes/group.routes"
import channel_routes from "./routes/channel.routes"

const app = express()

// behind a platform proxy (Render/Railway/Heroku) so secure cookies + rate-limit
// see the real client IP / protocol
if (env.trustProxy) app.set("trust proxy", 1)

app.use(helmet())
app.use(
    cors({
        origin: env.corsOrigins,
        credentials: true,
    })
)
app.use(express.json({ limit: "100kb" }))
app.use(cookieParser())

app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" })
})

app.use("/user", user_routes)
app.use("/message", message_routes)

// Blueprints only - these respond 501 until the features are built.
app.use("/group", group_routes)
app.use("/channel", channel_routes)

// JSON 404 instead of Express's HTML default
app.use((_req, res) => {
    res.status(404).json({ message: "Not found" })
})

// Last-resort error handler: log server-side, never leak internals to clients.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Unhandled request error:", err)
    res.status(500).json({ message: "Server Error" })
})

export default app
