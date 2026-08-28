import mongoose from "mongoose"
import dotenv from "dotenv"
dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI as string
const connetDB = async() => {
    try {
        await mongoose.connect(MONGODB_URI)
    console.log("db is connected");
    } catch (error) {
        console.log(error);
    }
    
}

export default connetDB