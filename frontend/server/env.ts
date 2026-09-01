/**
 * Central, validated configuration for the server (Route Handler) side.
 *
 * Everything is read *lazily*: `next build` runs without runtime secrets, so a
 * module that threw at import time would break the build. Handlers call these
 * accessors at request time, where a missing value is a real error.
 */

function required(name: string): string {
  const value = process.env[name]
  if (!value || !value.trim()) {
    throw new Error(`Missing required env var: ${name}`)
  }
  return value.trim()
}

export const isProd = process.env.NODE_ENV === "production"

export const mongoUri = (): string => required("MONGODB_URI")

export const jwtSecret = (): string => required("JWT_SECRET")

export const encryptionKey = (): string => {
  const key = required("ENCRYPTION_KEY")
  if (!/^[0-9a-fA-F]{64}$/.test(key)) {
    throw new Error(
      "ENCRYPTION_KEY must be 64 hex chars (32 bytes). Generate one with:\n" +
        '  node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    )
  }
  return key
}

/**
 * Frontend and API are the same Vercel deployment, so the auth cookie is
 * first-party: `SameSite=Lax` is enough and no cross-site exemption is needed.
 * COOKIE_DOMAIN stays available for the split-subdomain case.
 */
export const cookieOptions = () => ({
  httpOnly: true as const,
  sameSite: (process.env.COOKIE_SAMESITE ?? "lax") as "lax" | "strict" | "none",
  secure: process.env.COOKIE_SECURE != null ? process.env.COOKIE_SECURE === "true" : isProd,
  domain: process.env.COOKIE_DOMAIN || undefined,
  path: "/",
})
