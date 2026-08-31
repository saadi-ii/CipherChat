import mongoose from "mongoose"
import { env } from "../lib/env"

/**
 * Connect to MongoDB. Rejects (so the caller can abort startup) if the initial
 * connection fails - we don't want the server accepting traffic with no DB.
 */
const connectDB = async (): Promise<void> => {
    mongoose.connection.on("disconnected", () => {
        console.warn("MongoDB disconnected")
    })
    mongoose.connection.on("reconnected", () => {
        console.log("MongoDB reconnected")
    })

    await mongoose.connect(env.mongoUri, {
        serverSelectionTimeoutMS: 10000,
    })
    console.log("db is connected")
}

export default connectDB
