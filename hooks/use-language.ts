"use client"

import * as React from "react"

export type AppLanguage = "en" | "ar"

const LANGUAGE_STORAGE_KEY = "shawky_app_language"

let currentLanguage: AppLanguage = "en"
const listeners = new Set<() => void>()

function notify() {
  for (const listener of listeners) {
    listener()
  }
}

function applyLanguageToDom(lang: AppLanguage) {
  if (typeof document !== "undefined") {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr"
  }
}

function getClientLanguage(): AppLanguage {
  if (typeof window === "undefined") return "en"
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY)
    if (saved === "ar" || saved === "en") {
      currentLanguage = saved
      return saved
    }
  } catch {
    // fallback
  }
  return currentLanguage
}

export function useLanguage() {
  const language = React.useSyncExternalStore(
    (onStoreChange) => {
      listeners.add(onStoreChange)
      const handleStorage = (e: StorageEvent) => {
        if (
          e.key === LANGUAGE_STORAGE_KEY &&
          (e.newValue === "en" || e.newValue === "ar")
        ) {
          currentLanguage = e.newValue
          applyLanguageToDom(currentLanguage)
          onStoreChange()
        }
      }
      window.addEventListener("storage", handleStorage)
      return () => {
        listeners.delete(onStoreChange)
        window.removeEventListener("storage", handleStorage)
      }
    },
    getClientLanguage,
    (): AppLanguage => "en"
  )

  React.useEffect(() => {
    applyLanguageToDom(language)
  }, [language])

  const setLanguage = React.useCallback((next: AppLanguage) => {
    currentLanguage = next
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, next)
    } catch {
      // ignore
    }
    applyLanguageToDom(next)
    notify()
  }, [])

  return { language, setLanguage }
}
