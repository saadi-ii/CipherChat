import user_model from "../../model/user.model";
import { Request, Response } from "express"
import jwt from "jsonwebtoken"
import bcrypjs from "bcryptjs"
import dotenv from "dotenv"
dotenv.config()

export const _signup = async (req: Request, res: Response): Promise<void> => {
    try {
        const { username, email, password } = req.body
        const is_user_exist = await user_model.findOne({
            $or: [
                { username }, { password }
            ]
        })

        if (is_user_exist) {
            res.status(409).json({ message: "User already Exist" })
            return
        }

        const hashed = await bcrypjs.hash(password, 10)

        const user_data = await user_model.create({
            username, email, password:hashed
        })

        const token = jwt.sign({
            _id : user_data._id
        },process.env.JWT_SECRET as string)

        const isProd = process.env.NODE_ENV === "production"
        res.cookie("token",token,{
            httpOnly:true,
            sameSite:"lax",
            maxAge:24*60*60,
            secure: isProd
        })

        res.status(201).json({ message: "Welcome" })
    } catch (error) {
        res.status(500).json({ message: "Server Error" })
    }

}