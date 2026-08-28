import userModel from "../../model/user.model"
import { Request, Response } from "express"
import jwt from "jsonwebtoken"
import bcryptjs from "bcryptjs"
import dotenv from 'dotenv';
dotenv.config()



export const _signin = async (req: Request, res: Response): Promise<void> => {
    const {username,password} = req.body;
    
    const isUserExist = await userModel.findOne({
        $or: [
            { username:username }, 
            { email:username }
        ]
    })
    
    if (!isUserExist) {
        res.status(401).json({message:"Please Signup First"})
        return 
    }
    const verifyPassword = await bcryptjs.compare(password,isUserExist.password)
    
    if (!verifyPassword) {
        res.status(401).json({message:"Incorrect password"})
        return
    }
    const token = await jwt.sign({
        _id: isUserExist._id,
    }, process.env.JWT_SECRET as string)
    
    const isProd = process.env.NODE_ENV === "production"
    res.cookie("token", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: isProd,
        path: "/",
        maxAge: 24 * 60 * 60 * 1000
    })
    
    res.status(201).json({ username : isUserExist.username})
}
