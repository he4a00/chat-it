import "server-only"
import { and, asc, desc, eq } from "drizzle-orm"
import { db, learnerMemoryNotes, learnerProfiles, learnerStats, topicMastery } from "@/lib/db"
import {
  DUE_MASTERY_THRESHOLD,
  MAX_CONTEXT_NOTES,
  MAX_CONTEXT_TOPICS,
  STRONG_MASTERY,
} from "@/lib/learner/config"

type TopicRow = typeof topicMastery.$inferSelect

function formatTopic(row: TopicRow): string {
  return `${row.topicLabel} (${Math.round(row.masteryScore * 100)}%)`
}

/**
 * Builds the private "Learner Context" block appended to Shawky's instructions:
 * profile, practice totals, weak/strong topics, due reviews, and recent notes.
 *
 * Bounded by `MAX_CONTEXT_TOPICS` / `MAX_CONTEXT_NOTES`, and returns `""` for a
 * brand-new learner so nothing spurious is injected.
 */
export async function buildLearnerContext(userId: string): Promise<string> {
  const [profile] = await db
    .select()
    .from(learnerProfiles)
    .where(eq(learnerProfiles.userId, userId))
    .limit(1)

  const [stats] = await db
    .select()
    .from(learnerStats)
    .where(eq(learnerStats.userId, userId))
    .limit(1)

  const mastery = await db
    .select()
    .from(topicMastery)
    .where(eq(topicMastery.userId, userId))
    .orderBy(asc(topicMastery.masteryScore))

  const notes = await db
    .select()
    .from(learnerMemoryNotes)
    .where(
      and(eq(learnerMemoryNotes.userId, userId), eq(learnerMemoryNotes.status, "active")),
    )
    .orderBy(desc(learnerMemoryNotes.createdAt))
    .limit(MAX_CONTEXT_NOTES)

  const now = Date.now()
  const weak = mastery
    .filter((row) => row.masteryScore < DUE_MASTERY_THRESHOLD)
    .slice(0, MAX_CONTEXT_TOPICS)
  const strong = mastery
    .filter((row) => row.masteryScore >= STRONG_MASTERY)
    .slice(-MAX_CONTEXT_TOPICS)
  const due = mastery
    .filter(
      (row) =>
        row.masteryScore < DUE_MASTERY_THRESHOLD ||
        (row.nextReviewAt ? row.nextReviewAt.getTime() <= now : false),
    )
    .slice(0, MAX_CONTEXT_TOPICS)

  const lines: string[] = []

  if (profile) {
    const goal = profile.learningGoal ? ` · goal: ${profile.learningGoal}` : ""
    lines.push(`- Profile: ${profile.subject} · ${profile.skillLevel}${goal}`)
  }

  if (stats && stats.totalAttempts > 0) {
    const accuracy = Math.round((stats.totalCorrect / stats.totalAttempts) * 100)
    lines.push(
      `- Practice: ${stats.totalAttempts} items · ${stats.totalCorrect} correct (${accuracy}%) · ${stats.currentStreak}-day streak`,
    )
  }

  if (weak.length > 0) {
    lines.push(`- Weak areas (scaffold and revisit): ${weak.map(formatTopic).join(", ")}`)
  }

  if (strong.length > 0) {
    lines.push(`- Strengths (can move faster): ${strong.map(formatTopic).join(", ")}`)
  }

  if (due.length > 0) {
    lines.push(`- Due for review: ${due.map((row) => row.topicLabel).join(", ")}`)
  }

  if (notes.length > 0) {
    lines.push("- Recent observations about this learner:")
    for (const note of notes) {
      const tip = note.recommendation ? ` (tip: ${note.recommendation})` : ""
      lines.push(`  - [${note.type}] ${note.topic}: ${note.observation}${tip}`)
    }
  }

  if (lines.length === 0) return ""

  return [
    "### Learner Context (private — shape your tutoring; never quote it verbatim or say you keep notes)",
    ...lines,
  ].join("\n")
}
