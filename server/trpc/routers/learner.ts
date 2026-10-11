import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { and, asc, desc, eq, inArray, lt, lte, or } from "drizzle-orm"
import { router, protectedProcedure } from "../trpc"
import {
  chats,
  learnerMemoryNotes,
  learnerProfiles,
  learnerStats,
  topicMastery,
} from "@/lib/db"
import { ensureUserRow } from "@/lib/auth/ensure-user"
import {
  DUE_MASTERY_THRESHOLD,
  NOTE_TYPES,
  REVIEW_TOPIC_LIMIT,
  SKILL_LEVELS,
} from "@/lib/learner/config"
import { toUtcDayString } from "@/lib/learner/streak"
import { deriveSessionTitle } from "@/lib/session-utils"
import type {
  LearnerMemoryNoteView,
  LearnerOverview,
  LearnerProfileSummary,
  MemoryNoteType,
  SkillLevel,
} from "@/types/learner"

type ProfileRow = typeof learnerProfiles.$inferSelect
type NoteRow = typeof learnerMemoryNotes.$inferSelect

function toProfileSummary(row: ProfileRow | undefined): LearnerProfileSummary | null {
  if (!row) return null
  const skillLevel = (SKILL_LEVELS as string[]).includes(row.skillLevel)
    ? (row.skillLevel as SkillLevel)
    : "intermediate"
  return {
    subject: row.subject,
    skillLevel,
    learningGoal: row.learningGoal,
    subjects: Array.isArray(row.subjects) ? row.subjects : [],
    onboardingCompleted: Boolean(row.onboardingCompletedAt),
  }
}

function toNoteView(row: NoteRow): LearnerMemoryNoteView {
  return {
    id: row.id,
    type: (NOTE_TYPES as string[]).includes(row.type)
      ? (row.type as MemoryNoteType)
      : "observation",
    topic: row.topic,
    observation: row.observation,
    recommendation: row.recommendation,
    confidence: row.confidence,
    createdAt: row.createdAt.toISOString(),
  }
}

/** A topic is "due" when its mastery is below threshold or its review time has passed. */
function dueCondition() {
  return or(
    lt(topicMastery.masteryScore, DUE_MASTERY_THRESHOLD),
    lte(topicMastery.nextReviewAt, new Date()),
  )
}

function buildReviewPrompt(lang: "en" | "ar", topics: string[]): string {
  const list = topics.join(lang === "ar" ? "، " : ", ")
  if (lang === "ar") {
    return `[جلسة مراجعة]: أريد مراجعة وتقوية فهمي في هذه المواضيع: ${list}. من فضلك جهّز لي مجموعة تدريب قصيرة وموجّهة — مزيجاً من اختبار قصير (٤ أسئلة) و/أو بطاقات تعليمية — تركّز تحديداً على هذه المواضيع، ثم أرشدني سقراطياً فيما أخطئ فيه.`
  }
  return `[Review Session]: I want to review and strengthen my understanding of these topics: ${list}. Please build a short, targeted practice set — a mix of a 4-question quiz and/or flashcards — that tests these specifically, then guide me Socratically through anything I get wrong.`
}

