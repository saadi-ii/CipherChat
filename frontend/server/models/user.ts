import mongoose, { Schema, Types } from "mongoose"

export interface UserDoc {
  _id: Types.ObjectId
  username: string
  email: string
  password: string
  avatar?: string
  /** Heartbeat written on every /api/sync poll - drives presence. */
  lastSeen: Date
  /** Who this user is currently typing at, and when they last said so. */
  typingTo?: Types.ObjectId | null
  typingAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

const userSchema = new Schema<UserDoc>(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    avatar: { type: String },
    lastSeen: { type: Date, default: Date.now, index: true },
    typingTo: { type: Schema.Types.ObjectId, ref: "user", default: null },
    typingAt: { type: Date, default: null },
  },
  { timestamps: true }
)

// `mongoose.models` guard: a warm Function instance re-imports this module and
// would otherwise throw OverwriteModelError on the second compile.
export const UserModel =
  (mongoose.models.user as mongoose.Model<UserDoc>) ??
  mongoose.model<UserDoc>("user", userSchema)
