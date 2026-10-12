"use client"

import * as React from "react"
import { CheckIcon, GlobeIcon, LaptopIcon, MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"
import { useLanguage, type AppLanguage } from "@/hooks/use-language"
import { cn } from "@/lib/utils"
import { useTranslation } from 'react-i18next'

export function UserPreferencesPage() {
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()
  const { language, setLanguage } = useLanguage()

  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  if (!mounted) {
    return (
      <div className="p-6 text-sm text-muted-foreground animate-pulse">
        {t("sidebar:settings.loading")}
      </div>
    )
  }

  const THEME_OPTIONS: Array<{
    id: string
    label: string
    icon: React.ComponentType<{ className?: string }>
    description: string
  }> = [
    {
      id: "light",
      label: t("sidebar:settings.theme.light"),
      icon: SunIcon,
      description: t("sidebar:settings.theme.lightDescription"),
    },
    {
      id: "dark",
      label: t("sidebar:settings.theme.dark"),
      icon: MoonIcon,
      description: t("sidebar:settings.theme.darkDescription"),
    },
    {
      id: "system",
      label: t("sidebar:settings.theme.system"),
      icon: LaptopIcon,
      description: t("sidebar:settings.theme.systemDescription"),
    },
  ]

  const LANGUAGE_OPTIONS: Array<{
    id: AppLanguage
    label: string
    sublabel: string
    direction: "ltr" | "rtl"
  }> = [
    {
      id: "en",
      label: t("sidebar:settings.language.english"),
      sublabel: t("sidebar:settings.language.englishDescription"),
      direction: "ltr",
    },
    {
      id: "ar",
      label: t("sidebar:settings.language.arabic"),
      sublabel: t("sidebar:settings.language.arabicDescription"),
      direction: "rtl",
    },
  ]

  return (
    <div className="flex flex-col gap-6 p-6 max-w-xl text-foreground font-sans">
      {/* Header */}
      <div className="border-b border-border/80 pb-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          {t("sidebar:settings.title")}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          {t("sidebar:settings.subtitle")}
        </p>
      </div>

      {/* Theme Section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <MoonIcon className="size-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            {t("sidebar:settings.theme.title")}
          </h3>
        </div>
        <p className="text-xs text-muted-foreground">
          {t("sidebar:settings.theme.description")}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          {THEME_OPTIONS.map((opt) => {
            const Icon = opt.icon
            const isSelected = theme === opt.id

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setTheme(opt.id)}
                className={cn(
                  "flex flex-col items-start p-3 rounded-xl border text-start transition-all duration-150 cursor-pointer relative",
                  isSelected
                    ? "border-primary bg-primary/5 text-primary shadow-2xs ring-1 ring-primary/30"
                    : "border-border bg-card/60 hover:bg-accent/50 hover:border-border text-foreground"
                )}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <div
                    className={cn(
                      "flex size-7 items-center justify-center rounded-lg transition-colors",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Icon className="size-3.5" />
                  </div>
                  {isSelected && (
                    <span className="flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <CheckIcon className="size-2.5 stroke-[3]" />
                    </span>
                  )}
                </div>

                <span className="text-xs font-semibold">{opt.label}</span>
                <span className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                  {opt.description}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Language Section */}
      <div className="flex flex-col gap-3 border-t border-border/80 pt-6">
        <div className="flex items-center gap-2">
          <GlobeIcon className="size-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            {t("sidebar:settings.language.title")}
          </h3>
        </div>
        <p className="text-xs text-muted-foreground">
          {t("sidebar:settings.language.description")}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {LANGUAGE_OPTIONS.map((opt) => {
            const isSelected = language === opt.id

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setLanguage(opt.id)}
                className={cn(
                  "flex items-center justify-between p-3.5 rounded-xl border text-start transition-all duration-150 cursor-pointer",
                  isSelected
                    ? "border-primary bg-primary/5 text-primary shadow-2xs ring-1 ring-primary/30"
                    : "border-border bg-card/60 hover:bg-accent/50 hover:border-border text-foreground"
                )}
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">
                      {opt.label}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-mono">
                      {opt.direction}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground truncate">
                    {opt.sublabel}
                  </span>
                </div>

                {isSelected && (
                  <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground ms-2">
                    <CheckIcon className="size-2.5 stroke-[3]" />
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
