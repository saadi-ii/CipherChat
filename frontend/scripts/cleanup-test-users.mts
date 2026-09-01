/**
 * Remove test/demo accounts and every message they took part in.
 *
 * Dry run by default - it prints exactly what it would delete and changes
 * nothing. Pass --yes to actually perform the deletion.
 *
 *   npm run cleanup:test-users              # preview
 *   npm run cleanup:test-users -- --yes     # delete
 *   npm run cleanup:test-users -- foo bar   # preview a custom list
 *
 * Deleting a user also deletes their conversations with real users, since a
 * thread with a missing participant is unusable.
 *
 * Reads MONGODB_URI from .env.local (or the ambient environment).
 */
import fs from "node:fs"
import path from "node:path"
import mongoose from "mongoose"
import { UserModel } from "../server/models/user.ts"
import { MessageModel } from "../server/models/message.ts"

/** Accounts created while building/testing this app. */
const DEFAULT_TEST_USERNAMES = [
  "alice",
  "bob",
  "carol",
  "smoke_a",
  "smoke_b",
  "dep_a",
  "dep_b",
  "rdy_a",
  "rdy_b",
]

/** Real accounts - never delete these, even if passed explicitly. */
const PROTECTED_USERNAMES = ["Saad", "Saad Hameed"]

/** Next loads .env.local for us at runtime; a plain node script does not. */
function loadEnvLocal(): void {
  if (process.env.MONGODB_URI) return
  const file = path.join(process.cwd(), ".env.local")
  if (!fs.existsSync(file)) return
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line)
    if (match) process.env[match[1]] ??= match[2].replace(/^["']|["']$/g, "")
  }
}

async function main(): Promise<void> {
  loadEnvLocal()

  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error("MONGODB_URI is not set (put it in .env.local)")

  const args = process.argv.slice(2)
  const apply = args.includes("--yes")
  const requested = args.filter((a) => !a.startsWith("--"))
  const targets = requested.length > 0 ? requested : DEFAULT_TEST_USERNAMES

  const blocked = targets.filter((t) => PROTECTED_USERNAMES.includes(t))
  if (blocked.length > 0) {
    console.error(`Refusing to delete protected account(s): ${blocked.join(", ")}`)
    process.exitCode = 1
    return
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 })

  const users = await UserModel.find({ username: { $in: targets } })
    .select("_id username email")
    .lean()

  if (users.length === 0) {
    console.log("No matching accounts found - nothing to do.")
    return
  }

  const ids = users.map((u) => u._id)
  const messageFilter = {
    $or: [{ sender: { $in: ids } }, { receiver: { $in: ids } }],
  }
  const messageCount = await MessageModel.countDocuments(messageFilter)

  console.log(`\nAccounts matched (${users.length}):`)
  for (const u of users) {
    console.log(`  - ${u.username}  <${u.email}>  ${String(u._id)}`)
  }
  console.log(`\nMessages that would be removed: ${messageCount}`)

  if (!apply) {
    console.log("\nDRY RUN - nothing was deleted.")
    console.log("Re-run with --yes to apply:")
    console.log("  npm run cleanup:test-users -- --yes\n")
    return
  }

  // messages first, so a failure never leaves messages pointing at
  // users that no longer exist
  const deletedMessages = await MessageModel.deleteMany(messageFilter)
  const deletedUsers = await UserModel.deleteMany({ _id: { $in: ids } })

  console.log(
    `\nDeleted ${deletedUsers.deletedCount} account(s) and ` +
      `${deletedMessages.deletedCount} message(s).\n`
  )
}

main()
  .catch((err) => {
    console.error("Cleanup failed:", err)
    process.exitCode = 1
  })
  .finally(() => mongoose.disconnect())
