import { Router } from "express"
import rateLimit from "express-rate-limit"
import {
    _signup,
    _signin,
    _signout,
    _get,
    _getUsers,
} from "../controller/user/user.controller"
import { protect } from "../middleware/auth.middleware"

const router = Router()

// brute-force protection on credential endpoints only
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { message: "Too many attempts, please try again later" },
})

router.post("/signup", authLimiter, _signup)
router.post("/signin", authLimiter, _signin)
router.post("/signout", _signout)
router.get("/user", protect, _get)
router.get("/users", protect, _getUsers)

export default router
