import {
  pgTable,
  text,
  timestamp,
  jsonb,
  boolean,
  integer,
  real,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

/**
 * 1. Users Table
 * Maps directly to Clerk authenticated user identifiers.
 */
export const users = pgTable("users", {
  id: text("id").primaryKey(), // Clerk user ID (e.g., 'user_2xxx')
  email: text("email").notNull(),
  fullName: text("full_name"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
})

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(learnerProfiles, {
    fields: [users.id],
    references: [learnerProfiles.userId],
  }),
  stats: one(learnerStats, {
    fields: [users.id],
    references: [learnerStats.userId],
  }),
  chats: many(chats),
  topicMastery: many(topicMastery),
  memoryNotes: many(learnerMemoryNotes),
  attempts: many(practiceAttempts),
}))

/**
 * 2. Topics Table (canonical registry)
 * A DB-backed, AI-grown registry of subjects and topics. Keys are normalized so
 * synonyms merge into a single canonical row, keeping mastery aggregation clean
 * while remaining open to any subject the learner asks about.
 */
export const topics = pgTable(
  "topics",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    subject: text("subject").notNull(),
    subjectKey: text("subject_key").notNull(),
    topic: text("topic").notNull(),
    topicKey: text("topic_key").notNull(),
    aliases: jsonb("aliases").$type<string[]>().default([]).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("topics_subject_topic_key_idx").on(table.subjectKey, table.topicKey),
  ],
)

export const topicsRelations = relations(topics, ({ many }) => ({
  attempts: many(practiceAttempts),
  mastery: many(topicMastery),
  notes: many(learnerMemoryNotes),
}))

/**
 * 3. Learner Profiles Table
 * Pedagogical onboarding state, active subject, skill level, and goals. The raw
 * `onboardingAnswers` blob keeps the config-driven wizard fully extensible —
 * adding a step later needs no migration.
 */
export const learnerProfiles = pgTable("learner_profiles", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  subject: text("subject").default("Mathematics").notNull(),
  skillLevel: text("skill_level").default("intermediate").notNull(),
  learningGoal: text("learning_goal"),
  subjects: jsonb("subjects").$type<string[]>().default([]).notNull(),
  onboardingAnswers: jsonb("onboarding_answers")
    .$type<Record<string, unknown>>()
    .default({})
    .notNull(),
  onboardingCompletedAt: timestamp("onboarding_completed_at", { mode: "date" }),
  timezone: text("timezone"),
  preferences: jsonb("preferences").$type<Record<string, unknown>>().default({}),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
})

export const learnerProfilesRelations = relations(learnerProfiles, ({ one }) => ({
  user: one(users, {
    fields: [learnerProfiles.userId],
    references: [users.id],
  }),
}))

/**
 * 4. Chats (Sessions) Table
 * Organizes message conversations per user.
 */
export const chats = pgTable("chats", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull(),
  subject: text("subject").default("Math").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
})

export const chatsRelations = relations(chats, ({ one, many }) => ({
  user: one(users, {
    fields: [chats.userId],
    references: [users.id],
  }),
  messages: many(messages),
  attempts: many(practiceAttempts),
}))

/**
 * 5. Messages Table
 * Persists the chat stream, roles, KaTeX text content, and AI SDK tool invocations.
 */
export const messages = pgTable("messages", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  chatId: text("chat_id")
    .references(() => chats.id, { onDelete: "cascade" })
    .notNull(),
  role: text("role").notNull(), // 'user' | 'assistant' | 'system' | 'data'
  content: text("content").notNull(),
  toolInvocations: jsonb("tool_invocations").$type<unknown[]>(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
})

export const messagesRelations = relations(messages, ({ one, many }) => ({
  chat: one(chats, {
    fields: [messages.chatId],
    references: [chats.id],
  }),
  widgetStates: many(widgetStates),
  attempts: many(practiceAttempts),
  memoryNotes: many(learnerMemoryNotes),
}))

/**
 * 6. Widget States Table
 * Persists interactive Generative UI widgets (Quiz, Flashcard, Math Problem, QuickCheck).
 */
export const widgetStates = pgTable("widget_states", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  messageId: text("message_id")
    .references(() => messages.id, { onDelete: "cascade" })
    .notNull(),
  widgetType: text("widget_type").notNull(), // 'quiz' | 'flashcard' | 'math_problem' | 'quick_check'
  payload: jsonb("payload").notNull(),
  userSubmission: jsonb("user_submission").$type<Record<string, unknown>>(),
  isCompleted: boolean("is_completed").default(false).notNull(),
  score: integer("score"),
  submittedAt: timestamp("submitted_at", { mode: "date" }),
})

export const widgetStatesRelations = relations(widgetStates, ({ one }) => ({
  message: one(messages, {
    fields: [widgetStates.messageId],
    references: [messages.id],
  }),
}))

/**
 * 7. Practice Attempts Table (immutable event log)
 * One row per graded item (quiz question, flashcard, math answer, quick check).
 * This is the precise, full-history source of truth from which mastery, streaks,
 * trends, and spaced review are derived. Retakes are kept, never overwritten.
 */
