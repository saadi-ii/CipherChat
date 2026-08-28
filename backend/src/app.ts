import express from "express"
import cookieParser from "cookie-parser"
import user_routes from "./routes/user.routes"
import cors from "cors"
import dotenv from 'dotenv';
dotenv.config()


const frontend_url = process.env.frontend_url as string 
const app = express()

app.use(cors({
    origin: frontend_url || "http://localhost:3000",
    credentials: true
}))
app.use(express.json())
app.use(cookieParser())

app.use("/user", user_routes)

export default app