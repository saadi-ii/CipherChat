import mongoose, { Document, Schema } from "mongoose";

export interface user_interface extends Document {
    username: string,
    email: string,
    password: string,
    avatar?: string,
    lastSeen?: Date
}

const user_schema = new Schema<user_interface>({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    avatar: {
        type: String
    },
    lastSeen: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true })

const user_model = mongoose.model<user_interface>("user", user_schema)

export default user_model
