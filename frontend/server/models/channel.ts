import mongoose, { Schema, Types } from "mongoose"

/**
 * BLUEPRINT - not used by the product yet.
 *
 * A channel is a topic-scoped conversation that can live on its own or inside a
 * group. `isPrivate` gates whether membership is required to read. Left here so
 * the data shape is agreed on before the feature is built.
 */
export interface ChannelDoc {
  _id: Types.ObjectId
  name: string
  description?: string
  isPrivate: boolean
  group?: Types.ObjectId
  owner: Types.ObjectId
  members: Types.ObjectId[]
  createdAt: Date
  updatedAt: Date
}

const channelSchema = new Schema<ChannelDoc>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },
    isPrivate: { type: Boolean, default: false },
    group: { type: Schema.Types.ObjectId, ref: "group" },
    owner: { type: Schema.Types.ObjectId, ref: "user", required: true },
    members: [{ type: Schema.Types.ObjectId, ref: "user" }],
  },
  { timestamps: true }
)

export const ChannelModel =
  (mongoose.models.channel as mongoose.Model<ChannelDoc>) ??
  mongoose.model<ChannelDoc>("channel", channelSchema)
