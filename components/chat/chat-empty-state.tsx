"use client"

import * as React from "react"
import { useUser } from "@clerk/nextjs"
import { HistoryIcon } from "lucide-react"
import { useLanguage } from "@/hooks/use-language"
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
  const { language } = useLanguage()
  const isAr = language === "ar"

  const firstName = user?.firstName || (isAr ? "يا بطل" : "Learner")

  const modes = [
    {
      id: "learn",
      title: isAr ? "تعلّم (Learn)" : "Learn",
      icon: LearnModeIcon,
      hoverClass: "hover:border-blue-500/60 hover:bg-blue-500/[0.06] hover:text-blue-500 dark:hover:text-blue-400",
      prompt: isAr
        ? "اشرح لي مفهوماً رياضياً أساسياً بأسلوب سقراطي تفاعلي مع أمثلة حدسية وتدرج خطوة بخطوة."
        : "Teach me a core mathematical concept with intuitive step-by-step Socratic guidance.",
    },
    {
      id: "flashcards",
      title: isAr ? "بطاقات (Flashcards)" : "Flashcards",
      icon: FlashcardsModeIcon,
      hoverClass: "hover:border-purple-500/60 hover:bg-purple-500/[0.06] hover:text-purple-500 dark:hover:text-purple-400",
      prompt: isAr
        ? "أنشئ لي مجموعة بطاقات تعليمية تفاعلية (Flashcards) لمراجعة وحفظ أهم القوانين والصيغ الرياضية."
        : "Create an interactive flashcard deck of essential STEM formulas for quick drill and active recall.",
    },
    {
      id: "quiz",
      title: isAr ? "اختبار (Quiz)" : "Quiz",
      icon: QuizModeIcon,
      hoverClass: "hover:border-emerald-500/60 hover:bg-emerald-500/[0.06] hover:text-emerald-500 dark:hover:text-emerald-400",
      prompt: isAr
        ? "اطرح عليّ اختباراً تفاعلياً (Quiz) من أسئلة متعددة الخيارات لاختبار استيعابي وتقديم تغذية راجعة فورية."
        : "Give me an interactive diagnostic quiz challenge on a key STEM topic to test my understanding.",
    },
  ]

  const suggestions = isAr
    ? [
        "ما هو المشتق؟ ولماذا نستخدمه؟",
        "اشرح لي المتتابعات والمتسلسلات ببساطة.",
        "ما الفرق بين المتجه والمقياس؟",
      ]
    : [
        "What is a derivative, intuitively?",
        "Explain limits with a simple example.",
        "Difference between a vector and a scalar?",
      ]

  return (
    <div className="flex flex-col items-center justify-center px-4 max-w-xl w-full mx-auto my-auto text-center select-none font-sans space-y-6">
      {/* Shawky Sa'idi Avatar Emblem */}
      <div className="relative group">
        <div className="size-20 rounded-full overflow-hidden border-2 border-primary/40 shadow-[0_0_35px_-5px_rgba(46,103,255,0.3)] bg-card ring-4 ring-primary/10 transition-transform group-hover:scale-105 duration-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/shawky-avatar.png"
            alt="Shawky (شوقي)"
            className="size-full object-cover"
            width={80}
            height={80}
          />
        </div>
      </div>

      {/* Clean Greeting */}
      <div className="space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-sans">
          {isAr ? `أهلاً بك، ${firstName}!` : `What shall we solve today, ${firstName}?`}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground/80 max-w-sm mx-auto leading-relaxed font-sans">
          {isAr
            ? "رفيقك السقراطي للعلوم والرياضيات. اختر وضعاً للبدء أو اطرح مسألتك."
            : "Your personal Socratic STEM companion. Choose a mode to start or ask a problem."}
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
            {isAr ? "متابعة" : "Continue"}: {recentSession.title}
          </span>
        </button>
      ) : null}
    </div>
  )
}
