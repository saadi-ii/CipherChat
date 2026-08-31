import http from "http"
import { env } from "./src/lib/env"
import db from "./src/db/db"
import app from "./src/app"
import { initSocket } from "./src/socket"

const server = http.createServer(app)

async function start() {
    try {
        await db()
    } catch (err) {
        console.error("Failed to connect to MongoDB - aborting startup:", err)
        process.exit(1)
    }

    initSocket(server)

    server.listen(env.port, () => {
        console.log(`Server is running on port ${env.port}`)
    })
}

void start()

// graceful shutdown so platforms can restart/redeploy cleanly
for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.on(signal, () => {
        console.log(`${signal} received, shutting down`)
        server.close(() => process.exit(0))
        setTimeout(() => process.exit(1), 10000).unref()
    })
}
