import "server-only"
import { auth } from "@clerk/nextjs/server"
import { ensureUserRow } from "./ensure-user"

/**
 * Requires an authenticated Clerk user and guarantees the local `users` row
 * exists. Returns the Clerk user id.
 *
 * `auth.protect()` redirects signed-out visitors to sign-in; `ensureUserRow`
 * then lazily syncs the profile from Clerk on first sight (so a freshly
 * signed-up user appears in Neon immediately, without a webhook).
 */
export async function requireUser(): Promise<string> {
  const { userId } = await auth.protect()
  await ensureUserRow(userId)
  return userId
}
