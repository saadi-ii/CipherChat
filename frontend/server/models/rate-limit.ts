import mongoose, { Schema, Types } from "mongoose"

export interface RateLimitDoc {
  _id: Types.ObjectId
  /** `${bucket}:${clientIp}` */
  key: string
  count: number
  /** TTL index removes the document when the window closes. */
  expiresAt: Date
}

const rateLimitSchema = new Schema<RateLimitDoc>({
  key: { type: String, required: true, unique: true },
  count: { type: Number, required: true, default: 0 },
  expiresAt: { type: Date, required: true },
})

rateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const RateLimitModel =
  (mongoose.models.ratelimit as mongoose.Model<RateLimitDoc>) ??
  mongoose.model<RateLimitDoc>("ratelimit", rateLimitSchema)
