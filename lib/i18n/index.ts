import i18next, { type i18n } from "i18next"
import { resources } from "./resources"
import {
  DEFAULT_LOCALE,
  DEFAULT_NAMESPACE,
  NAMESPACES,
  type AppLocale,
} from "./settings"

/**
 * Creates a fresh, synchronously-initialized i18next instance for one locale.
 *
 * A new instance per request (server) / per mount (client) avoids cross-request
 * language leakage from a module singleton, and `I18nextProvider` supplies it via
 * React context — so `initReactI18next` is not needed (and must not be used, as it
 * would register a global default instance).
 */
export function createI18n(locale: AppLocale): i18n {
  const instance = i18next.createInstance()

  instance.init({
    resources,
    lng: locale,
    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: ["en", "ar"],
    defaultNS: DEFAULT_NAMESPACE,
    ns: [...NAMESPACES],
    interpolation: { escapeValue: false },
    returnEmptyString: false,
    keySeparator: ".",
    ...(process.env.NODE_ENV !== "production"
      ? {
          missingKeyHandler: (lngs: readonly string[], ns: string, key: string) => {
            console.error(`[i18n] missing key "${ns}:${key}" for ${lngs.join(", ")}`)
          },
        }
      : {}),
  })

  return instance
}
