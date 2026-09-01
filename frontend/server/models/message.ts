import mongoose, { Schema, Types } from "mongoose"

export interface MessageDoc {
  _id: Types.ObjectId
  sender: Types.ObjectId
  receiver: Types.ObjectId
  /** AES-256-GCM ciphertext blob (iv.tag.data) - never plaintext. */
  content: string
  read: boolean
  createdAt: Date
  updatedAt: Date
}

const messageSchema = new Schema<MessageDoc>(
  {
    sender: { type: Schema.Types.ObjectId, ref: "user", required: true, index: true },
    receiver: { type: Schema.Types.ObjectId, ref: "user", required: true, index: true },
    content: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
)

// fast lookup of a conversation between two users, ordered by time
messageSchema.index({ sender: 1, receiver: 1, createdAt: 1 })
// the polling cursor scans by updatedAt (new messages *and* read-flag flips)
messageSchema.index({ updatedAt: 1 })

export const MessageModel =
  (mongoose.models.message as mongoose.Model<MessageDoc>) ??
  mongoose.model<MessageDoc>("message", messageSchema)
