import jwt, { JwtPayload } from "jsonwebtoken"
import { CookieOptions } from "express"
import { env } from "./env"

export const signToken = (userId: string): string =>
    jwt.sign({ _id: userId }, env.jwtSecret, { expiresIn: "7d" })

export const verifyToken = (token: string): JwtPayload =>
    jwt.verify(token, env.jwtSecret) as JwtPayload

export const authCookieOptions: CookieOptions = {
    httpOnly: true,
    sameSite: env.cookie.sameSite,
    secure: env.cookie.secure,
    domain: env.cookie.domain,
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
}
