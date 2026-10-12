"use client"

import * as React from "react"
import { useTranslation } from "react-i18next"
import {
  LOCALE_COOKIE,
  LOCALE_STORAGE_KEY,
  dirFor,
  normalizeLocale,
  type AppLocale,
} from "@/lib/i18n/settings"

/** Back-compat alias for existing call-sites. */
export type AppLanguage = AppLocale

/** Mirrors the choice into the cookie (SSR), localStorage (cross-tab) and the DOM. */
function persistLocale(locale: AppLocale) {
  if (typeof document === "undefined") return

  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch {
    // ignore
  }

  document.documentElement.lang = locale
  document.documentElement.dir = dirFor(locale)
}

/**
 * Thin bridge over the i18next instance: `language` reflects the active locale and
 * `setLanguage` switches it, persisting to the cookie so SSR stays correct.
 */
export function useLanguage() {
  const { i18n } = useTranslation()
  const language = normalizeLocale(i18n.resolvedLanguage ?? i18n.language)

  React.useEffect(() => {
    persistLocale(language)
  }, [language])

  // Keep other tabs in sync when the language changes elsewhere.
  React.useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== LOCALE_STORAGE_KEY) return
      if (event.newValue === "en" || event.newValue === "ar") {
        i18n.changeLanguage(event.newValue)
      }
    }

    window.addEventListener("storage", handleStorage)
    return () => window.removeEventListener("storage", handleStorage)
  }, [i18n])

  const setLanguage = React.useCallback(
    (next: AppLocale) => {
      i18n.changeLanguage(next)
      persistLocale(next)
    },
    [i18n],
  )

  return { language, setLanguage }
}
