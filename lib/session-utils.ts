import { SessionCategory } from "@/types/session"

/** Maximum length of an auto-derived session title before ellipsis. */
export const SESSION_TITLE_MAX_LENGTH = 40

/**
 * Derives a session title from the first user message.
 * Used by both the client (optimistic sidebar entry) and the server (persistence)
 * so the title stays consistent regardless of which side writes it first.
 */
export function deriveSessionTitle(text: string, maxLength = SESSION_TITLE_MAX_LENGTH): string {
  const trimmed = text.trim().replace(/\s+/g, " ")
  if (trimmed.length <= maxLength) return trimmed
  return `${trimmed.slice(0, maxLength)}...`
}

/**
 * Computes chronological grouping category for a session timestamp
 */
export function computeSessionCategory(dateInput: Date | string): SessionCategory {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput
  const now = new Date()

  // Start of today (00:00:00)
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  // Start of yesterday
  const startOfYesterday = new Date(startOfToday)
  startOfYesterday.setDate(startOfYesterday.getDate() - 1)
  // Start of 7 days ago
  const startOf7DaysAgo = new Date(startOfToday)
  startOf7DaysAgo.setDate(startOf7DaysAgo.getDate() - 7)

  if (date >= startOfToday) {
    return "today"
  } else if (date >= startOfYesterday) {
    return "yesterday"
  } else if (date >= startOf7DaysAgo) {
    return "previous_7_days"
  } else {
    return "older"
  }
}

/**
 * Formats a timestamp into a human-readable string
 */
export function formatSessionTimestamp(dateInput: Date | string, isAr: boolean = false): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput
  const now = new Date()

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()

  if (isToday) {
    return date.toLocaleTimeString(isAr ? "ar-EG" : "en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  return date.toLocaleDateString(isAr ? "ar-EG" : "en-US", {
    month: "short",
    day: "numeric",
  })
}
