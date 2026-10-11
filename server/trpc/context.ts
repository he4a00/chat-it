import { cache } from "react"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"

/**
 * Creates the tRPC context for incoming requests.
 *
 * Auth is read via Clerk's `auth()` (backed by `clerkMiddleware()` in `proxy.ts`),
 * so no bearer parsing or fallbacks are needed. `cache()` deduplicates execution
 * during a single render pass in RSC. Note: this is the hot path — it does NOT
 * touch the users table (lazy sync happens where a foreign key is required).
 */
export const createTRPCContext = cache(async () => {
  const { userId } = await auth()

  return {
    db,
    userId,
  }
})

export type Context = Awaited<ReturnType<typeof createTRPCContext>>
