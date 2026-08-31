import dotenv from "dotenv"
dotenv.config()

/**
 * Central, validated configuration. Import `env` anywhere instead of reading
 * `process.env` directly. Missing/invalid required values crash the process at
 * startup with a clear message rather than failing mysteriously later.
 */

function required(name: string): string {
    const value = process.env[name]
    if (!value || !value.trim()) {
        throw new Error(`Missing required env var: ${name}`)
    }
    return value.trim()
}

const NODE_ENV = process.env.NODE_ENV ?? "development"
const isProd = NODE_ENV === "production"

const encryptionKey = required("ENCRYPTION_KEY")
if (!/^[0-9a-fA-F]{64}$/.test(encryptionKey)) {
    throw new Error(
        "ENCRYPTION_KEY must be 64 hex chars (32 bytes). Generate one with:\n" +
            '  node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    )
}

// Accept a single origin or a comma-separated list.
const corsOrigins = (process.env.FRONTEND_URL ?? process.env.frontend_url ?? "http://localhost:3000")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean)

// Cross-site cookies (frontend and backend on different domains) require
// SameSite=None + Secure. Default to safe local values, override via env.
const sameSite = (process.env.COOKIE_SAMESITE ?? (isProd ? "none" : "lax")) as
    | "lax"
    | "strict"
    | "none"

const cookieSecure =
    process.env.COOKIE_SECURE != null
        ? process.env.COOKIE_SECURE === "true"
        : isProd || sameSite === "none"

export const env = {
    NODE_ENV,
    isProd,
    port: Number(process.env.PORT ?? 5000),
    mongoUri: required("MONGODB_URI"),
    jwtSecret: required("JWT_SECRET"),
    encryptionKey,
    corsOrigins,
    // when true, Express trusts X-Forwarded-* (needed for secure cookies behind
    // a platform proxy like Render/Railway/Heroku)
    trustProxy: process.env.TRUST_PROXY === "true" || isProd,
    cookie: {
        sameSite,
        secure: cookieSecure,
        domain: process.env.COOKIE_DOMAIN || undefined,
    },
}
