import { verifyWebhook } from "@clerk/nextjs/webhooks"
import type { NextRequest } from "next/server"
import { eq } from "drizzle-orm"
import { db, users } from "@/lib/db"

export const dynamic = "force-dynamic"

/**
 * Clerk webhook endpoint — keeps the local `users` table in sync with Clerk.
 *
 * Deliveries carry no user session, so the route is intentionally public and
 * `verifyWebhook()` (Svix signature) is the only check it needs. Do NOT wrap
 * this path in `auth.protect()`.
 *
 * Requires `CLERK_WEBHOOK_SIGNING_SECRET`. Local tunnel:
 *   clerk webhooks listen --token "$(clerk webhooks token)" --forward-to http://localhost:3000/api/webhooks/clerk
 */
export async function POST(req: NextRequest) {
  let evt
  try {
    evt = await verifyWebhook(req)
  } catch (error) {
    console.error("[clerk-webhook] Verification failed:", error)
    return new Response("Verification failed", { status: 400 })
  }

  try {
    switch (evt.type) {
      case "user.created":
      case "user.updated": {
        const { id, email_addresses, first_name, last_name, image_url } = evt.data
        const email = email_addresses?.[0]?.email_address ?? `${id}@shawky.learner`
        const fullName = [first_name, last_name].filter(Boolean).join(" ") || null
        const imageUrl = image_url ?? null

        await db
          .insert(users)
          .values({ id, email, fullName, imageUrl })
          .onConflictDoUpdate({
            target: users.id,
            set: { email, fullName, imageUrl },
          })
        break
      }
      case "user.deleted": {
        const { id } = evt.data
        if (id) {
          await db.delete(users).where(eq(users.id, id))
        }
        break
      }
      default:
        break
    }
  } catch (error) {
    console.error("[clerk-webhook] Handler error:", error)
    return new Response("Handler error", { status: 500 })
  }

  return new Response("OK", { status: 200 })
}
