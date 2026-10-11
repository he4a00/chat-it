import "server-only"
import { auth } from "@clerk/nextjs/server"

/**
 * Returns the authenticated Clerk user id, or null when signed out.
 *
 * Route Handlers, Server Components, and Server Functions that *require* auth
 * should call `auth.protect()` themselves (which redirects/throws) before
 * relying on this helper.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const { userId } = await auth()
  return userId
}
