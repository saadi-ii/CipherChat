import message_model, { message_interface } from "../model/message.model"
import { encrypt, decrypt } from "./crypto"

export interface MessageDTO {
    _id: string,
    sender: string,
    receiver: string,
    text: string,
    read: boolean,
    createdAt: Date
}

const toDTO = (doc: message_interface): MessageDTO => ({
    _id: String(doc._id),
    sender: String(doc.sender),
    receiver: String(doc.receiver),
    text: decrypt(doc.content),
    read: doc.read,
    createdAt: doc.createdAt
})

/** Persist a message (encrypted at rest) and return the plaintext DTO. */
export const createMessage = async (
    senderId: string,
    receiverId: string,
    text: string
): Promise<MessageDTO> => {
    const doc = await message_model.create({
        sender: senderId,
        receiver: receiverId,
        content: encrypt(text)
    })
    return toDTO(doc)
}

/** Full conversation between two users, oldest first, decrypted. */
export const getConversation = async (
    userA: string,
    userB: string,
    limit = 200
): Promise<MessageDTO[]> => {
    const docs = await message_model
        .find({
            $or: [
                { sender: userA, receiver: userB },
                { sender: userB, receiver: userA }
            ]
        })
        .sort({ createdAt: 1 })
        .limit(limit)

    return docs.map(toDTO)
}

/** Mark every message from `fromId` to `toId` as read. Returns affected ids. */
export const markConversationRead = async (
    fromId: string,
    toId: string
): Promise<string[]> => {
    const unread = await message_model
        .find({ sender: fromId, receiver: toId, read: false })
        .select("_id")

    if (unread.length === 0) return []

    const ids = unread.map((d) => String(d._id))
    await message_model.updateMany({ _id: { $in: ids } }, { $set: { read: true } })
    return ids
}
