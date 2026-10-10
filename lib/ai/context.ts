import { eq, and, desc, asc } from "drizzle-orm"
import { db, learnerProfiles, topicMastery, learnerMemoryNotes } from "@/lib/db"

/**
 * Builds the dynamic learner context block injected into Shawky's instructions.
 * Incorporates deterministic accuracy metrics (topic_mastery) and qualitative AI notes (learner_memory_notes).
 */
export async function buildLearnerContext(userId?: string | null): Promise<string> {
  if (!userId) {
    return `
=== ACTIVE LEARNER CONTEXT ===
Subject: Mathematics & STEM
Skill Level: Intermediate
Learning Goal: General problem-solving mastery & conceptual understanding
==============================
`.trim()
  }

  try {
    // 1. Fetch learner profile
    const profiles = await db
      .select()
      .from(learnerProfiles)
      .where(eq(learnerProfiles.userId, userId))
      .limit(1)

    const profile = profiles[0]

    // 2. Fetch topic mastery records
    const masteryList = await db
      .select()
      .from(topicMastery)
      .where(eq(topicMastery.userId, userId))
      .orderBy(asc(topicMastery.masteryScore))
      .limit(10)

    const weakTopics = masteryList
      .filter((m) => m.masteryScore < 0.6)
      .map((m) => `${m.topic} (${Math.round(m.masteryScore * 100)}% accuracy, ${m.totalProblems} problems)`)

    const strongTopics = masteryList
      .filter((m) => m.masteryScore >= 0.8)
      .map((m) => `${m.topic} (${Math.round(m.masteryScore * 100)}% accuracy)`)

    // 3. Fetch latest qualitative memory observations
    const recentNotes = await db
      .select()
      .from(learnerMemoryNotes)
      .where(eq(learnerMemoryNotes.userId, userId))
      .orderBy(desc(learnerMemoryNotes.createdAt))
      .limit(5)

    const subject = profile?.subject || "Mathematics"
    const skillLevel = profile?.skillLevel || "Intermediate"
    const goal = profile?.learningGoal || "Deepen conceptual intuition & problem-solving skills"

    const notesSummary =
      recentNotes.length > 0
        ? recentNotes
            .map(
              (n) =>
                `• [${n.topic}]: ${n.observation}${n.recommendation ? ` (Recommended approach: ${n.recommendation})` : ""}`,
            )
            .join("\n")
        : "• No qualitative learning patterns recorded yet."

    return `
=== ACTIVE LEARNER CONTEXT ===
Active Subject: ${subject}
Skill Level: ${skillLevel}
Learning Goal: ${goal}

Current Growth Areas (Needs Reinforcement):
${weakTopics.length > 0 ? weakTopics.map((t) => `• ${t}`).join("\n") : "• None flagged yet — evaluate through guided problems."}

Mastered Concepts:
${strongTopics.length > 0 ? strongTopics.map((t) => `• ${t}`).join("\n") : "• Initial diagnostic phase."}

Pedagogical Memory & Cognitive Observations:
${notesSummary}
==============================
`.trim()
  } catch (error) {
    console.error("Failed to build learner context:", error)
    return `
=== ACTIVE LEARNER CONTEXT ===
Subject: Mathematics & STEM
Skill Level: Intermediate
Note: Defaulted due to transient memory retrieval error.
==============================
`.trim()
  }
}

/**
 * Saves a qualitative observation recorded by the AI Socratic agent.
 */
export async function saveLearnerNote(
  userId: string,
  topic: string,
  observation: string,
  recommendation?: string,
): Promise<void> {
  try {
    await db.insert(learnerMemoryNotes).values({
      userId,
      topic,
      observation,
      recommendation: recommendation || null,
    })
  } catch (error) {
    console.error("Error saving learner note:", error)
  }
}

/**
 * Updates deterministic topic mastery after widget or problem submission.
 */
export async function updateTopicMastery(
  userId: string,
  topic: string,
  isCorrect: boolean,
): Promise<void> {
  try {
    const existing = await db
      .select()
      .from(topicMastery)
      .where(and(eq(topicMastery.userId, userId), eq(topicMastery.topic, topic)))
      .limit(1)

    const match = existing[0]

    if (match) {
      const newTotal = match.totalProblems + 1
      const newCorrect = match.correctProblems + (isCorrect ? 1 : 0)
      const newScore = newCorrect / newTotal

      await db
        .update(topicMastery)
        .set({
          totalProblems: newTotal,
          correctProblems: newCorrect,
          masteryScore: newScore,
          lastPracticedAt: new Date(),
        })
        .where(eq(topicMastery.id, match.id))
    } else {
      await db.insert(topicMastery).values({
        userId,
        topic,
        totalProblems: 1,
        correctProblems: isCorrect ? 1 : 0,
        masteryScore: isCorrect ? 1.0 : 0.0,
        lastPracticedAt: new Date(),
      })
    }
  } catch (error) {
    console.error("Error updating topic mastery:", error)
  }
}
