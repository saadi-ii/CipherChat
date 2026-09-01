import mongoose from "mongoose"
import { mongoUri } from "./env"

/**
 * Serverless-safe MongoDB connection.
 *
 * A Vercel Function instance is reused across invocations, so the connection
 * (and the in-flight promise) is cached on `globalThis` - otherwise every
 * request would open a new pool and exhaust the Atlas connection limit.
 */

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

const globalForMongoose = globalThis as unknown as { _mongoose?: MongooseCache }

const cache: MongooseCache = (globalForMongoose._mongoose ??= {
  conn: null,
  promise: null,
})

export async function connectDB(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(mongoUri(), {
        serverSelectionTimeoutMS: 10000,
        // one small pool per warm instance; Vercel scales by adding instances
        maxPoolSize: 5,
      })
      .catch((err) => {
        // let the next request retry instead of caching a rejected promise
        cache.promise = null
        throw err
      })
  }

  cache.conn = await cache.promise
  return cache.conn
}
