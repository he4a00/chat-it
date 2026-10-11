import { and, asc, eq, inArray } from "drizzle-orm"
import type { UIMessage } from "ai"
import { db, chats, messages as dbMessages, widgetStates } from "@/lib/db"

const WIDGET_TOOL_NAMES: Record<string, string> = {
  quiz: "createQuiz",
  flashcard: "createFlashcardDeck",
  math_problem: "createMathProblem",
  quick_check: "createQuickCheck",
}

/**
 * Reconstructs the AI SDK `UIMessage[]` conversation stream for a chat.
 *
 * Ownership is enforced here: callers receive `[]` unless the chat belongs to
 * `userId`. Text parts come from `messages.content`, tool parts from
 * `messages.toolInvocations`, and any persisted widget submission is merged back
 * into the tool part's `output` so generative-UI widgets restore their state.
 */
export async function loadUIMessages(chatId: string, userId: string): Promise<UIMessage[]> {
  const [chat] = await db
    .select({ id: chats.id })
    .from(chats)
    .where(and(eq(chats.id, chatId), eq(chats.userId, userId)))
    .limit(1)

  if (!chat) return []

  const rows = await db
    .select()
    .from(dbMessages)
    .where(eq(dbMessages.chatId, chatId))
    .orderBy(asc(dbMessages.createdAt))

  if (rows.length === 0) return []

  const widgets = await db
    .select()
    .from(widgetStates)
    .where(
      inArray(
        widgetStates.messageId,
        rows.map((r) => r.id),
      ),
    )

  const widgetByMessage = new Map<string, (typeof widgets)[number]>()
  for (const widget of widgets) {
    widgetByMessage.set(widget.messageId, widget)
  }

  return rows.map((row) => {
    const parts: UIMessage["parts"] = []
    const relatedWidget = widgetByMessage.get(row.id)

    if (row.content) {
      parts.push({ type: "text", text: row.content })
    }

    if (Array.isArray(row.toolInvocations) && row.toolInvocations.length > 0) {
      for (const rawPart of row.toolInvocations as Array<Record<string, unknown>>) {
        const part = { ...rawPart }

        if (relatedWidget) {
          const rawInput =
            part.input && typeof part.input === "object"
              ? (part.input as Record<string, unknown>)
              : {}

          part.output = {
            ...rawInput,
            userSubmission: relatedWidget.userSubmission,
            isCompleted: relatedWidget.isCompleted,
            score: relatedWidget.score,
          }
        }

        parts.push(part as unknown as UIMessage["parts"][number])
      }
    } else if (relatedWidget) {
      const toolName = WIDGET_TOOL_NAMES[relatedWidget.widgetType] ?? "createQuiz"
      const widgetPayload =
        relatedWidget.payload && typeof relatedWidget.payload === "object"
          ? (relatedWidget.payload as Record<string, unknown>)
          : {}

      parts.push({
        type: `tool-${toolName}`,
        toolCallId: `restored-${relatedWidget.id}`,
        input: relatedWidget.payload,
        output: {
          ...widgetPayload,
          userSubmission: relatedWidget.userSubmission,
          isCompleted: relatedWidget.isCompleted,
          score: relatedWidget.score,
        },
        state: "output-available",
      } as unknown as UIMessage["parts"][number])
    }

    return {
      id: row.id,
      role: row.role as "user" | "assistant" | "system",
      parts: parts.length > 0 ? parts : [{ type: "text", text: row.content }],
    }
  })
}
