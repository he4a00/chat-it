import { auth } from "@clerk/nextjs/server"
import { eq, and } from "drizzle-orm"
import { db, widgetStates, topicMastery, messages } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    const body = await req.json()
    const {
      messageId,
      widgetType,
      topic,
      payload,
      userSubmission,
      isCompleted = true,
      score,
    } = body

    if (!widgetType) {
      return new Response(JSON.stringify({ error: "Missing widgetType" }), { status: 400 })
    }

    // 1. Verify messageId exists in DB before inserting foreign key
    let validMessageId: string | null = null
    if (messageId) {
      const msg = await db.select().from(messages).where(eq(messages.id, messageId)).limit(1)
      if (msg.length > 0) {
        validMessageId = messageId
      }
    }

    // 2. Persist widget state in Neon if message row exists
    if (validMessageId) {
      await db
        .insert(widgetStates)
        .values({
          messageId: validMessageId,
          widgetType,
          payload: payload || {},
          userSubmission: userSubmission || {},
          isCompleted,
          score: typeof score === "number" ? Math.round(score) : null,
          submittedAt: new Date(),
        })
        .onConflictDoNothing()
    }

    // 3. Update quantitative topic mastery if user is authenticated and topic is provided
    if (userId && topic && typeof topic === "string") {
      const incTotal = typeof userSubmission?.totalQuestions === "number" ? Math.max(1, userSubmission.totalQuestions) : 1
      const incCorrect = typeof userSubmission?.correctCount === "number"
        ? Math.max(0, userSubmission.correctCount)
        : (userSubmission?.isCorrect === true || (typeof score === "number" && score >= 70) ? 1 : 0)

      const existing = await db
        .select()
        .from(topicMastery)
        .where(and(eq(topicMastery.userId, userId), eq(topicMastery.topic, topic)))
        .limit(1)

      if (existing.length > 0) {
        const row = existing[0]
        const newTotal = row.totalProblems + incTotal
        const newCorrect = row.correctProblems + incCorrect
        const newMastery = Math.min(1.0, Math.max(0.0, Number((newCorrect / newTotal).toFixed(2))))

        await db
          .update(topicMastery)
          .set({
            totalProblems: newTotal,
            correctProblems: newCorrect,
            masteryScore: newMastery,
            lastPracticedAt: new Date(),
          })
          .where(eq(topicMastery.id, row.id))
      } else {
        const initialMastery = Math.min(1.0, Math.max(0.0, Number((incCorrect / incTotal).toFixed(2))))
        await db.insert(topicMastery).values({
          userId,
          topic,
          totalProblems: incTotal,
          correctProblems: incCorrect,
          masteryScore: initialMastery,
          lastPracticedAt: new Date(),
        })
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    })
  } catch (err) {
    console.error("Failed to update widget state:", err)
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
