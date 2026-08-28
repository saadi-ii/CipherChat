import user_model from "../../model/user.model"
import { Request, Response } from "express"
import jwt from "jsonwebtoken"
import bcryptjs from "bcryptjs"
import dotenv from 'dotenv';
dotenv.config()




export const _get = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user_id as string
    try {
        const user = await user_model.findOne({
            _id: userId
        })
        if (!user) {
            res.status(401).json({message:"Incorrect cookie"})
            return 
        }
        res.status(200).json({ username : user.username, email:user.email})
    } catch {
        res.status(500).json({ message: "Internal server error" })
    }
}