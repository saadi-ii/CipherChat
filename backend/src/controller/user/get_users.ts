import user_model from "../../model/user.model"
import { Request, Response } from "express"

/**
 * GET /user/users?search=<term>
 * Returns every user except the caller. When `search` is provided it filters
 * by username or email (case-insensitive, partial match).
 */
export const _getUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const me = req.user_id
        const search = String(req.query.search ?? "").trim()

        const filter: Record<string, unknown> = { _id: { $ne: me } }

        if (search) {
            const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")
            filter.$or = [{ username: rx }, { email: rx }]
        }

        const users = await user_model
            .find(filter)
            .select("username email avatar lastSeen")
            .sort({ username: 1 })
            .limit(50)

        res.status(200).json(users)
    } catch {
        res.status(500).json({ message: "Internal server error" })
    }
}