export const practiceAttempts = pgTable(
  "practice_attempts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    chatId: text("chat_id").references(() => chats.id, { onDelete: "set null" }),
    messageId: text("message_id").references(() => messages.id, { onDelete: "set null" }),
    widgetType: text("widget_type").notNull(), // 'quiz' | 'flashcard' | 'math_problem' | 'quick_check'
    itemId: text("item_id"),
    topicId: text("topic_id").references(() => topics.id, { onDelete: "set null" }),
    subject: text("subject").notNull(),
    topicLabel: text("topic_label").notNull(),
    outcome: text("outcome").notNull(), // 'correct' | 'incorrect' | 'mastered' | 'review' | 'skipped'
    isCorrect: boolean("is_correct"),
    hintUsed: boolean("hint_used").default(false).notNull(),
    difficulty: text("difficulty"),
    attemptNo: integer("attempt_no").default(1).notNull(),
    timeSpentMs: integer("time_spent_ms"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("practice_attempts_user_created_idx").on(table.userId, table.createdAt),
    index("practice_attempts_user_topic_idx").on(table.userId, table.topicId),
  ],
)

export const practiceAttemptsRelations = relations(practiceAttempts, ({ one }) => ({
  user: one(users, {
    fields: [practiceAttempts.userId],
    references: [users.id],
  }),
  chat: one(chats, {
    fields: [practiceAttempts.chatId],
    references: [chats.id],
  }),
  message: one(messages, {
    fields: [practiceAttempts.messageId],
    references: [messages.id],
  }),
  topic: one(topics, {
    fields: [practiceAttempts.topicId],
    references: [topics.id],
  }),
}))

/**
 * 8. Topic Mastery Table
 * Derived aggregate per (user, subject, topic): a recency-weighted mastery score,
 * attempt counts, and the next scheduled review time.
 */
export const topicMastery = pgTable(
  "topic_mastery",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    topicId: text("topic_id")
      .references(() => topics.id, { onDelete: "cascade" })
      .notNull(),
    subject: text("subject").notNull(),
    subjectKey: text("subject_key").notNull(),
    topicLabel: text("topic_label").notNull(),
    masteryScore: real("mastery_score").default(0.0).notNull(), // 0.0 to 1.0
    totalAttempts: integer("total_attempts").default(0).notNull(),
    correctAttempts: integer("correct_attempts").default(0).notNull(),
    lastPracticedAt: timestamp("last_practiced_at", { mode: "date" }).defaultNow().notNull(),
    nextReviewAt: timestamp("next_review_at", { mode: "date" }),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("topic_mastery_user_topic_idx").on(table.userId, table.topicId),
  ],
)

export const topicMasteryRelations = relations(topicMastery, ({ one }) => ({
  user: one(users, {
    fields: [topicMastery.userId],
    references: [users.id],
  }),
  topic: one(topics, {
    fields: [topicMastery.topicId],
    references: [topics.id],
  }),
}))

/**
 * 9. Learner Stats Table
 * Fast per-user rollups: practice streak and overall attempt/accuracy totals.
 */
export const learnerStats = pgTable("learner_stats", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  currentStreak: integer("current_streak").default(0).notNull(),
  longestStreak: integer("longest_streak").default(0).notNull(),
  lastPracticeDay: text("last_practice_day"), // YYYY-MM-DD (UTC)
  totalAttempts: integer("total_attempts").default(0).notNull(),
  totalCorrect: integer("total_correct").default(0).notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
})

export const learnerStatsRelations = relations(learnerStats, ({ one }) => ({
  user: one(users, {
    fields: [learnerStats.userId],
    references: [users.id],
  }),
}))

/**
 * 10. Learner Memory Notes Table
 * Qualitative pedagogical observations recorded autonomously by Shawky's AI agent,
 * now typed (preference / misconception / strength / goal) with a confidence value.
 */
export const learnerMemoryNotes = pgTable("learner_memory_notes", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  topic: text("topic").notNull(),
  topicId: text("topic_id").references(() => topics.id, { onDelete: "set null" }),
  type: text("type").default("observation").notNull(),
  observation: text("observation").notNull(),
  recommendation: text("recommendation"),
  confidence: real("confidence"),
  sourceMessageId: text("source_message_id").references(() => messages.id, {
    onDelete: "set null",
  }),
  status: text("status").default("active").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
})

export const learnerMemoryNotesRelations = relations(learnerMemoryNotes, ({ one }) => ({
  user: one(users, {
    fields: [learnerMemoryNotes.userId],
    references: [users.id],
  }),
  topic: one(topics, {
    fields: [learnerMemoryNotes.topicId],
    references: [topics.id],
  }),
  sourceMessage: one(messages, {
    fields: [learnerMemoryNotes.sourceMessageId],
    references: [messages.id],
  }),
}))

// Type inference exports
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type Topic = typeof topics.$inferSelect
export type NewTopic = typeof topics.$inferInsert

export type LearnerProfile = typeof learnerProfiles.$inferSelect
export type NewLearnerProfile = typeof learnerProfiles.$inferInsert

export type Chat = typeof chats.$inferSelect
export type NewChat = typeof chats.$inferInsert

export type Message = typeof messages.$inferSelect
export type NewMessage = typeof messages.$inferInsert

export type WidgetState = typeof widgetStates.$inferSelect
export type NewWidgetState = typeof widgetStates.$inferInsert

export type PracticeAttempt = typeof practiceAttempts.$inferSelect
export type NewPracticeAttempt = typeof practiceAttempts.$inferInsert

export type TopicMastery = typeof topicMastery.$inferSelect
export type NewTopicMastery = typeof topicMastery.$inferInsert

export type LearnerStats = typeof learnerStats.$inferSelect
export type NewLearnerStats = typeof learnerStats.$inferInsert

export type LearnerMemoryNote = typeof learnerMemoryNotes.$inferSelect
export type NewLearnerMemoryNote = typeof learnerMemoryNotes.$inferInsert
