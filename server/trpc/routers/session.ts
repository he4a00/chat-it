import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { and, desc, eq } from "drizzle-orm"
import type { UIMessage } from "ai"
import { router, protectedProcedure } from "../trpc"
import { chats, messages as dbMessages } from "@/lib/db"
import { computeSessionCategory, formatSessionTimestamp } from "@/lib/session-utils"
import type { ChatSession, SessionSubject } from "@/types/session"
import { ensureUserRow } from "@/lib/auth/ensure-user"
import { loadUIMessages } from "@/lib/ai/load-messages"

type ChatRow = typeof chats.$inferSelect

function toChatSession(chat: ChatRow): ChatSession {
  return {
    id: chat.id,
    title: chat.title,
    timestamp: formatSessionTimestamp(chat.updatedAt),
    category: computeSessionCategory(chat.updatedAt),
    subject: (chat.subject as SessionSubject) || "Math",
    updatedAt: chat.updatedAt.toISOString(),
  }
}

export const sessionRouter = router({
  /** List the current user's chat sessions, newest first. */
  list: protectedProcedure.query(async ({ ctx }): Promise<ChatSession[]> => {
    const rows = await ctx.db
      .select()
      .from(chats)
      .where(eq(chats.userId, ctx.userId))
      .orderBy(desc(chats.updatedAt))

    return rows.map(toChatSession)
  }),

  /** Get a single owned session. */
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }): Promise<ChatSession> => {
      const [chat] = await ctx.db
        .select()
        .from(chats)
        .where(and(eq(chats.id, input.id), eq(chats.userId, ctx.userId)))
        .limit(1)

      if (!chat) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" })
      }

      return toChatSession(chat)
    }),

  /** Create a session (idempotent on the client-supplied id). */
  create: protectedProcedure
    .input(
      z.object({
        id: z.string().optional(),
        title: z.string().optional(),
        subject: z.string().default("Math"),
      }),
    )
    .mutation(async ({ ctx, input }): Promise<ChatSession> => {
      await ensureUserRow(ctx.userId)

      const newId = input.id ?? crypto.randomUUID()
      const title = input.title?.trim() || "New STEM Practice"

      const [created] = await ctx.db
        .insert(chats)
        .values({ id: newId, userId: ctx.userId, title, subject: input.subject })
        .onConflictDoNothing()
        .returning()

      if (created) return toChatSession(created)

      const [existing] = await ctx.db
        .select()
        .from(chats)
        .where(and(eq(chats.id, newId), eq(chats.userId, ctx.userId)))
        .limit(1)

      if (!existing) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create session" })
      }

      return toChatSession(existing)
    }),

  /** Rename an owned session. */
  rename: protectedProcedure
    .input(z.object({ chatId: z.string(), title: z.string().min(1, "Title cannot be empty") }))
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.db
        .update(chats)
        .set({ title: input.title.trim(), updatedAt: new Date() })
        .where(and(eq(chats.id, input.chatId), eq(chats.userId, ctx.userId)))
        .returning({ id: chats.id })

      if (updated.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" })
      }

      return { success: true }
    }),

  /** Delete an owned session (cascades to messages and widget states). */
  delete: protectedProcedure
    .input(z.object({ chatId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const deleted = await ctx.db
        .delete(chats)
        .where(and(eq(chats.id, input.chatId), eq(chats.userId, ctx.userId)))
        .returning({ id: chats.id })

      if (deleted.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" })
      }

      return { success: true }
    }),

  /** Duplicate an owned chat, copying its messages into a fresh session. */
  duplicate: protectedProcedure
    .input(z.object({ chatId: z.string() }))
    .mutation(async ({ ctx, input }): Promise<ChatSession> => {
      const [source] = await ctx.db
        .select()
        .from(chats)
        .where(and(eq(chats.id, input.chatId), eq(chats.userId, ctx.userId)))
        .limit(1)

      if (!source) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" })
      }

      const newId = crypto.randomUUID()
      const [created] = await ctx.db
        .insert(chats)
        .values({
          id: newId,
          userId: ctx.userId,
          title: `${source.title} (copy)`,
          subject: source.subject,
        })
        .returning()

      const sourceMessages = await ctx.db
        .select()
        .from(dbMessages)
        .where(eq(dbMessages.chatId, input.chatId))

      if (sourceMessages.length > 0) {
        await ctx.db.insert(dbMessages).values(
          sourceMessages.map((message) => ({
            id: crypto.randomUUID(),
            chatId: newId,
            role: message.role,
            content: message.content,
            toolInvocations: message.toolInvocations,
          })),
        )
      }

      return toChatSession(created)
    }),

  /** Restore the full conversation stream (with widget state) for an owned chat. */
  getMessages: protectedProcedure
    .input(z.object({ chatId: z.string() }))
    .query(async ({ ctx, input }): Promise<UIMessage[]> => {
      return loadUIMessages(input.chatId, ctx.userId)
    }),
})
