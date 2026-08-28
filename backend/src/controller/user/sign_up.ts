import user_model from "../../model/user.model";
import { Request, Response } from "express"
import bcryptjs from "bcryptjs"
import { signToken, authCookieOptions } from "../../lib/token"

export const _signup = async (req: Request, res: Response): Promise<void> => {
    try {
        const { username, email, password } = req.body

        if (!username || !email || !password) {
            res.status(400).json({ message: "username, email and password are required" })
            return
        }

        if (String(password).length < 8) {
            res.status(400).json({ message: "Password must be at least 8 characters" })
            return
        }

        const is_user_exist = await user_model.findOne({
            $or: [{ username }, { email }]
        })

        if (is_user_exist) {
            res.status(409).json({ message: "User already exists" })
            return
        }

        const hashed = await bcryptjs.hash(password, 10)

        const user_data = await user_model.create({
            username,
            email,
            password: hashed
        })

        const token = signToken(String(user_data._id))
        res.cookie("token", token, authCookieOptions)

        res.status(201).json({
            _id: user_data._id,
            username: user_data.username,
            email: user_data.email
        })
    } catch (error) {
        res.status(500).json({ message: "Server Error" })
    }
}
