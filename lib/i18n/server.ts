import "server-only"
import { cookies } from "next/headers"
import { DEFAULT_LOCALE, LOCALE_COOKIE, isAppLocale, type AppLocale } from "./settings"

/**
 * Resolves the request's locale from the cookie, so `<html lang dir>` is correct
 * in the server-rendered HTML (no LTR flash for Arabic).
 */
export async function getLocale(): Promise<AppLocale> {
  const store = await cookies()
  const value = store.get(LOCALE_COOKIE)?.value
  return isAppLocale(value) ? value : DEFAULT_LOCALE
}
