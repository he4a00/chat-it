"use client"

import { motion, useReducedMotion } from "motion/react"
import { cn } from "cn"
import { shawkyAvatar } from "@/lib/brand"

interface ThinkingIndicatorProps {
  label?: string
  className?: string
}

/**
 * Animated "Shawky is thinking…" indicator: a softly pulsing avatar with a ripple.
 */
export function ThinkingIndicator({ label, className }: ThinkingIndicatorProps) {
  const reduce = useReducedMotion()

  return (
    <div className={cn("flex items-center gap-2.5 text-xs text-muted-foreground font-sans", className)}>
      <span className="relative flex items-center justify-center" aria-hidden="true">
        {!reduce ? (
          <motion.span
            className="absolute inset-0 rounded-md bg-primary/25"
            animate={{ scale: [1, 1.6, 1], opacity: [0.55, 0, 0.55] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
        ) : null}
        <motion.img
          src={shawkyAvatar(64)}
          alt=""
          width={24}
          height={24}
          className="relative size-6 rounded-lg ring-1 ring-border/60"
          animate={reduce ? undefined : { scale: [1, 1.06, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
      </span>
      {label ? <span>{label}</span> : null}
    </div>
  )
}
