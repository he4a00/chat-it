"use client"

import * as React from "react"
import { Markdown } from "@/components/chat/markdown"
import { Layers, ChevronLeft, ChevronRight, RotateCw, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "cn"

export interface FlashcardItem {
  id: string
  front: string
  back: string
  conceptTag?: string
}

export interface FlashcardDeckWidgetProps {
  messageId?: string
  topic: string
  cards: FlashcardItem[]
  isAr?: boolean
  onDeckCompleted?: (feedbackPrompt: string) => void
}

export function FlashcardDeckWidget({
  topic,
  cards = [],
  isAr = false,
  onDeckCompleted,
}: FlashcardDeckWidgetProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [isFlipped, setIsFlipped] = React.useState(false)
  const [masteredIds, setMasteredIds] = React.useState<Set<string>>(new Set())

  if (cards.length === 0) return null

  const currentCard = cards[currentIndex] || cards[0]
  const isMastered = masteredIds.has(currentCard.id)

  const handleNext = () => {
    setIsFlipped(false)
    setCurrentIndex((prev) => (prev + 1) % cards.length)
  }

  const handlePrev = () => {
    setIsFlipped(false)
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length)
  }

  const handleToggleMastered = (cardId: string) => {
    setMasteredIds((prev) => {
      const next = new Set(prev)
      if (next.has(cardId)) {
        next.delete(cardId)
      } else {
        next.add(cardId)
      }

      // Check if all cards mastered
      if (next.size === cards.length && onDeckCompleted) {
        const feedback = isAr
          ? `[إتمام البطاقات التعليمية]: راجعت جميع بطاقات "${topic}" (${cards.length} بطاقات) وأتقنتها كاملة! ما هو التطبيق العملي أو المسألة التي نختبر بها هذه القوانين؟`
          : `[Flashcard Deck Completed]: I reviewed and mastered all ${cards.length} flashcards on "${topic}"! Could you give me an applied problem to test these formulas?`
        onDeckCompleted(feedback)
      }

      return next
    })
  }

  return (
    <div className="my-3.5 rounded-2xl border border-border/80 bg-card/90 shadow-sm overflow-hidden font-sans transition-all">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 border-b border-border/60 bg-muted/30">
        <div className="flex items-center gap-2 text-xs font-semibold text-purple-400">
          <Layers className="size-4 shrink-0" />
          <span>{isAr ? "مجموعة بطاقات تفاعلية" : "Interactive Flashcard Deck"}</span>
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
          onClick={() => setIsFlipped(!isFlipped)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              setIsFlipped(!isFlipped)
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
              <span>{isFlipped ? (isAr ? "الوجه الخلفي (التوضيح)" : "Back (Explanation)") : (isAr ? "الوجه الأمامي (المفهوم)" : "Front (Concept)")}</span>
            </span>
            <span className="text-[10px] opacity-70">
              {currentCard.conceptTag || (isAr ? "انقر للقلب" : "Click to flip")}
            </span>
          </div>

          {/* Central Math Content */}
          <div className="my-auto py-3 text-center text-sm sm:text-base font-medium leading-relaxed">
            <Markdown content={isFlipped ? currentCard.back : currentCard.front} />
          </div>

          {/* Flip Prompt Subtext */}
          <div className="text-center text-[10px] text-muted-foreground/60 font-mono">
            {isAr ? "اضغط للمشاهدة العكسية" : "Click card to flip"}
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
            <span className="hidden sm:inline">{isAr ? "السابق" : "Prev"}</span>
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
            <span>{isMastered ? (isAr ? "متقن ✓" : "Mastered ✓") : (isAr ? "أتقنت المفهوم؟" : "Mark as Mastered")}</span>
          </Button>

          {/* Next Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            className="rounded-full text-xs h-8 px-3 gap-1"
          >
            <span className="hidden sm:inline">{isAr ? "التالي" : "Next"}</span>
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
