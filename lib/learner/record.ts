import "server-only"
import { and, eq, sql } from "drizzle-orm"
import { db, practiceAttempts, topicMastery, learnerStats } from "@/lib/db"
import type { PracticeOutcome } from "@/types/learner"
import { reviewIntervalDays } from "./config"
import { computeMastery } from "./scoring"
import { advanceStreak } from "./streak"
import { resolveTopic } from "./resolve-topic"

const MS_PER_DAY = 1000 * 60 * 60 * 24

export interface PracticeItemInput {
  itemId?: string
  outcome: PracticeOutcome
  hintUsed?: boolean
  difficulty?: string
}

export interface RecordPracticeInput {
  userId: string
  chatId?: string | null
  messageId?: string | null
  widgetType: string
  subject?: string | null
  topic?: string | null
  items: PracticeItemInput[]
  timeSpentMs?: number | null
}

export interface RecordPracticeResult {
  recorded: number
  topicId: string | null
  masteryScore: number
}

function outcomeIsCorrect(outcome: PracticeOutcome): boolean {
  return outcome === "correct" || outcome === "mastered"
}

/**
 * Records a batch of graded practice items: appends immutable attempt rows,
 * recomputes the topic's recency-weighted mastery + next review time, and
 * advances the learner's streak and totals. Called from `widget.submitState`.
 */
export async function recordPractice(
  input: RecordPracticeInput,
): Promise<RecordPracticeResult> {
  const gradedItems = input.items.filter((item) => item.outcome !== "skipped")
  if (gradedItems.length === 0) {
    return { recorded: 0, topicId: null, masteryScore: 0 }
  }

  const resolved = await resolveTopic(input.subject, input.topic)
  const now = new Date()

  // Attempt numbers are per item within a topic.
  const priorCounts = new Map<string, number>()
  const itemIds = gradedItems
    .map((item) => item.itemId)
    .filter((id): id is string => Boolean(id))

  if (itemIds.length > 0) {
    const prior = await db
      .select({
        itemId: practiceAttempts.itemId,
        count: sql<number>`count(*)::int`,
      })
      .from(practiceAttempts)
      .where(
        and(
          eq(practiceAttempts.userId, input.userId),
          eq(practiceAttempts.topicId, resolved.topicId),
        ),
      )
      .groupBy(practiceAttempts.itemId)

    for (const row of prior) {
      if (row.itemId) priorCounts.set(row.itemId, row.count)
    }
  }

  const values = gradedItems.map((item) => ({
    userId: input.userId,
    chatId: input.chatId ?? null,
    messageId: input.messageId ?? null,
    widgetType: input.widgetType,
    itemId: item.itemId ?? null,
    topicId: resolved.topicId,
    subject: resolved.subject,
    topicLabel: resolved.topicLabel,
    outcome: item.outcome,
    isCorrect: outcomeIsCorrect(item.outcome),
    hintUsed: item.hintUsed ?? false,
    difficulty: item.difficulty ?? null,
    attemptNo: (item.itemId ? (priorCounts.get(item.itemId) ?? 0) : 0) + 1,
    timeSpentMs: input.timeSpentMs ?? null,
  }))

  await db.insert(practiceAttempts).values(values)

  // Recompute the topic aggregate from the full attempt history.
  const topicAttempts = await db
    .select({
      isCorrect: practiceAttempts.isCorrect,
      outcome: practiceAttempts.outcome,
      hintUsed: practiceAttempts.hintUsed,
      createdAt: practiceAttempts.createdAt,
    })
    .from(practiceAttempts)
    .where(
      and(
        eq(practiceAttempts.userId, input.userId),
        eq(practiceAttempts.topicId, resolved.topicId),
      ),
    )

  const masteryScore = computeMastery(topicAttempts, now)
  const correctAttempts = topicAttempts.filter((attempt) =>
    typeof attempt.isCorrect === "boolean"
      ? attempt.isCorrect
      : attempt.outcome === "correct" || attempt.outcome === "mastered",
  ).length
  const nextReviewAt = new Date(
    now.getTime() + reviewIntervalDays(masteryScore) * MS_PER_DAY,
  )

  await db
    .insert(topicMastery)
    .values({
      userId: input.userId,
      topicId: resolved.topicId,
      subject: resolved.subject,
      subjectKey: resolved.subjectKey,
      topicLabel: resolved.topicLabel,
      masteryScore,
      totalAttempts: topicAttempts.length,
      correctAttempts,
      lastPracticedAt: now,
      nextReviewAt,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [topicMastery.userId, topicMastery.topicId],
      set: {
        subject: resolved.subject,
        subjectKey: resolved.subjectKey,
        topicLabel: resolved.topicLabel,
        masteryScore,
        totalAttempts: topicAttempts.length,
        correctAttempts,
        lastPracticedAt: now,
        nextReviewAt,
        updatedAt: now,
      },
    })

  // Advance streak + overall totals.
  const [stats] = await db
    .select()
    .from(learnerStats)
    .where(eq(learnerStats.userId, input.userId))
    .limit(1)

  const advanced = advanceStreak(
    {
      currentStreak: stats?.currentStreak ?? 0,
      longestStreak: stats?.longestStreak ?? 0,
      lastPracticeDay: stats?.lastPracticeDay ?? null,
    },
    now,
  )

  const correctInBatch = values.filter((value) => value.isCorrect).length
  const totalAttempts = (stats?.totalAttempts ?? 0) + values.length
  const totalCorrect = (stats?.totalCorrect ?? 0) + correctInBatch

  await db
    .insert(learnerStats)
    .values({
      userId: input.userId,
      currentStreak: advanced.currentStreak,
      longestStreak: advanced.longestStreak,
      lastPracticeDay: advanced.lastPracticeDay,
      totalAttempts,
      totalCorrect,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: learnerStats.userId,
      set: {
        currentStreak: advanced.currentStreak,
        longestStreak: advanced.longestStreak,
        lastPracticeDay: advanced.lastPracticeDay,
        totalAttempts,
        totalCorrect,
        updatedAt: now,
      },
    })

  return { recorded: values.length, topicId: resolved.topicId, masteryScore }
}
