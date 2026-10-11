import {
  convertToModelMessages,
  createIdGenerator,
  createUIMessageStreamResponse,
  getToolName,
  isStepCount,
  isToolUIPart,
  streamText,
  toUIMessageStream,
  validateUIMessages,
  type UIMessage,
} from "ai"
import { google } from "@ai-sdk/google"
import { auth } from "@clerk/nextjs/server"
import { and, eq } from "drizzle-orm"
import { db, chats, messages as dbMessages, widgetStates, learnerMemoryNotes } from "@/lib/db"
import { SHAWKY_BASE_SYSTEM_PROMPT } from "@/lib/ai/prompts"
import { tutoringTools } from "@/lib/ai/tools"
import { loadUIMessages } from "@/lib/ai/load-messages"
import { resolveTopic } from "@/lib/learner/resolve-topic"
import { NOTE_TYPES } from "@/lib/learner/config"
import { ensureUserRow } from "@/lib/auth/ensure-user"
import { deriveSessionTitle } from "@/lib/session-utils"

export const maxDuration = 45

/** Pinned, currently-available GA model — override with GOOGLE_GENERATIVE_AI_MODEL. Avoid `-latest` aliases. */
const MODEL_ID = process.env.GOOGLE_GENERATIVE_AI_MODEL ?? "gemini-3.8-flash"

const WIDGET_TYPE_BY_TOOL: Record<string, string> = {
  createQuiz: "quiz",
  createFlashcardDeck: "flashcard",
  createMathProblem: "math_problem",
  createQuickCheck: "quick_check",
}

/** Extracts the plain-text content from a UI message (handles both `content` and `parts`). */
function extractText(message: UIMessage): string {
  const candidate = message as {
    content?: string
    parts?: Array<{ type?: string; text?: string }>
  }
  if (typeof candidate.content === "string") return candidate.content
  if (Array.isArray(candidate.parts)) {
    return candidate.parts
      .filter((part) => part.type === "text")
      .map((part) => part.text ?? "")
      .join("")
  }
  return ""
}

export async function POST(req: Request) {
  const { isAuthenticated, userId } = await auth()
  if (!isAuthenticated || !userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GEMINI_API_KEY
  if (!apiKey) {
    return Response.json(
      {
        error:
          "Google Gemini API key is missing. Set GOOGLE_GENERATIVE_AI_API_KEY in .env.local to enable Shawky AI tutoring.",
      },
      { status: 400 },
    )
  }

  const body = await req.json()
  const message = body.message as UIMessage
  const chatId: string = body.id ?? crypto.randomUUID()

  await ensureUserRow(userId)

  // Ensure the chat row exists (idempotent with the client's optimistic create).
  const [existingChat] = await db
    .select({ id: chats.id })
    .from(chats)
    .where(and(eq(chats.id, chatId), eq(chats.userId, userId)))
    .limit(1)

  if (!existingChat) {
    await db
      .insert(chats)
      .values({
        id: chatId,
        userId,
        title: deriveSessionTitle(extractText(message)) || "New STEM Practice",
        subject: "Math",
      })
      .onConflictDoNothing()
  } else {
    await db.update(chats).set({ updatedAt: new Date() }).where(eq(chats.id, chatId))
  }

  // Load persisted history, append the incoming user message, and validate.
  const history = await loadUIMessages(chatId, userId)
  const inputMessages = [...history, message]

  let validatedMessages: UIMessage[]
  try {
    validatedMessages = await validateUIMessages({ messages: inputMessages, tools: tutoringTools })
  } catch (error) {
    console.warn("[api/chat] validateUIMessages failed, using raw messages:", error)
    validatedMessages = inputMessages
  }

  const result = streamText({
    model: google(MODEL_ID),
    instructions: SHAWKY_BASE_SYSTEM_PROMPT,
    messages: await convertToModelMessages(validatedMessages),
    tools: tutoringTools,
    stopWhen: isStepCount(5),
  })

  // Keep generating + persisting even if the client disconnects mid-stream.
  result.consumeStream()

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      originalMessages: validatedMessages,
      generateMessageId: createIdGenerator({ prefix: "msg", size: 16 }),
      onEnd: async ({ messages: finalMessages }) => {
        await persistTurn(chatId, finalMessages, userId)
      },
    }),
  })
}

/**
 * Persists every user/assistant message of the turn (idempotent via
 * `onConflictDoNothing`), a widget-state seed row per generated widget, and any
 * qualitative learner notes — all keyed by ids so re-processing history is a no-op.
 */
async function persistTurn(chatId: string, messages: UIMessage[], userId: string) {
  try {
    for (const message of messages) {
      if (message.role !== "user" && message.role !== "assistant") continue

      const messageId = message.id?.trim() ? message.id : crypto.randomUUID()
      const toolParts =
        message.role === "assistant"
          ? (message.parts?.filter((part) => isToolUIPart(part)) ?? [])
          : []

      await db
        .insert(dbMessages)
        .values({
          id: messageId,
          chatId,
          role: message.role,
          content: extractText(message),
          toolInvocations: toolParts.length > 0 ? toolParts : null,
        })
        .onConflictDoNothing()

      for (const part of toolParts) {
        if (!isToolUIPart(part)) continue

        const widgetType = WIDGET_TYPE_BY_TOOL[getToolName(part)]
        const input = (part as { input?: unknown }).input
        const toolCallId = (part as { toolCallId?: string }).toolCallId

        if (widgetType && input && typeof input === "object") {
          await db
            .insert(widgetStates)
            .values({
              id: toolCallId ?? crypto.randomUUID(),
              messageId,
              widgetType,
              payload: input,
              isCompleted: false,
            })
            .onConflictDoNothing()
        }

        // Persist qualitative learner notes (idempotent by toolCallId, so
        // replaying historical messages never duplicates a note).
        if (getToolName(part) === "updateLearnerNotes" && input && typeof input === "object") {
          const args = input as Record<string, unknown>
          const observation = typeof args.observation === "string" ? args.observation.trim() : ""

          if (observation) {
            const topicLabel =
              typeof args.topic === "string" && args.topic.trim() ? args.topic.trim() : "General"
            const noteType =
              typeof args.type === "string" && (NOTE_TYPES as string[]).includes(args.type)
                ? args.type
                : "observation"
            const resolved = await resolveTopic(
              typeof args.subject === "string" ? args.subject : null,
              topicLabel,
            )

            await db
              .insert(learnerMemoryNotes)
              .values({
                id: toolCallId ?? crypto.randomUUID(),
                userId,
                topic: topicLabel,
                topicId: resolved.topicId,
                type: noteType,
                observation,
                recommendation:
                  typeof args.recommendation === "string" ? args.recommendation : null,
                confidence: typeof args.confidence === "number" ? args.confidence : null,
                sourceMessageId: messageId,
                status: "active",
              })
              .onConflictDoNothing()
          }
        }
      }
    }
  } catch (error) {
    console.error("[api/chat] Failed to persist turn:", error)
  }
}
