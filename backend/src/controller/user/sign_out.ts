import { Request, Response } from "express"
import { authCookieOptions } from "../../lib/token"

export const _signout = async (req: Request, res: Response): Promise<void> => {
    res.clearCookie("token", {
        httpOnly: true,
        sameSite: authCookieOptions.sameSite,
        secure: authCookieOptions.secure,
        domain: authCookieOptions.domain,
        path: "/",
    })
    res.status(200).json({ message: "Logged out successfully" })
}
