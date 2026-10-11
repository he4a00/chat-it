export type SkillLevel = "beginner" | "intermediate" | "advanced"

export type MasteryBand = "strong" | "developing" | "weak"

export type MemoryNoteType =
  | "preference"
  | "misconception"
  | "strength"
  | "goal"
  | "observation"

export type PracticeOutcome =
  | "correct"
  | "incorrect"
  | "mastered"
  | "review"
  | "skipped"

export interface LearnerProfileSummary {
  subject: string
  skillLevel: SkillLevel
  learningGoal: string | null
  subjects: string[]
  onboardingCompleted: boolean
}

export interface LearnerStreak {
  current: number
  longest: number
  lastPracticeDay: string | null
  practicedToday: boolean
}

export interface LearnerStatsSummary {
  totalAttempts: number
  totalCorrect: number
  accuracy: number
}

export interface LearnerTopicMastery {
  topicId: string
  topic: string
  subject: string
  masteryScore: number
  totalAttempts: number
  lastPracticedAt: string | null
  nextReviewAt: string | null
  isDue: boolean
}

export interface LearnerMemoryNoteView {
  id: string
  type: MemoryNoteType
  topic: string
  observation: string
  recommendation: string | null
  confidence: number | null
  createdAt: string
}

export interface LearnerOverview {
  profile: LearnerProfileSummary | null
  streak: LearnerStreak
  stats: LearnerStatsSummary
  topics: LearnerTopicMastery[]
  notes: LearnerMemoryNoteView[]
}
