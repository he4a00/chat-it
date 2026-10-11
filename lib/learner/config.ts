import type { MasteryBand, MemoryNoteType, PracticeOutcome, SkillLevel } from "@/types/learner"

/** Mastery bands (0..1). */
export const STRONG_MASTERY = 0.8
export const WEAK_MASTERY = 0.6

/** A topic is "due" when its mastery is below this or its review time has passed. */
export const DUE_MASTERY_THRESHOLD = 0.7

/** Recency weighting: an attempt this many days old carries ~37% of a fresh one. */
export const HALF_LIFE_DAYS = 14

/** Weight multiplier applied to attempts where a hint was used. */
export const HINT_PENALTY = 0.6

/** Spaced-review window, in days, mapped from mastery (weak → soon, strong → later). */
export const MIN_REVIEW_INTERVAL_DAYS = 1
export const MAX_REVIEW_INTERVAL_DAYS = 14

/** Context-injection caps (keep the injected prompt block small). */
export const MAX_CONTEXT_TOPICS = 6
export const MAX_CONTEXT_NOTES = 5

/** How many topics a one-tap review session targets. */
export const REVIEW_TOPIC_LIMIT = 3

export const NOTE_TYPES: MemoryNoteType[] = [
  "preference",
  "misconception",
  "strength",
  "goal",
  "observation",
]

export const SKILL_LEVELS: SkillLevel[] = ["beginner", "intermediate", "advanced"]

export const PRACTICE_OUTCOMES: PracticeOutcome[] = [
  "correct",
  "incorrect",
  "mastered",
  "review",
  "skipped",
]

export function reviewIntervalDays(mastery: number): number {
  const clamped = Math.min(1, Math.max(0, mastery))
  return Math.round(
    MIN_REVIEW_INTERVAL_DAYS +
      clamped * (MAX_REVIEW_INTERVAL_DAYS - MIN_REVIEW_INTERVAL_DAYS),
  )
}

export function masteryBand(mastery: number): MasteryBand {
  if (mastery >= STRONG_MASTERY) return "strong"
  if (mastery >= WEAK_MASTERY) return "developing"
  return "weak"
}
