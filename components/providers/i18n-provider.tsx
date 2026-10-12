"use client"

import * as React from "react"
import { I18nextProvider } from "react-i18next"
import { createI18n } from "@/lib/i18n"
import type { AppLocale } from "@/lib/i18n/settings"

/**
 * Provides a request-scoped i18next instance initialized with the server-resolved
 * locale, so the first client render matches the server HTML exactly.
 */
export function I18nProvider({
  locale,
  children,
}: {
  locale: AppLocale
  children: React.ReactNode
}) {
  const [instance] = React.useState(() => createI18n(locale))

  return <I18nextProvider i18n={instance}>{children}</I18nextProvider>
}
