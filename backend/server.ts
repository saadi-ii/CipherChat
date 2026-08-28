import db from "./src/db/db"
import dotenv from "dotenv"
import app from "./src/app"
dotenv.config()

const PORT = process.env.PORT || 3000

db()

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})  