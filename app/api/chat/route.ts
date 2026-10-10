import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  isToolUIPart,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai"
import { google } from "@ai-sdk/google"
import { auth } from "@clerk/nextjs/server"
import { eq } from "drizzle-orm"
import { db, chats, messages as dbMessages, widgetStates, users } from "@/lib/db"
import { SHAWKY_BASE_SYSTEM_PROMPT } from "@/lib/ai/prompts"
import { tutoringTools } from "@/lib/ai/tools"
import { buildLearnerContext, saveLearnerNote } from "@/lib/ai/context"

export const maxDuration = 45

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    const body = await req.json()
    const clientMessages: UIMessage[] = body.messages || []
    const chatId: string = body.chatId || body.id || crypto.randomUUID()

    // 1. Ensure user row exists in database if authenticated
    if (userId) {
      await db
        .insert(users)
        .values({
          id: userId,
          email: `${userId}@shawky.learner`,
          fullName: "Student",
        })
        .onConflictDoNothing()
    }

    // 2. Ensure chat session exists in database
    if (userId && chatId) {
      const existing = await db.select().from(chats).where(eq(chats.id, chatId)).limit(1)
      if (existing.length === 0) {
        let title = "New STEM Practice"
        const firstUserMsg = clientMessages.find((m) => m.role === "user")
        if (firstUserMsg) {
          const textPart = firstUserMsg.parts?.find((p) => p.type === "text")
          if (textPart && "text" in textPart && typeof textPart.text === "string") {
            title = textPart.text.trim().slice(0, 40) + (textPart.text.length > 40 ? "..." : "")
          }
        }
        await db
          .insert(chats)
          .values({
            id: chatId,
            userId,
            title,
            subject: "Math",
          })
          .onConflictDoNothing()
      } else {
        await db.update(chats).set({ updatedAt: new Date() }).where(eq(chats.id, chatId))
      }
    }

    // 3. Assemble dynamic instructions with Learner Memory Engine
    const dynamicLearnerContext = await buildLearnerContext(userId)
    const instructions = `${SHAWKY_BASE_SYSTEM_PROMPT}\n\n${dynamicLearnerContext}`

    // 4. Verify Google Gemini API Key
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error:
            "Google Gemini API Key is missing. Please set GOOGLE_GENERATIVE_AI_API_KEY in .env.local to enable Shawky AI tutoring.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // 5. Invoke streamText with Gemini 2.0 Flash and tutoringTools
    const result = streamText({
      model: google("gemini-2.0-flash"),
      instructions,
      messages: await convertToModelMessages(clientMessages),
      tools: tutoringTools,
      stopWhen: isStepCount(5),
    })

    // 6. Return UI message stream response and persist conversation to Neon on finish
    return createUIMessageStreamResponse({
      stream: toUIMessageStream({
        stream: result.stream,
        originalMessages: clientMessages,
        onEnd: async ({ messages: finalMessages }) => {
          if (!userId || !chatId) return

          try {
            const lastAssistant = finalMessages.filter((m) => m.role === "assistant").pop()
            const lastUser = finalMessages.filter((m) => m.role === "user").pop()

            // Persist incoming user message
            if (lastUser) {
              const userText =
                lastUser.parts
                  ?.filter((p) => p.type === "text")
                  .map((p) => ("text" in p ? p.text : ""))
                  .join("") || ""

              await db
                .insert(dbMessages)
                .values({
                  id: lastUser.id,
                  chatId,
                  role: "user",
                  content: userText,
                })
                .onConflictDoNothing()
            }

            // Persist outgoing assistant message & widgets
            if (lastAssistant) {
              const assistantText =
                lastAssistant.parts
                  ?.filter((p) => p.type === "text")
                  .map((p) => ("text" in p ? p.text : ""))
                  .join("") || ""

              const toolParts = lastAssistant.parts?.filter((p) => isToolUIPart(p)) || []

              await db
                .insert(dbMessages)
                .values({
                  id: lastAssistant.id,
                  chatId,
                  role: "assistant",
                  content: assistantText,
                  toolInvocations: toolParts,
                })
                .onConflictDoNothing()

              // Save widget states & learner notes
              for (const part of toolParts) {
                if (isToolUIPart(part)) {
                  const partAny = part as {
                    type: string
                    toolCallId?: string
                    input?: Record<string, unknown>
                  }
                  const toolName = part.type.replace(/^tool-/, "")
                  const input = partAny.input

                  if (
                    toolName === "updateLearnerNotes" &&
                    input &&
                    typeof input.topic === "string" &&
                    typeof input.observation === "string"
                  ) {
                    await saveLearnerNote(
                      userId,
                      input.topic,
                      input.observation,
                      typeof input.recommendation === "string" ? input.recommendation : undefined,
                    )
                  } else if (
                    ["createQuiz", "createFlashcardDeck", "createMathProblem", "createQuickCheck"].includes(
                      toolName,
                    ) &&
                    input
                  ) {
                    const widgetTypeMap: Record<string, string> = {
                      createQuiz: "quiz",
                      createFlashcardDeck: "flashcard",
                      createMathProblem: "math_problem",
                      createQuickCheck: "quick_check",
                    }

                    await db
                      .insert(widgetStates)
                      .values({
                        id: partAny.toolCallId || crypto.randomUUID(),
                        messageId: lastAssistant.id,
                        widgetType: widgetTypeMap[toolName] || "quiz",
                        payload: input,
                        isCompleted: false,
                      })
                      .onConflictDoNothing()
                  }
                }
              }
            }
          } catch (persistErr) {
            console.error("Error persisting chat messages in Neon:", persistErr)
          }
        },
      }),
    })
  } catch (error) {
    console.error("Chat API error:", error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error occurred.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
