import { z } from "zod"
import { and, eq } from "drizzle-orm"
import { router, protectedProcedure } from "../trpc"
import { chats, messages as dbMessages, widgetStates } from "@/lib/db"

export const widgetRouter = router({
  /**
   * Persist a learner's interaction with a Generative UI widget (Quiz, Flashcard,
   * Math Problem, Quick Check). Upserts the single `widget_states` row for the
   * parent message.
   *
   * NOTE (Phase 8): quantitative `topic_mastery` aggregation is not wired yet.
   */
  submitState: protectedProcedure
    .input(
      z.object({
        messageId: z.string().optional().nullable(),
        widgetType: z.string(),
        topic: z.string().optional().nullable(),
        payload: z.record(z.string(), z.unknown()).optional().default({}),
        userSubmission: z.record(z.string(), z.unknown()).optional().default({}),
        isCompleted: z.boolean().default(true),
        score: z.number().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { messageId, widgetType, payload, userSubmission, isCompleted, score } = input

      if (!messageId) return { success: false }

      // FK safety: only persist once the parent message row exists (the stream
      // may not have finished persisting when the learner answers quickly).
      const [parent] = await ctx.db
        .select({ id: dbMessages.id })
        .from(dbMessages)
        .where(eq(dbMessages.id, messageId))
        .limit(1)

      if (!parent) return { success: false }

      const roundedScore = typeof score === "number" ? Math.round(score) : null
      const submittedAt = new Date()

      const [existing] = await ctx.db
        .select({ id: widgetStates.id })
        .from(widgetStates)
        .where(eq(widgetStates.messageId, messageId))
        .limit(1)

      if (existing) {
        await ctx.db
          .update(widgetStates)
          .set({
            widgetType,
            payload: payload ?? {},
            userSubmission: userSubmission ?? {},
            isCompleted,
            score: roundedScore,
            submittedAt,
          })
          .where(eq(widgetStates.id, existing.id))
      } else {
        await ctx.db.insert(widgetStates).values({
          messageId,
          widgetType,
          payload: payload ?? {},
          userSubmission: userSubmission ?? {},
          isCompleted,
          score: roundedScore,
          submittedAt,
        })
      }

      return { success: true }
    }),

  /** Retrieve the persisted state of a widget by messageId (ownership-checked). */
  getState: protectedProcedure
    .input(z.object({ messageId: z.string() }))
    .query(async ({ ctx, input }) => {
      const [record] = await ctx.db
        .select({ widget: widgetStates })
        .from(widgetStates)
        .innerJoin(dbMessages, eq(widgetStates.messageId, dbMessages.id))
        .innerJoin(chats, eq(dbMessages.chatId, chats.id))
        .where(and(eq(widgetStates.messageId, input.messageId), eq(chats.userId, ctx.userId)))
        .limit(1)

      return record?.widget ?? null
    }),
})
