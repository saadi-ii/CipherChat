import jwt, { type JwtPayload } from "jsonwebtoken"
import { jwtSecret } from "./env"

export const TOKEN_COOKIE = "token"
export const TOKEN_MAX_AGE_SECONDS = 7 * 24 * 60 * 60

export const signToken = (userId: string): string =>
  jwt.sign({ _id: userId }, jwtSecret(), { expiresIn: "7d" })

export const verifyToken = (token: string): JwtPayload =>
  jwt.verify(token, jwtSecret()) as JwtPayload
