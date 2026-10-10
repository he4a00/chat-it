"use client"

import * as React from "react"
import { SearchIcon, XIcon } from "lucide-react"
import { SidebarInput } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTranslation } from 'react-i18next'

interface SidebarSearchProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export function SidebarSearch({
  value,
  onChange,
  className,
}: SidebarSearchProps) {
  const { t } = useTranslation()
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Keyboard shortcut "/" to focus search when not in another input
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <div className={cn("relative w-full", className)}>
      <SearchIcon className="pointer-events-none absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground select-none" />
      <SidebarInput
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('searchSessions', 'Search sessions...')}
        aria-label={t('searchPreviousChatSessions', 'Search previous chat sessions')}
        className="h-9 w-full rounded-full border-sidebar-border bg-sidebar/50 pe-8 ps-8.5 text-xs placeholder:text-muted-foreground/70 focus-visible:ring-1 focus-visible:ring-sidebar-ring"
      />
      {value ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => {
            onChange("")
            inputRef.current?.focus()
          }}
          className="absolute end-1.5 top-1/2 size-6 rounded-full -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label={t('clearSearch', 'Clear search')}
        >
          <XIcon className="size-3" />
        </Button>
      ) : (
        <kbd className="pointer-events-none absolute end-2.5 top-1/2 -translate-y-1/2 rounded-full border border-sidebar-border bg-sidebar-accent/50 px-1.5 py-0.2 text-[10px] font-mono text-muted-foreground select-none">
          /
        </kbd>
      )}
    </div>
  )
}
