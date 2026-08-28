import jwt, { JwtPayload } from "jsonwebtoken"
import { CookieOptions } from "express"
import dotenv from "dotenv"
dotenv.config()

const isProd = process.env.NODE_ENV === "production"

export const signToken = (userId: string): string =>
    jwt.sign({ _id: userId }, process.env.JWT_SECRET as string, {
        expiresIn: "7d",
    })

export const verifyToken = (token: string): JwtPayload =>
    jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload

export const authCookieOptions: CookieOptions = {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
}
