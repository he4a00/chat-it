import enCommon from "@/public/locales/en/common.json"
import enSidebar from "@/public/locales/en/sidebar.json"
import enChat from "@/public/locales/en/chat.json"
import enWidgets from "@/public/locales/en/widgets.json"
import enLearner from "@/public/locales/en/learner.json"
import enOnboarding from "@/public/locales/en/onboarding.json"
import arCommon from "@/public/locales/ar/common.json"
import arSidebar from "@/public/locales/ar/sidebar.json"
import arChat from "@/public/locales/ar/chat.json"
import arWidgets from "@/public/locales/ar/widgets.json"
import arLearner from "@/public/locales/ar/learner.json"
import arOnboarding from "@/public/locales/ar/onboarding.json"
import type { AppLocale } from "./settings"

/**
 * Bundled statically (no async backend) so the first render is already
 * translated — no loading flash, no network dependency.
 */
export const resources = {
  en: {
    common: enCommon,
    sidebar: enSidebar,
    chat: enChat,
    widgets: enWidgets,
    learner: enLearner,
    onboarding: enOnboarding,
  },
  ar: {
    common: arCommon,
    sidebar: arSidebar,
    chat: arChat,
    widgets: arWidgets,
    learner: arLearner,
    onboarding: arOnboarding,
  },
} satisfies Record<AppLocale, Record<string, Record<string, unknown>>>
