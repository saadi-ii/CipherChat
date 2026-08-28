import { Router } from "express"
import { _getConversation } from "../controller/message/message.controller"
import { protect } from "../middleware/auth.middleware"

const router = Router()

router.get("/:userId", protect, _getConversation)

export default router
