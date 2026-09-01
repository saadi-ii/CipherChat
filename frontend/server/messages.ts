import { Types } from "mongoose"
import { MessageModel, type MessageDoc } from "./models/message"
import { decrypt, encrypt } from "./crypto"

export interface MessageDTO {
  _id: string
  sender: string
  receiver: string
  text: string
  read: boolean
  createdAt: string
}

const MAX_MESSAGE_LENGTH = 4000

const toDTO = (doc: MessageDoc): MessageDTO => ({
  _id: String(doc._id),
  sender: String(doc.sender),
  receiver: String(doc.receiver),
  text: decrypt(doc.content),
  read: doc.read,
  createdAt: new Date(doc.createdAt).toISOString(),
})

export const isMessageTooLong = (text: string): boolean =>
  text.length > MAX_MESSAGE_LENGTH

/** Persist a message (encrypted at rest) and return the plaintext DTO. */
export async function createMessage(
  senderId: string,
  receiverId: string,
  text: string
): Promise<MessageDTO> {
  const doc = await MessageModel.create({
    sender: new Types.ObjectId(senderId),
    receiver: new Types.ObjectId(receiverId),
    content: encrypt(text),
  })
  return toDTO(doc.toObject() as MessageDoc)
}

/** Full conversation between two users, oldest first, decrypted. */
export async function getConversation(
  userA: string,
  userB: string,
  limit = 200
): Promise<MessageDTO[]> {
  const docs = await MessageModel.find({
    $or: [
      { sender: userA, receiver: userB },
      { sender: userB, receiver: userA },
    ],
  })
    .sort({ createdAt: 1 })
    .limit(limit)
    .lean<MessageDoc[]>()

  return docs.map(toDTO)
}

/**
 * Everything in a conversation that changed since `since` - both new messages
 * and read-flag flips, because `updatedAt` moves for either. The client merges
 * these by `_id`, so one cursor replaces the old `message:new` + `message:read`
 * socket events.
 */
export async function getConversationUpdates(
  userA: string,
  userB: string,
  since: Date,
  limit = 200
): Promise<MessageDTO[]> {
  const docs = await MessageModel.find({
    updatedAt: { $gt: since },
    $or: [
      { sender: userA, receiver: userB },
      { sender: userB, receiver: userA },
    ],
  })
    .sort({ updatedAt: 1 })
    .limit(limit)
    .lean<MessageDoc[]>()

  return docs.map(toDTO)
}

/** Mark every message from `fromId` to `toId` as read. Returns affected ids. */
export async function markConversationRead(
  fromId: string,
  toId: string
): Promise<string[]> {
  const unread = await MessageModel.find({
    sender: fromId,
    receiver: toId,
    read: false,
  })
    .select("_id")
    .lean<{ _id: Types.ObjectId }[]>()

  if (unread.length === 0) return []

  const ids = unread.map((d) => String(d._id))
  await MessageModel.updateMany({ _id: { $in: ids } }, { $set: { read: true } })
  return ids
}
