import { z } from "zod"
import { and, eq } from "drizzle-orm"
import { router, protectedProcedure } from "../trpc"
import { chats, messages as dbMessages, widgetStates } from "@/lib/db"
import { recordPractice } from "@/lib/learner/record"

/**
 * A single graded item from a widget (quiz question, flashcard, math answer,
 * quick check). `outcome` maps directly onto the `practice_attempts` log.
 */
const practiceItemSchema = z.object({
  itemId: z.string().optional().nullable(),
  outcome: z.enum(["correct", "incorrect", "mastered", "review", "skipped"]),
  hintUsed: z.boolean().optional(),
  difficulty: z.string().optional().nullable(),
})

export const widgetRouter = router({
  /**
   * Persist a learner's interaction with a Generative UI widget (Quiz, Flashcard,
   * Math Problem, Quick Check). Upserts the `widget_states` row for the parent
   * message, and records per-item results into the immutable attempt log — which
   * drives topic mastery, streaks, and spaced review.
   */
  submitState: protectedProcedure
    .input(
      z.object({
        messageId: z.string().optional().nullable(),
        widgetType: z.string(),
        topic: z.string().optional().nullable(),
        subject: z.string().optional().nullable(),
        payload: z.record(z.string(), z.unknown()).optional().default({}),
        userSubmission: z.record(z.string(), z.unknown()).optional().default({}),
        items: z.array(practiceItemSchema).optional(),
        timeSpentMs: z.number().nullable().optional(),
        isCompleted: z.boolean().default(true),
        score: z.number().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const {
        messageId,
        widgetType,
        topic,
        subject,
        payload,
        userSubmission,
        items,
        timeSpentMs,
        isCompleted,
        score,
      } = input

      if (!messageId) return { success: false }

      // FK safety: only persist once the parent message row exists (the stream
      // may not have finished persisting when the learner answers quickly). The
      // chat id is also needed for the attempt log.
      const [parent] = await ctx.db
        .select({ id: dbMessages.id, chatId: dbMessages.chatId })
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

      // Record graded items into the attempt log (best-effort: a recording
      // failure must not fail the widget state write).
      if (items && items.length > 0 && topic) {
        try {
          await recordPractice({
            userId: ctx.userId,
            chatId: parent.chatId,
            messageId,
            widgetType,
            subject: subject ?? null,
            topic,
            items: items.map((item) => ({
              itemId: item.itemId ?? undefined,
              outcome: item.outcome,
              hintUsed: item.hintUsed,
              difficulty: item.difficulty ?? undefined,
            })),
            timeSpentMs: timeSpentMs ?? null,
          })
        } catch (error) {
          console.error("[widget.submitState] Failed to record practice:", error)
        }
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
