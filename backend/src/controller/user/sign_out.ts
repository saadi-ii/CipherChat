import userModel from "../../model/user.model"
import { Request, Response } from "express"
import dotenv from 'dotenv';
dotenv.config()



export const _signout = async(req:Request, res:Response):Promise<void> => {
    const isProd = process.env.NODE_ENV === "production"
    res.clearCookie("token", {
        httpOnly: true,
        sameSite: "lax",
        secure: isProd,
        path: "/",
    });
    res.status(201).json({message:"Logout Successfully"})
}