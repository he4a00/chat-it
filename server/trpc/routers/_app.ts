import { router } from "../trpc"
import { sessionRouter } from "./session"
import { widgetRouter } from "./widget"
import { learnerRouter } from "./learner"

/**
 * Root application router combining domain-specific sub-routers.
 */
export const appRouter = router({
  session: sessionRouter,
  widget: widgetRouter,
  learner: learnerRouter,
})

export type AppRouter = typeof appRouter
