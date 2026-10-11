import { HALF_LIFE_DAYS, HINT_PENALTY } from "./config"

export interface ScorableAttempt {
  isCorrect: boolean | null
  outcome: string
  hintUsed: boolean
  createdAt: Date
}

const MS_PER_DAY = 1000 * 60 * 60 * 24

function isCorrectAttempt(attempt: ScorableAttempt): number {
  if (typeof attempt.isCorrect === "boolean") return attempt.isCorrect ? 1 : 0
  return attempt.outcome === "correct" || attempt.outcome === "mastered" ? 1 : 0
}

/**
 * Recency-weighted accuracy: `Σ(wᵢ·correctᵢ) / Σ(wᵢ)` where each attempt is
 * weighted by an exponential time decay (half-life `HALF_LIFE_DAYS`) and shaved
 * by `HINT_PENALTY` when a hint was used. Skipped items are ignored entirely.
 */
export function computeMastery(
  attempts: ScorableAttempt[],
  now: Date = new Date(),
): number {
  let weightedCorrect = 0
  let totalWeight = 0

  for (const attempt of attempts) {
    if (attempt.outcome === "skipped") continue

    const ageDays = Math.max(
      0,
      (now.getTime() - attempt.createdAt.getTime()) / MS_PER_DAY,
    )
    const weight =
      Math.exp(-ageDays / HALF_LIFE_DAYS) * (attempt.hintUsed ? HINT_PENALTY : 1)

    weightedCorrect += weight * isCorrectAttempt(attempt)
    totalWeight += weight
  }

  if (totalWeight <= 0) return 0
  return weightedCorrect / totalWeight
}
