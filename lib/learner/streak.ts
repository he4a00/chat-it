export interface StreakState {
  currentStreak: number
  longestStreak: number
  lastPracticeDay: string | null
}

export function toUtcDayString(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function dayBefore(day: string): string {
  const date = new Date(`${day}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() - 1)
  return toUtcDayString(date)
}

/**
 * Advances a graded-practice streak for a practice event on `practiceDate`
 * (UTC day granularity). Same day is a no-op; the day immediately after the last
 * practice extends the streak; any larger gap resets it to 1.
 */
export function advanceStreak(state: StreakState, practiceDate: Date): StreakState {
  const today = toUtcDayString(practiceDate)
  if (state.lastPracticeDay === today) return state

  const isConsecutive = state.lastPracticeDay === dayBefore(today)
  const currentStreak = isConsecutive ? state.currentStreak + 1 : 1

  return {
    currentStreak,
    longestStreak: Math.max(state.longestStreak, currentStreak),
    lastPracticeDay: today,
  }
}
