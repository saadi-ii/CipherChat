import userModel from "../../model/user.model"
import { Request, Response } from "express"
import bcryptjs from "bcryptjs"
import { signToken, authCookieOptions } from "../../lib/token"

export const _signin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { username, password } = req.body

        if (!username || !password) {
            res.status(400).json({ message: "username and password are required" })
            return
        }

        const isUserExist = await userModel.findOne({
            $or: [{ username }, { email: username }]
        })

        if (!isUserExist) {
            res.status(401).json({ message: "Please sign up first" })
            return
        }

        const verifyPassword = await bcryptjs.compare(password, isUserExist.password)

        if (!verifyPassword) {
            res.status(401).json({ message: "Incorrect password" })
            return
        }

        const token = signToken(String(isUserExist._id))
        res.cookie("token", token, authCookieOptions)

        res.status(200).json({
            _id: isUserExist._id,
            username: isUserExist.username,
            email: isUserExist.email
        })
    } catch (error) {
        res.status(500).json({ message: "Server Error" })
    }
}
