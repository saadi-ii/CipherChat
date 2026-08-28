import express,{Router} from "express"
import { _signup, _signin, _signout, _get } from "../controller/user/user.controller"


const router = Router()

router.post("/signup", _signup)
router.post("/signin", _signin)
router.post("/signout", _signout)
router.get("/user", _get)

export default router