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

const LANGUAGES = [
  { id: "en", label: "English", hint: "LTR" },
  { id: "ar", label: "العربية", hint: "RTL" },
] as const

/**
 * Language picker: a globe button opening a dropdown of the supported locales.
 */
export function LanguageMenu() {
  const { i18n } = useTranslation()
  const { language, setLanguage } = useLanguage()

  const choose = (id: "en" | "ar") => {
    i18n.changeLanguage(id)
    setLanguage(id)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Change language"
            className="size-6 rounded-full text-muted-foreground hover:bg-background/70 hover:text-foreground"
          >
            <GlobeIcon className="size-3.5" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Language · اللغة</DropdownMenuLabel>
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
