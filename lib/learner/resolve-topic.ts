import "server-only"
import { and, eq } from "drizzle-orm"
import { db, topics } from "@/lib/db"
import { normalizeSubject, normalizeTopic } from "./normalize"

export interface ResolvedTopic {
  topicId: string
  subject: string
  subjectKey: string
  topic: string
  topicLabel: string
}

const FALLBACK = "General"

/**
 * Resolves a free-text subject/topic pair to a canonical registry row, creating
 * it lazily when unseen. Normalized keys merge synonyms into one row, so any
 * subject works while mastery aggregation stays clean.
 */
export async function resolveTopic(
  subjectInput: string | null | undefined,
  topicInput: string | null | undefined,
): Promise<ResolvedTopic> {
  const subject = (subjectInput ?? "").trim() || FALLBACK
  const topic = (topicInput ?? "").trim() || FALLBACK
  const subjectKey = normalizeSubject(subject)
  const topicKey = normalizeTopic(topic)

  const [existing] = await db
    .select()
    .from(topics)
    .where(and(eq(topics.subjectKey, subjectKey), eq(topics.topicKey, topicKey)))
    .limit(1)

  if (existing) {
    return {
      topicId: existing.id,
      subject: existing.subject,
      subjectKey: existing.subjectKey,
      topic: existing.topic,
      topicLabel: topic,
    }
  }

  const [created] = await db
    .insert(topics)
    .values({ subject, subjectKey, topic, topicKey, aliases: [] })
    .onConflictDoNothing()
    .returning()

  const row =
    created ??
    (
      await db
        .select()
        .from(topics)
        .where(and(eq(topics.subjectKey, subjectKey), eq(topics.topicKey, topicKey)))
        .limit(1)
    )[0]

  if (!row) {
    throw new Error(`Failed to resolve topic "${topic}" for subject "${subject}"`)
  }

  return {
    topicId: row.id,
    subject: row.subject,
    subjectKey: row.subjectKey,
    topic: row.topic,
    topicLabel: topic,
  }
}
