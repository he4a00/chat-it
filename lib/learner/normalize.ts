/**
 * Combining marks to strip before matching: Latin combining diacritics plus
 * Arabic harakat (tashkeel), so `اَلْجَبْر` and `الجبر` collapse to the same key.
 */
const COMBINING_MARKS = /[\u0300-\u036f\u064b-\u065f\u0670]/g

/**
 * Normalizes a free-text subject or topic into a stable match key: Unicode
 * decomposed, diacritics removed, lowercased, punctuation collapsed to spaces.
 * Latin- and Arabic-aware (`\p{L}` / `\p{N}` cover both scripts).
 */
export function normalizeKey(input: string): string {
  return input
    .normalize("NFKD")
    .replace(COMBINING_MARKS, "")
    .toLowerCase()
    .replace(/[_\-/]+/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
}

export function normalizeSubject(subject: string): string {
  const key = normalizeKey(subject)
  return key.length > 0 ? key : subject.trim().toLowerCase()
}

export function normalizeTopic(topic: string): string {
  const key = normalizeKey(topic)
  return key.length > 0 ? key : topic.trim().toLowerCase()
}
