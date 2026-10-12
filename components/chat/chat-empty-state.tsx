"use client"

import { useUser } from "@clerk/nextjs"
import { useTranslation } from "react-i18next"
import { HistoryIcon } from "lucide-react"
import { shawkyAvatar } from "@/lib/brand"
import { LearnModeIcon, FlashcardsModeIcon, QuizModeIcon } from "@/components/chat/mode-icons"

interface ChatEmptyStateProps {
  onSelectPrompt: (prompt: string) => void
  recentSession?: { id: string; title: string } | null
  onOpenSession?: (id: string) => void
}

export function ChatEmptyState({
  onSelectPrompt,
  recentSession,
  onOpenSession,
}: ChatEmptyStateProps) {
  const { user } = useUser()
  const { t } = useTranslation("chat")

  const firstName = user?.firstName || t("empty.fallbackName")

  const modes = [
    {
      id: "learn",
      title: t("empty.modes.learn"),
      icon: LearnModeIcon,
      hoverClass: "hover:border-blue-500/60 hover:bg-blue-500/[0.06] hover:text-blue-500 dark:hover:text-blue-400",
      prompt: t("empty.prompts.learn"),
    },
    {
      id: "flashcards",
      title: t("empty.modes.flashcards"),
      icon: FlashcardsModeIcon,
      hoverClass: "hover:border-purple-500/60 hover:bg-purple-500/[0.06] hover:text-purple-500 dark:hover:text-purple-400",
      prompt: t("empty.prompts.flashcards"),
    },
    {
      id: "quiz",
      title: t("empty.modes.quiz"),
      icon: QuizModeIcon,
      hoverClass: "hover:border-emerald-500/60 hover:bg-emerald-500/[0.06] hover:text-emerald-500 dark:hover:text-emerald-400",
      prompt: t("empty.prompts.quiz"),
    },
  ]

  const suggestions = [
    t("empty.suggestions.derivative"),
    t("empty.suggestions.limits"),
    t("empty.suggestions.vector"),
  ]

  return (
    <div className="flex flex-col items-center justify-center px-4 max-w-xl w-full mx-auto my-auto text-center select-none font-sans space-y-6">
      {/* Shawky Sa'idi Avatar Emblem */}
      <div className="relative group">
        <div className="overflow-hidden transition-transform group-hover:scale-105 duration-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={shawkyAvatar(160)}
            alt="Shawky (شوقي)"
            className=" rounded-4xl"
            width={80}
            height={80}
          />
        </div>
      </div>

      {/* Clean Greeting */}
      <div className="space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-sans">
          {t("empty.greeting", { name: firstName })}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground/80 max-w-sm mx-auto leading-relaxed font-sans">
          {t("empty.subtitle")}
        </p>
      </div>

      {/* Minimalist Triad Action Pills: Learn | Flashcards | Quiz (No Chunky Cards!) */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
        {modes.map((mode) => {
          const Icon = mode.icon
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => onSelectPrompt(mode.prompt)}
              className={`group px-4.5 py-2.5 rounded-full border border-border/80 bg-card/60 backdrop-blur-sm text-foreground/90 text-xs sm:text-sm font-medium flex items-center gap-2.5 transition-all duration-200 shadow-2xs hover:-translate-y-0.5 hover:shadow-sm font-sans ${mode.hoverClass}`}
            >
              <Icon className="size-4.5 shrink-0 transition-transform group-hover:scale-110" />
              <span>{mode.title}</span>
            </button>
          )
        })}
      </div>

      {/* Example prompts */}
      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onSelectPrompt(suggestion)}
            className="rounded-full border border-border/60 bg-muted/30 px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground font-sans"
          >
            {suggestion}
          </button>
        ))}
      </div>

      {/* Resume the most recent session */}
      {recentSession && onOpenSession ? (
        <button
          type="button"
          onClick={() => onOpenSession(recentSession.id)}
          className="mx-auto flex max-w-full items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3.5 py-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground hover:border-border font-sans"
        >
          <HistoryIcon className="size-3.5 shrink-0" />
          <span className="truncate max-w-[220px]">
            {t("empty.continue")}: {recentSession.title}
          </span>
        </button>
      ) : null}
    </div>
  )
}
