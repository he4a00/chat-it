"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { MoonIcon, SunIcon } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { cn } from "cn"

interface ThemeSwitchProps {
  className?: string
}

/**
 * Dark-mode toggle: a compact Switch flanked by sun/moon icons.
 */
export function ThemeSwitch({ className }: ThemeSwitchProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  const isDark = mounted && resolvedTheme === "dark"

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <SunIcon
        aria-hidden="true"
        className={cn(
          "size-3.5 shrink-0 transition-colors",
          isDark ? "text-muted-foreground/50" : "text-primary",
        )}
      />
      <Switch
        size="sm"
        checked={isDark}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
        aria-label="Toggle dark mode"
      />
      <MoonIcon
        aria-hidden="true"
        className={cn(
          "size-3.5 shrink-0 transition-colors",
          isDark ? "text-primary" : "text-muted-foreground/50",
        )}
      />
    </div>
  )
}
