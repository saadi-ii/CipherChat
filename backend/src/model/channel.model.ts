import mongoose, { Document, Schema, Types } from "mongoose"

/**
 * BLUEPRINT - not used by the product yet.
 *
 * A channel is a topic-scoped conversation that can live on its own or inside a
 * group. `isPrivate` gates whether membership is required to read. Left here so
 * the data shape is agreed on before the feature is built.
 */
export interface channel_interface extends Document {
    name: string,
    description?: string,
    isPrivate: boolean,
    group?: Types.ObjectId,
    owner: Types.ObjectId,
    members: Types.ObjectId[],
    createdAt: Date,
    updatedAt: Date
}

const channel_schema = new Schema<channel_interface>({
    name: { type: String, required: true, trim: true },
    description: { type: String },
    isPrivate: { type: Boolean, default: false },
    group: { type: Schema.Types.ObjectId, ref: "group" },
    owner: { type: Schema.Types.ObjectId, ref: "user", required: true },
    members: [{ type: Schema.Types.ObjectId, ref: "user" }],
}, { timestamps: true })

const channel_model = mongoose.model<channel_interface>("channel", channel_schema)

export default channel_model
