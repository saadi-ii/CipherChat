import user_model from "../../model/user.model"
import { Request, Response } from "express"

export const _get = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user_id as string
    try {
        const user = await user_model.findById(userId).select("-password")
        if (!user) {
            res.status(401).json({ message: "Invalid session" })
            return
        }
        res.status(200).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar ?? null
        })
    } catch {
        res.status(500).json({ message: "Internal server error" })
    }
}
