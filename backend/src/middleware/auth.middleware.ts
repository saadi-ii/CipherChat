import user_model from "../model/user.model"
import { Request, Response, NextFunction } from "express"
import jwt,{JwtPayload} from "jsonwebtoken"
import bcrypjs from "bcryptjs"
import dotenv from "dotenv"
dotenv.config()
declare global{
    namespace Express{
        interface Request{
            user_id:string
        }
    }
}

export const _signup = async (req: Request, res: Response, next:NextFunction): Promise<void> => {
    try {
        const token = req.cookies?.token as string


        if (!token) {
            res.status(401).json({ message: "Please Sign up first" })
            return
        }
        
        const decode = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload
        
        const user_data = await user_model.findById({
            decode
        })
        
        if (!user_data) {
            res.status(401).json({ message: "Please Sign up first" })
            return
        }

        req.user_id = String(decode._id)
        next()
    } catch (error) {
        res.status(500).json({ message: "Server Error" })
    }

}