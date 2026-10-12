"use client"

import { useTranslation } from "react-i18next"
import { CheckIcon, GlobeIcon } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/hooks/use-language"

// Endonyms: a language's own name is never translated.
const LANGUAGES = [
  { id: "en", label: "English", hint: "LTR" },
  { id: "ar", label: "العربية", hint: "RTL" },
] as const

/**
 * Language picker: a globe button opening a dropdown of the supported locales.
 */
export function LanguageMenu() {
  const { t } = useTranslation()
  const { language, setLanguage } = useLanguage()

  const choose = (id: "en" | "ar") => {
    setLanguage(id)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t("sidebar:language.change")}
            className="h-6 w-auto gap-1 rounded-full px-1.5 text-[10px] font-semibold text-muted-foreground hover:bg-background/70 hover:text-foreground"
          >
            <GlobeIcon className="size-3.5" />
            <span>{language.toUpperCase()}</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t("sidebar:language.title")}</DropdownMenuLabel>
          {LANGUAGES.map((option) => (
            <DropdownMenuItem key={option.id} onClick={() => choose(option.id)}>
              <span className="flex-1">{option.label}</span>
              <span className="text-[10px] text-muted-foreground">{option.hint}</span>
              {language === option.id ? <CheckIcon className="size-3.5 text-primary" /> : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
