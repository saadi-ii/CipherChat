import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"
import dotenv from "dotenv"
import user_routes from "./routes/user.routes"
import message_routes from "./routes/message.routes"
import group_routes from "./routes/group.routes"
import channel_routes from "./routes/channel.routes"
dotenv.config()

const frontend_url = process.env.frontend_url as string
const app = express()

app.use(cors({
    origin: frontend_url || "http://localhost:3000",
    credentials: true
}))
app.use(express.json())
app.use(cookieParser())

app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" })
})

app.use("/user", user_routes)
app.use("/message", message_routes)

// Blueprints only - these respond 501 until the features are built.
app.use("/group", group_routes)
app.use("/channel", channel_routes)

export default app
