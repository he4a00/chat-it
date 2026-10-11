import "server-only"
import { createCallerFactory } from "@/server/trpc/trpc"
import { appRouter } from "@/server/trpc/routers/_app"
import { createTRPCContext } from "@/server/trpc/context"

const createCaller = createCallerFactory(appRouter)

/**
 * Returns a typed tRPC caller for React Server Components (RSC).
 * Executes procedures directly in-process with zero network overhead.
 */
export const getTRPCApi = async () => {
  const context = await createTRPCContext()
  return createCaller(context)
}
