"use client"

import * as React from "react"
import { useTranslation } from "react-i18next"
import { Markdown } from "@/components/chat/markdown"
import { Layers, ChevronLeft, ChevronRight, RotateCw, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "cn"
import { useSubmitWidgetState } from "@/server/hooks/use-learner"

/** Module-scope timestamp helper (keeps render pure). */
const nowMs = () => Date.now()

export interface FlashcardItem {
  id: string
  front: string
  back: string
  conceptTag?: string
}

export type FlashcardGrade = "mastered" | "review"

export interface FlashcardDeckWidgetProps {
  messageId?: string
  topic: string
  subject?: string
  cards: FlashcardItem[]
  initialMasteredIds?: string[]
  initialGraded?: Record<string, FlashcardGrade>
  onDeckCompleted?: (feedbackPrompt: string) => void
}

export function FlashcardDeckWidget({
  messageId,
  topic,
  subject,
  cards = [],
  initialMasteredIds,
  initialGraded,
  onDeckCompleted,
}: FlashcardDeckWidgetProps) {
  const { t } = useTranslation("widgets")
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [isFlipped, setIsFlipped] = React.useState(false)
  const [masteredIds, setMasteredIds] = React.useState<Set<string>>(
    () => new Set(initialMasteredIds ?? []),
  )
  const [graded, setGraded] = React.useState<Record<string, FlashcardGrade>>(
    () => initialGraded ?? {},
  )
  const [hasSaved, setHasSaved] = React.useState(
    () =>
      Boolean(initialGraded && Object.keys(initialGraded).length > 0) ||
      Boolean(initialMasteredIds && initialMasteredIds.length > 0),
  )

  const submitWidgetMutation = useSubmitWidgetState()

  // Best-effort time-on-task, measured from mount to submission.
  const startedAtRef = React.useRef<number>(0)
  React.useEffect(() => {
    startedAtRef.current = nowMs()
  }, [])

  if (cards.length === 0) return null

  const currentCard = cards[currentIndex] || cards[0]
  const isMastered = masteredIds.has(currentCard.id)

  // Persist once, when every card has been graded (mirrors the quiz's
  // "save on completion") so repeated grading toggles never double-record.
  const persistIfComplete = (nextGraded: Record<string, FlashcardGrade>, nextMastered: Set<string>) => {
    if (hasSaved || !messageId) return
    if (Object.keys(nextGraded).length < cards.length) return

    setHasSaved(true)

    const items = cards.map((card) => ({
      itemId: card.id,
      outcome: (nextMastered.has(card.id) ? "mastered" : "review") as FlashcardGrade,
    }))

    try {
      submitWidgetMutation.mutate({
        messageId,
        widgetType: "flashcard",
        topic,
        subject,
        payload: { topic, cards },
        userSubmission: { graded: nextGraded, masteredIds: Array.from(nextMastered) },
        items,
        timeSpentMs: startedAtRef.current ? nowMs() - startedAtRef.current : null,
        isCompleted: true,
        score: Math.round((nextMastered.size / cards.length) * 100),
      })
    } catch {
      // Non-blocking background persistence
    }
  }

  const handleFlip = () => {
    const nextFlipped = !isFlipped
    setIsFlipped(nextFlipped)

    // Flipping a card counts as studying it (graded "review" until mastered).
    if (nextFlipped && !graded[currentCard.id]) {
      const nextGraded = { ...graded, [currentCard.id]: "review" as FlashcardGrade }
      setGraded(nextGraded)
      persistIfComplete(nextGraded, masteredIds)
    }
  }

  const handleNext = () => {
    setIsFlipped(false)
    setCurrentIndex((prev) => (prev + 1) % cards.length)
  }

  const handlePrev = () => {
    setIsFlipped(false)
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length)
  }

  const handleToggleMastered = (cardId: string) => {
    const nextMastered = new Set(masteredIds)
    if (nextMastered.has(cardId)) {
      nextMastered.delete(cardId)
    } else {
      nextMastered.add(cardId)
    }
    setMasteredIds(nextMastered)

    const nextGraded = {
      ...graded,
      [cardId]: (nextMastered.has(cardId) ? "mastered" : "review") as FlashcardGrade,
    }
    setGraded(nextGraded)

    // Check if all cards mastered
    if (nextMastered.size === cards.length && onDeckCompleted) {
      onDeckCompleted(t("flashcard.feedback.completed", { count: cards.length, topic }))
    }

    persistIfComplete(nextGraded, nextMastered)
  }

  return (
    <div className="my-3.5 rounded-2xl border border-border/80 bg-card/90 shadow-sm overflow-hidden font-sans transition-all">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 border-b border-border/60 bg-muted/30">
        <div className="flex items-center gap-2 text-xs font-semibold text-purple-400">
          <Layers className="size-4 shrink-0" />
          <span>{t("flashcard.title")}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
            {topic}
          </span>
          <span className="text-[11px] font-mono text-muted-foreground">
            {currentIndex + 1} / {cards.length}
          </span>
        </div>
      </div>

      {/* Main Flashcard Interactive Stage */}
      <div className="p-4 sm:p-5 flex flex-col items-center">
        {/* Flip Card Container */}
        <div
          role="button"
          tabIndex={0}
          onClick={handleFlip}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              handleFlip()
            }
          }}
          className={cn(
            "relative w-full min-h-[170px] sm:min-h-[190px] rounded-xl border p-5 flex flex-col justify-between cursor-pointer select-none transition-all duration-200 shadow-xs hover:border-purple-500/50 hover:shadow-sm",
            isFlipped
              ? "bg-purple-950/15 border-purple-500/30 text-purple-100"
              : "bg-background/80 border-border/80 text-foreground"
          )}
        >
          {/* Card Meta Indicator */}
          <div className="flex items-center justify-between text-[11px] text-muted-foreground w-full font-mono">
            <span className="flex items-center gap-1">
              <RotateCw className="size-3 text-purple-400" />
              <span>{isFlipped ? t("flashcard.back") : t("flashcard.front")}</span>
            </span>
            <span className="text-[10px] opacity-70">
              {currentCard.conceptTag || t("flashcard.clickToFlip")}
            </span>
          </div>

          {/* Central Math Content */}
          <div className="my-auto py-3 text-center text-sm sm:text-base font-medium leading-relaxed">
            <Markdown content={isFlipped ? currentCard.back : currentCard.front} />
          </div>

          {/* Flip Prompt Subtext */}
          <div className="text-center text-[10px] text-muted-foreground/60 font-mono">
            {t("flashcard.flipHint")}
          </div>
        </div>

        {/* Deck Navigation & Action Controls */}
        <div className="w-full flex items-center justify-between pt-4 gap-2">
          {/* Previous Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrev}
            className="rounded-full text-xs h-8 px-3 gap-1"
          >
            <ChevronLeft className="size-3.5" />
            <span className="hidden sm:inline">{t("flashcard.prev")}</span>
          </Button>

          {/* Self-Rating Mastery Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggleMastered(currentCard.id)}
            className={cn(
              "rounded-full text-xs h-8 px-3.5 gap-1.5 transition-colors font-sans",
              isMastered
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <CheckCircle2 className={cn("size-3.5", isMastered && "text-emerald-500")} />
            <span>{isMastered ? t("flashcard.mastered") : t("flashcard.markMastered")}</span>
          </Button>

          {/* Next Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            className="rounded-full text-xs h-8 px-3 gap-1"
          >
            <span className="hidden sm:inline">{t("flashcard.next")}</span>
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
