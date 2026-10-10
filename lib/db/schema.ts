import { pgTable, text, timestamp, jsonb, boolean, integer, real } from "drizzle-orm/pg-core"
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
  chats: many(chats),
  topicMastery: many(topicMastery),
  memoryNotes: many(learnerMemoryNotes),
}))

/**
 * 2. Learner Profiles Table
 * Stores pedagogical onboarding state, active subject, skill level, and goals.
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
 * 3. Chats (Sessions) Table
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
}))

/**
 * 4. Messages Table
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
}))

/**
 * 5. Widget States Table
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
 * 6. Topic Mastery Table
 * Deterministic quantitative memory tracking problem accuracy and practice counts.
 */
export const topicMastery = pgTable("topic_mastery", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  topic: text("topic").notNull(),
  masteryScore: real("mastery_score").default(0.0).notNull(), // 0.0 to 1.0
  totalProblems: integer("total_problems").default(0).notNull(),
  correctProblems: integer("correct_problems").default(0).notNull(),
  lastPracticedAt: timestamp("last_practiced_at", { mode: "date" }).defaultNow().notNull(),
})

export const topicMasteryRelations = relations(topicMastery, ({ one }) => ({
  user: one(users, {
    fields: [topicMastery.userId],
    references: [users.id],
  }),
}))

/**
 * 7. Learner Memory Notes Table
 * Qualitative pedagogical notes recorded autonomously by Shawky's AI agent.
 */
export const learnerMemoryNotes = pgTable("learner_memory_notes", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  topic: text("topic").notNull(),
  observation: text("observation").notNull(),
  recommendation: text("recommendation"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
})

export const learnerMemoryNotesRelations = relations(learnerMemoryNotes, ({ one }) => ({
  user: one(users, {
    fields: [learnerMemoryNotes.userId],
    references: [users.id],
  }),
}))

// Type inference exports
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type LearnerProfile = typeof learnerProfiles.$inferSelect
export type NewLearnerProfile = typeof learnerProfiles.$inferInsert

export type Chat = typeof chats.$inferSelect
export type NewChat = typeof chats.$inferInsert

export type Message = typeof messages.$inferSelect
export type NewMessage = typeof messages.$inferInsert

export type WidgetState = typeof widgetStates.$inferSelect
export type NewWidgetState = typeof widgetStates.$inferInsert

export type TopicMastery = typeof topicMastery.$inferSelect
export type NewTopicMastery = typeof topicMastery.$inferInsert

export type LearnerMemoryNote = typeof learnerMemoryNotes.$inferSelect
export type NewLearnerMemoryNote = typeof learnerMemoryNotes.$inferInsert
