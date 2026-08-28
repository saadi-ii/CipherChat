import { Request, Response } from "express"
import { getConversation, markConversationRead } from "../../lib/message.service"

/** GET /message/:userId - conversation history with the given user. */
export const _getConversation = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const me = req.user_id
        const other = String(req.params.userId)

        const messages = await getConversation(me, other)

        // opening the thread marks their messages to me as read
        await markConversationRead(other, me)

        res.status(200).json(messages)
    } catch {
        res.status(500).json({ message: "Internal server error" })
    }
}
