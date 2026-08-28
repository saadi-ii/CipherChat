import { Router } from "express"

/**
 * BLUEPRINT ONLY - groups are not implemented yet.
 * Every route intentionally responds 501 so the API surface is reserved
 * without shipping behaviour. See src/model/group.model.ts for the schema.
 */
const router = Router()

router.use((_req, res) => {
    res.status(501).json({ message: "Groups are not implemented yet (blueprint)" })
})

export default router
