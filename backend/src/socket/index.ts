import { Server as HttpServer } from "http"
import { Server, Socket } from "socket.io"
import * as cookie from "cookie"
import { env } from "../lib/env"
import { verifyToken } from "../lib/token"
import user_model from "../model/user.model"
import { createMessage, markConversationRead } from "../lib/message.service"

interface AuthedSocket extends Socket {
    userId: string
}

// userId -> number of live sockets for that user
const online = new Map<string, number>()

export const initSocket = (httpServer: HttpServer): Server => {
    const io = new Server(httpServer, {
        cors: {
            origin: env.corsOrigins,
            credentials: true,
        },
    })

    // authenticate the handshake using the same httpOnly JWT cookie as REST
    io.use(async (socket, next) => {
        try {
            const raw = socket.handshake.headers.cookie
            if (!raw) return next(new Error("unauthorized"))

            const token = cookie.parse(raw).token
            if (!token) return next(new Error("unauthorized"))

            const decoded = verifyToken(token)
            const user = await user_model.findById(decoded._id).select("_id")
            if (!user) return next(new Error("unauthorized"))

            ;(socket as AuthedSocket).userId = String(user._id)
            next()
        } catch {
            next(new Error("unauthorized"))
        }
    })

    io.on("connection", (socket) => {
        const userId = (socket as AuthedSocket).userId
        socket.join(userId)

        // presence bookkeeping
        const next = (online.get(userId) ?? 0) + 1
        online.set(userId, next)
        if (next === 1) socket.broadcast.emit("presence:online", { userId })
        socket.emit("presence:list", { online: [...online.keys()] })

        socket.on(
            "message:send",
            async (
                payload: { to?: string; text?: string },
                ack?: (r: unknown) => void
            ) => {
                try {
                    const text = String(payload?.text ?? "").trim()
                    const to = String(payload?.to ?? "")
                    if (!text || !to) return ack?.({ ok: false, error: "invalid payload" })

                    const message = await createMessage(userId, to, text)
                    io.to(to).emit("message:new", message)
                    socket.emit("message:new", message)
                    ack?.({ ok: true, message })
                } catch {
                    ack?.({ ok: false, error: "failed to send" })
                }
            }
        )

        socket.on("message:read", async (payload: { from?: string }) => {
            const from = String(payload?.from ?? "")
            if (!from) return
            const ids = await markConversationRead(from, userId)
            if (ids.length) io.to(from).emit("message:read", { by: userId, ids })
        })

        socket.on("typing", (payload: { to?: string; typing?: boolean }) => {
            const to = String(payload?.to ?? "")
            if (!to) return
            io.to(to).emit("typing", { from: userId, typing: !!payload?.typing })
        })

        socket.on("disconnect", async () => {
            const remaining = (online.get(userId) ?? 1) - 1
            if (remaining <= 0) {
                online.delete(userId)
                socket.broadcast.emit("presence:offline", { userId })
                await user_model.findByIdAndUpdate(userId, { lastSeen: new Date() })
            } else {
                online.set(userId, remaining)
            }
        })
    })

    return io
}
