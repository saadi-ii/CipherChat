import user_model from "../model/user.model"
import { Request, Response, NextFunction } from "express"
import jwt, { JwtPayload } from "jsonwebtoken"
import dotenv from "dotenv"
dotenv.config()

declare global {
    namespace Express {
        interface Request {
            user_id: string
        }
    }
}

export const protect = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const token = req.cookies?.token as string

        if (!token) {
            res.status(401).json({ message: "Please sign in first" })
            return
        }

        const decode = jwt.verify(
            token,
            process.env.JWT_SECRET as string
        ) as JwtPayload

        const user_data = await user_model.findById(decode._id)

        if (!user_data) {
            res.status(401).json({ message: "Please sign in first" })
            return
        }

        req.user_id = String(user_data._id)
        next()
    } catch {
        res.status(401).json({ message: "Invalid or expired session" })
    }
}
