import crypto from "crypto"
import dotenv from "dotenv"
dotenv.config()

/**
 * Message encryption at rest.
 *
 * Messages are stored in MongoDB as AES-256-GCM ciphertext so a database dump
 * never exposes conversation content in plaintext - the same idea as hashing a
 * password, except here we need the value back so we encrypt instead of hash.
 *
 * ENCRYPTION_KEY must be 64 hex chars (32 bytes). Generate one with:
 *   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */

const ALGORITHM = "aes-256-gcm"

const getKey = (): Buffer => {
    const raw = process.env.ENCRYPTION_KEY as string
    if (!raw || raw.length !== 64) {
        throw new Error(
            "ENCRYPTION_KEY missing or not 64 hex chars - set it in backend/.env"
        )
    }
    return Buffer.from(raw, "hex")
}

export const encrypt = (plaintext: string): string => {
    const iv = crypto.randomBytes(12)
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv)
    const encrypted = Buffer.concat([
        cipher.update(plaintext, "utf8"),
        cipher.final(),
    ])
    const tag = cipher.getAuthTag()
    // stored as iv.tag.ciphertext, all base64
    return [
        iv.toString("base64"),
        tag.toString("base64"),
        encrypted.toString("base64"),
    ].join(".")
}

export const decrypt = (payload: string): string => {
    try {
        const [ivB64, tagB64, dataB64] = payload.split(".")
        const decipher = crypto.createDecipheriv(
            ALGORITHM,
            getKey(),
            Buffer.from(ivB64, "base64")
        )
        decipher.setAuthTag(Buffer.from(tagB64, "base64"))
        const decrypted = Buffer.concat([
            decipher.update(Buffer.from(dataB64, "base64")),
            decipher.final(),
        ])
        return decrypted.toString("utf8")
    } catch {
        return "[unable to decrypt message]"
    }
}
