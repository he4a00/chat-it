"use client"

import { motion } from "motion/react"
import { cn } from "cn"

interface ThinkingIndicatorProps {
  label?: string
  className?: string
}

/**
 * Animated "Shawky is thinking…" indicator: three staggered, fading dots.
 */
export function ThinkingIndicator({ label, className }: ThinkingIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-2 text-xs text-muted-foreground font-sans", className)}>
      <span className="flex items-center gap-1" aria-hidden="true">
        {[0, 1, 2].map((index) => (
          <motion.span
            key={index}
            className="size-1.5 rounded-full bg-primary"
            animate={{ y: [0, -3, 0], opacity: [0.35, 1, 0.35] }}
            transition={{
              duration: 0.9,
              repeat: Infinity,
              ease: "easeInOut",
              delay: index * 0.15,
            }}
          />
        ))}
      </span>
      {label ? <span>{label}</span> : null}
    </div>
  )
}
