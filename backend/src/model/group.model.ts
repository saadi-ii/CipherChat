import mongoose, { Document, Schema, Types } from "mongoose"

/**
 * BLUEPRINT - not used by the product yet.
 *
 * A group is a named set of users with a group chat. Messages would reuse the
 * message model with an added `group` ref (instead of `receiver`). Left here so
 * the data shape is agreed on before the feature is built.
 */
export interface group_interface extends Document {
    name: string,
    avatar?: string,
    owner: Types.ObjectId,
    admins: Types.ObjectId[],
    members: Types.ObjectId[],
    createdAt: Date,
    updatedAt: Date
}

const group_schema = new Schema<group_interface>({
    name: { type: String, required: true, trim: true },
    avatar: { type: String },
    owner: { type: Schema.Types.ObjectId, ref: "user", required: true },
    admins: [{ type: Schema.Types.ObjectId, ref: "user" }],
    members: [{ type: Schema.Types.ObjectId, ref: "user" }],
}, { timestamps: true })

const group_model = mongoose.model<group_interface>("group", group_schema)

export default group_model
