import mongoose, { Document, Schema, Types } from "mongoose"

export interface message_interface extends Document {
    sender: Types.ObjectId,
    receiver: Types.ObjectId,
    content: string,        // AES-256-GCM ciphertext blob (iv.tag.data)
    read: boolean,
    createdAt: Date,
    updatedAt: Date
}

const message_schema = new Schema<message_interface>({
    sender: {
        type: Schema.Types.ObjectId,
        ref: "user",
        required: true,
        index: true
    },
    receiver: {
        type: Schema.Types.ObjectId,
        ref: "user",
        required: true,
        index: true
    },
    content: {
        type: String,
        required: true
    },
    read: {
        type: Boolean,
        default: false
    }
}, { timestamps: true })

// fast lookup of a conversation between two users, ordered by time
message_schema.index({ sender: 1, receiver: 1, createdAt: 1 })

const message_model = mongoose.model<message_interface>("message", message_schema)

export default message_model
