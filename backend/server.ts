import http from "http"
import dotenv from "dotenv"
import db from "./src/db/db"
import app from "./src/app"
import { initSocket } from "./src/socket"
dotenv.config()

const PORT = process.env.PORT || 3000

db()

const server = http.createServer(app)
initSocket(server)

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})
