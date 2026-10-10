export type SessionCategory = "today" | "yesterday" | "previous_7_days" | "older"

export type SessionSubject = "Math" | "Physics" | "Calculus" | "Chemistry" | "Biology" | "General"

export interface ChatSession {
  id: string
  title: string
  timestamp: string
  category: SessionCategory
  subject: SessionSubject
  preview?: string
  isPinned?: boolean
  updatedAt?: string
}
