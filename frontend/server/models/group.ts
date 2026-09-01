import mongoose, { Schema, Types } from "mongoose"

/**
 * BLUEPRINT - not used by the product yet.
 *
 * A group is a named set of users with a group chat. Messages would reuse the
 * message model with an added `group` ref (instead of `receiver`). Left here so
 * the data shape is agreed on before the feature is built.
 */
export interface GroupDoc {
  _id: Types.ObjectId
  name: string
  avatar?: string
  owner: Types.ObjectId
  admins: Types.ObjectId[]
  members: Types.ObjectId[]
  createdAt: Date
  updatedAt: Date
}

const groupSchema = new Schema<GroupDoc>(
  {
    name: { type: String, required: true, trim: true },
    avatar: { type: String },
    owner: { type: Schema.Types.ObjectId, ref: "user", required: true },
    admins: [{ type: Schema.Types.ObjectId, ref: "user" }],
    members: [{ type: Schema.Types.ObjectId, ref: "user" }],
  },
  { timestamps: true }
)

export const GroupModel =
  (mongoose.models.group as mongoose.Model<GroupDoc>) ??
  mongoose.model<GroupDoc>("group", groupSchema)
