export const LOCALES = ["en", "ar"] as const

export type AppLocale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: AppLocale = "en"

/** Cookie read on the server (SSR `lang`/`dir`) and written on the client. */
export const LOCALE_COOKIE = "shawky_lang"

/** localStorage mirror, kept for cross-tab sync and legacy call-sites. */
export const LOCALE_STORAGE_KEY = "shawky_app_language"

export const NAMESPACES = [
  "common",
  "sidebar",
  "chat",
  "widgets",
  "learner",
  "onboarding",
] as const

export const DEFAULT_NAMESPACE = "common"

export function isAppLocale(value: unknown): value is AppLocale {
  return value === "en" || value === "ar"
}

/** Coerces any tag ("ar-EG", "en-US", undefined) to a supported locale. */
export function normalizeLocale(value: string | null | undefined): AppLocale {
  if (!value) return DEFAULT_LOCALE
  return value.toLowerCase().startsWith("ar") ? "ar" : "en"
}

export function dirFor(locale: AppLocale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr"
}
