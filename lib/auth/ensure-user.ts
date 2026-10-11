import { clerkClient } from "@clerk/nextjs/server"
import { eq } from "drizzle-orm"
import { db, users } from "@/lib/db"

/**
 * Guarantees a `users` row exists for an authenticated Clerk user.
 *
 * Webhooks are the canonical sync path, but they are asynchronous and may not
 * be configured locally. This lazy fallback is intentionally *not* called from
 * the tRPC request context (the hot path) — only from the webhook, the chat
 * route, and session creation, i.e. where a `users` foreign key is required.
 *
 * The lookup is keyed by primary key, so the Clerk Backend API is only called
 * when the local row is actually missing. Idempotent and never throws — a sync
 * failure must not break the request.
 */
export async function ensureUserRow(userId: string): Promise<void> {
  try {
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (existing.length > 0) return

    let email = `${userId}@shawky.learner`
    let fullName: string | null = null
    let imageUrl: string | null = null

    try {
      const client = await clerkClient()
      const user = await client.users.getUser(userId)
      email = user.emailAddresses[0]?.emailAddress ?? email
      fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || null
      imageUrl = user.imageUrl ?? null
    } catch (error) {
      console.error("[ensureUserRow] Failed to read Clerk user, using fallback identity:", error)
    }

    await db
      .insert(users)
      .values({ id: userId, email, fullName, imageUrl })
      .onConflictDoNothing()
  } catch (error) {
    console.error("[ensureUserRow] Failed to sync user:", error)
  }
}
