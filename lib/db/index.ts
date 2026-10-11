import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import * as schema from "./schema"

/**
 * Neon Serverless Database Client
 * Uses HTTP transport via @neondatabase/serverless for fast, connectionless
 * serverless queries with automatic scaling and zero connection leaks.
 */
const connectionString = process.env.DATABASE_URL ?? ""

if (!connectionString) {
  console.warn("[db] DATABASE_URL is not set — database queries will fail.")
}

const sql = neon(connectionString)

export const db = drizzle(sql, { schema })

export * from "./schema"