export const learnerRouter = router({
  /** The learner's onboarding profile, or null if they haven't completed it. */
  getProfile: protectedProcedure.query(
    async ({ ctx }): Promise<LearnerProfileSummary | null> => {
      const [row] = await ctx.db
        .select()
        .from(learnerProfiles)
        .where(eq(learnerProfiles.userId, ctx.userId))
        .limit(1)

      return toProfileSummary(row)
    },
  ),

  /**
   * Persist the config-driven onboarding wizard. Known keys map to typed columns
   * while the raw `answers` blob is retained so future steps need no migration.
   */
  completeOnboarding: protectedProcedure
    .input(z.object({ answers: z.record(z.string(), z.unknown()) }))
    .mutation(async ({ ctx, input }): Promise<LearnerProfileSummary | null> => {
      await ensureUserRow(ctx.userId)

      const answers = input.answers ?? {}
      const subject =
        typeof answers.subject === "string" && answers.subject.trim()
          ? answers.subject.trim()
          : "Mathematics"
      const rawSkill = typeof answers.skillLevel === "string" ? answers.skillLevel : undefined
      const skillLevel =
        rawSkill && (SKILL_LEVELS as string[]).includes(rawSkill) ? rawSkill : "intermediate"
      const learningGoal =
        typeof answers.learningGoal === "string" && answers.learningGoal.trim()
          ? answers.learningGoal.trim()
          : null
      const subjects = Array.isArray(answers.subjects)
        ? (answers.subjects.filter((value) => typeof value === "string") as string[])
        : [subject]
      const timezone = typeof answers.timezone === "string" ? answers.timezone : null
      const now = new Date()

      const values = {
        userId: ctx.userId,
        subject,
        skillLevel,
        learningGoal,
        subjects,
        onboardingAnswers: answers,
        onboardingCompletedAt: now,
        timezone,
        updatedAt: now,
      }

      const [row] = await ctx.db
        .insert(learnerProfiles)
        .values(values)
        .onConflictDoUpdate({
          target: learnerProfiles.userId,
          set: {
            subject,
            skillLevel,
            learningGoal,
            subjects,
            onboardingAnswers: answers,
            onboardingCompletedAt: now,
            timezone,
            updatedAt: now,
          },
        })
        .returning()

      return toProfileSummary(row)
    }),

  /** Edit level / goal / subjects after onboarding. */
  updateProfile: protectedProcedure
    .input(
      z.object({
        skillLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
        learningGoal: z.string().nullable().optional(),
        subjects: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }): Promise<LearnerProfileSummary | null> => {
      const updates: Partial<typeof learnerProfiles.$inferInsert> = { updatedAt: new Date() }
      if (input.skillLevel) updates.skillLevel = input.skillLevel
      if (input.learningGoal !== undefined) updates.learningGoal = input.learningGoal
      if (input.subjects) updates.subjects = input.subjects

      const [row] = await ctx.db
        .update(learnerProfiles)
        .set(updates)
        .where(eq(learnerProfiles.userId, ctx.userId))
        .returning()

      if (!row) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Profile not found" })
      }

      return toProfileSummary(row)
    }),

  /** One payload for the Progress panel: profile + streak + mastery + coach notes. */
  getOverview: protectedProcedure.query(async ({ ctx }): Promise<LearnerOverview> => {
    const now = new Date()

    const [profileRow] = await ctx.db
      .select()
      .from(learnerProfiles)
      .where(eq(learnerProfiles.userId, ctx.userId))
      .limit(1)

    const [statsRow] = await ctx.db
      .select()
      .from(learnerStats)
      .where(eq(learnerStats.userId, ctx.userId))
      .limit(1)

    const masteryRows = await ctx.db
      .select()
      .from(topicMastery)
      .where(eq(topicMastery.userId, ctx.userId))
      .orderBy(asc(topicMastery.masteryScore))

    const noteRows = await ctx.db
      .select()
      .from(learnerMemoryNotes)
      .where(
        and(eq(learnerMemoryNotes.userId, ctx.userId), eq(learnerMemoryNotes.status, "active")),
      )
      .orderBy(desc(learnerMemoryNotes.createdAt))
      .limit(8)

    const totalAttempts = statsRow?.totalAttempts ?? 0
    const totalCorrect = statsRow?.totalCorrect ?? 0
    const today = toUtcDayString(now)

    return {
      profile: toProfileSummary(profileRow),
      streak: {
        current: statsRow?.currentStreak ?? 0,
        longest: statsRow?.longestStreak ?? 0,
        lastPracticeDay: statsRow?.lastPracticeDay ?? null,
        practicedToday: statsRow?.lastPracticeDay === today,
      },
      stats: {
        totalAttempts,
        totalCorrect,
        accuracy: totalAttempts > 0 ? totalCorrect / totalAttempts : 0,
      },
      topics: masteryRows.map((row) => ({
        topicId: row.topicId,
        topic: row.topicLabel,
        subject: row.subject,
        masteryScore: row.masteryScore,
        totalAttempts: row.totalAttempts,
        lastPracticedAt: row.lastPracticedAt ? row.lastPracticedAt.toISOString() : null,
        nextReviewAt: row.nextReviewAt ? row.nextReviewAt.toISOString() : null,
        isDue:
          row.masteryScore < DUE_MASTERY_THRESHOLD ||
          (row.nextReviewAt ? row.nextReviewAt.getTime() <= now.getTime() : false),
      })),
      notes: noteRows.map(toNoteView),
    }
  }),

  /** Active qualitative notes, newest first. */
  getMemoryNotes: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).optional() }).optional())
    .query(async ({ ctx, input }): Promise<LearnerMemoryNoteView[]> => {
      const limit = input?.limit ?? 20
      const rows = await ctx.db
        .select()
        .from(learnerMemoryNotes)
        .where(
          and(eq(learnerMemoryNotes.userId, ctx.userId), eq(learnerMemoryNotes.status, "active")),
        )
        .orderBy(desc(learnerMemoryNotes.createdAt))
        .limit(limit)

      return rows.map(toNoteView)
    }),

  /** Topics currently due for review, weakest first. */
  getDueReviews: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select()
      .from(topicMastery)
      .where(and(eq(topicMastery.userId, ctx.userId), dueCondition()))
      .orderBy(asc(topicMastery.masteryScore))
      .limit(20)

    return rows.map((row) => ({
      topicId: row.topicId,
      topic: row.topicLabel,
      subject: row.subject,
      masteryScore: row.masteryScore,
    }))
  }),

  /**
   * Create a fresh chat seeded with a targeted review prompt covering the given
   * (or due/weakest) topics. The client stashes the prompt and auto-sends it.
   */
  startReview: protectedProcedure
    .input(
      z.object({
        lang: z.enum(["en", "ar"]).default("en"),
        topicIds: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }): Promise<{ chatId: string; prompt: string }> => {
      await ensureUserRow(ctx.userId)

      let reviewRows = input.topicIds?.length
        ? await ctx.db
            .select()
            .from(topicMastery)
            .where(
              and(
                eq(topicMastery.userId, ctx.userId),
                inArray(topicMastery.topicId, input.topicIds),
              ),
            )
        : await ctx.db
            .select()
            .from(topicMastery)
            .where(and(eq(topicMastery.userId, ctx.userId), dueCondition()))
            .orderBy(asc(topicMastery.masteryScore))
            .limit(REVIEW_TOPIC_LIMIT)

      // Fallback: no due topics yet — review the weakest practiced topics.
      if (reviewRows.length === 0) {
        reviewRows = await ctx.db
          .select()
          .from(topicMastery)
          .where(eq(topicMastery.userId, ctx.userId))
          .orderBy(asc(topicMastery.masteryScore))
          .limit(REVIEW_TOPIC_LIMIT)
      }

      if (reviewRows.length === 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "No practiced topics to review yet.",
        })
      }

      const topicNames = reviewRows.map((row) => row.topicLabel)
      const chatId = crypto.randomUUID()

      const [profile] = await ctx.db
        .select({ subject: learnerProfiles.subject })
        .from(learnerProfiles)
        .where(eq(learnerProfiles.userId, ctx.userId))
        .limit(1)

      await ctx.db
        .insert(chats)
        .values({
          id: chatId,
          userId: ctx.userId,
          title: deriveSessionTitle(`Review: ${topicNames.join(", ")}`),
          subject: profile?.subject ?? reviewRows[0].subject,
        })
        .onConflictDoNothing()

      return { chatId, prompt: buildReviewPrompt(input.lang, topicNames) }
    }),
})
