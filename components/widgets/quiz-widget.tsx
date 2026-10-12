"use client"

import * as React from "react"
import { useTranslation } from "react-i18next"
import { Markdown } from "@/components/chat/markdown"
import {
  CheckCircle2,
  XCircle,
  Lightbulb,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Trophy,
  RotateCcw,
  Send,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "cn"
import { useSubmitWidgetState } from "@/server/hooks/use-learner"

/** Module-scope timestamp helper (keeps render pure). */
const nowMs = () => Date.now()

export interface QuizOption {
  id: string
  label: string
  isCorrect: boolean
  explanation?: string
}

export interface QuizQuestionItem {
  id: string
  question: string
  options: QuizOption[]
  hint?: string
  explanation: string
}

export interface QuizWidgetProps {
  messageId?: string
  topic: string
  subject?: string
  title?: string
  // Primary multi-question payload
  questions?: QuizQuestionItem[]
  // Legacy single-question fallback
  question?: string
  options?: QuizOption[]
  hint?: string
  explanation?: string
  initialSelectedId?: string
  initialAnswers?: Record<number, string>
  onAnswerSubmitted?: (data: {
    totalQuestions: number
    correctCount: number
    scorePercentage: number
    feedbackPrompt: string
  }) => void
}

export function QuizWidget({
  messageId,
  topic,
  subject,
  title,
  questions,
  question,
  options = [],
  hint,
  explanation,
  initialSelectedId,
  initialAnswers,
  onAnswerSubmitted,
}: QuizWidgetProps) {
  const { t } = useTranslation("widgets")
  // 1. Normalize questions list (multi-question primary, fallback to single)
  const normalizedQuestions: QuizQuestionItem[] = React.useMemo(() => {
    if (Array.isArray(questions) && questions.length > 0) {
      return questions
    }
    if (question && options && options.length > 0) {
      return [
        {
          id: "q1",
          question,
          options,
          hint,
          explanation: explanation || "",
        },
      ]
    }
    return []
  }, [questions, question, options, hint, explanation])

  const totalQuestions = normalizedQuestions.length

  const submitWidgetMutation = useSubmitWidgetState()

  // Best-effort time-on-task, measured from mount to submission.
  const startedAtRef = React.useRef<number>(0)
  React.useEffect(() => {
    startedAtRef.current = nowMs()
  }, [])

  // Navigation and answers state
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [selectedAnswers, setSelectedAnswers] = React.useState<Record<number, string>>(() => {
    const map: Record<number, string> = {}
    if (initialAnswers) {
      for (const [key, value] of Object.entries(initialAnswers)) {
        map[Number(key)] = value
      }
      return map
    }
    if (initialSelectedId && totalQuestions === 1) {
      map[0] = initialSelectedId
    }
    return map
  })
  const [revealedHints, setRevealedHints] = React.useState<Record<number, boolean>>({})
  const [showResults, setShowResults] = React.useState(false)
  const [feedbackSent, setFeedbackSent] = React.useState(false)
  const [hasSavedToDb, setHasSavedToDb] = React.useState(Boolean(initialAnswers))

  if (totalQuestions === 0) return null

  const currentQ = normalizedQuestions[currentIndex] || normalizedQuestions[0]
  const currentAnswerId = selectedAnswers[currentIndex]
  const isCurrentAnswered = currentAnswerId !== undefined

  // Compute overall performance
  let correctCount = 0
  let answeredCount = 0
  normalizedQuestions.forEach((q, idx) => {
    const ansId = selectedAnswers[idx]
    if (ansId) {
      answeredCount++
      const opt = q.options.find((o) => o.id === ansId)
      if (opt?.isCorrect) {
        correctCount++
      }
    }
  })

  const scorePercentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0
  const allAnswered = answeredCount === totalQuestions

  // Handle selecting an option for the active question
  const handleSelectOption = (option: QuizOption) => {
    if (isCurrentAnswered) return // Locked after answering

    const updatedAnswers = {
      ...selectedAnswers,
      [currentIndex]: option.id,
    }
    setSelectedAnswers(updatedAnswers)

    // Check if this was the last unanswered question
    const updatedAnsweredCount = Object.keys(updatedAnswers).length
    if (updatedAnsweredCount === totalQuestions && !hasSavedToDb) {
      persistQuizResults(updatedAnswers)
    }
  }

  // Persist final quiz state to Neon via tRPC.
  const persistQuizResults = (finalAnswers: Record<number, string>) => {
    if (hasSavedToDb) return
    setHasSavedToDb(true)

    let finalCorrect = 0
    normalizedQuestions.forEach((q, idx) => {
      const ansId = finalAnswers[idx]
      const opt = q.options.find((o) => o.id === ansId)
      if (opt?.isCorrect) finalCorrect++
    })
    const finalScore = Math.round((finalCorrect / totalQuestions) * 100)

    // Per-question results for the immutable attempt log.
    const items = normalizedQuestions.map((q, idx) => {
      const ansId = finalAnswers[idx]
      if (ansId === undefined) {
        return { itemId: q.id, outcome: "skipped" as const, hintUsed: Boolean(revealedHints[idx]) }
      }
      const opt = q.options.find((o) => o.id === ansId)
      return {
        itemId: q.id,
        outcome: opt?.isCorrect ? ("correct" as const) : ("incorrect" as const),
        hintUsed: Boolean(revealedHints[idx]),
      }
    })

    try {
      submitWidgetMutation.mutate({
        messageId,
        widgetType: "quiz",
        topic,
        subject,
        payload: { title, questions: normalizedQuestions },
        userSubmission: {
          totalQuestions,
          correctCount: finalCorrect,
          scorePercentage: finalScore,
          answers: finalAnswers,
        },
        items,
        timeSpentMs: startedAtRef.current ? nowMs() - startedAtRef.current : null,
        isCompleted: true,
        score: finalScore,
      })
    } catch {
      // Non-blocking background persistence
    }
  }

  // Navigation handlers
  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
      setShowResults(false)
    }
  }

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1)
      setShowResults(false)
    } else {
      // Reached the end: open results view and persist if needed
      if (!hasSavedToDb) {
        persistQuizResults(selectedAnswers)
      }
      setShowResults(true)
    }
  }

  const handleJumpTo = (index: number) => {
    setCurrentIndex(index)
    setShowResults(false)
  }

  // Send closed-loop results prompt to Shawky
  const handleSendFeedback = () => {
    if (feedbackSent) return
    setFeedbackSent(true)

    const missedQuestions: number[] = []
    normalizedQuestions.forEach((q, idx) => {
      const ansId = selectedAnswers[idx]
      const chosen = q.options.find((o) => o.id === ansId)
      if (!chosen || !chosen.isCorrect) {
        missedQuestions.push(idx + 1)
      }
    })

    let prompt = t("quiz.feedback.intro", {
      total: totalQuestions,
      topic,
      correct: correctCount,
      score: scorePercentage,
    })

    if (missedQuestions.length > 0) {
      prompt += t("quiz.feedback.missed", {
        questions: missedQuestions
          .map((number) => t("quiz.feedback.missedQuestion", { number }))
          .join(t("quiz.feedback.separator")),
      })
    } else {
      prompt += t("quiz.feedback.perfect")
    }

    if (onAnswerSubmitted) {
      onAnswerSubmitted({
        totalQuestions,
        correctCount,
        scorePercentage,
        feedbackPrompt: prompt,
      })
    }
  }

  // Reset/retake quiz
  const handleRetake = () => {
    setSelectedAnswers({})
    setRevealedHints({})
    setShowResults(false)
    setCurrentIndex(0)
    setFeedbackSent(false)
    setHasSavedToDb(false)
  }

  const progressPercent = Math.round(((currentIndex + 1) / totalQuestions) * 100)

  return (
    <div className="my-3.5 rounded-2xl border border-border/80 bg-card/90 shadow-sm overflow-hidden font-sans transition-all">
      {/* 1. Header Bar: Topic, Question Counter & Stepper Pills */}
      <div className="px-4 sm:px-5 pt-3.5 pb-3 border-b border-border/60 bg-muted/20">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <HelpCircle className="size-4 text-primary shrink-0" />
            <span className="text-xs font-semibold text-foreground truncate">
              {title || t("quiz.title")}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0">
              {topic}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-medium text-muted-foreground tabular-nums">
              {t("quiz.questionCounter", { current: currentIndex + 1, total: totalQuestions })}
            </span>
            {allAnswered && !showResults && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowResults(true)}
                className="h-6 px-2 text-[11px] text-primary hover:bg-primary/10"
              >
                <Trophy className="size-3 me-1" />
                {t("quiz.score")}
              </Button>
            )}
          </div>
        </div>

        {/* Stepper Navigation Pills (1, 2, 3, 4...) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5">
          {normalizedQuestions.map((q, idx) => {
            const isCurrent = idx === currentIndex && !showResults
            const ansId = selectedAnswers[idx]
            const isAnswered = ansId !== undefined
            const opt = isAnswered ? q.options.find((o) => o.id === ansId) : null
            const isCorrect = opt?.isCorrect ?? false

            let pillStyle = "border-border/60 bg-background/60 text-muted-foreground hover:bg-muted/60"
            if (isCurrent) {
              pillStyle = "border-primary bg-primary text-primary-foreground font-semibold shadow-xs"
            } else if (isAnswered && isCorrect) {
              pillStyle = "border-emerald-500/50 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold"
            } else if (isAnswered && !isCorrect) {
              pillStyle = "border-rose-500/50 bg-rose-500/15 text-rose-600 dark:text-rose-400 font-semibold"
            }

            return (
              <button
                key={q.id || idx}
                type="button"
                onClick={() => handleJumpTo(idx)}
                className={cn(
                  "size-7 rounded-lg border text-xs flex items-center justify-center transition-all cursor-pointer shrink-0 font-mono",
                  pillStyle
                )}
                title={t("quiz.jumpTo", { number: idx + 1 })}
              >
                {idx + 1}
              </button>
            )
          })}

          {/* Stepper Progress Bar */}
          <div className="flex-1 ms-2 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Main Content Area: Question or Scorecard */}
      {showResults ? (
        /* Results Scorecard View */
        <div className="p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-primary/20 bg-primary/5">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0">
                <Trophy className="size-6 text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">
                  {scorePercentage === 100
                    ? t("quiz.perfect")
                    : scorePercentage >= 70
                    ? t("quiz.great")
                    : t("quiz.good")}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("quiz.resultSubtitle", { correct: correctCount, total: totalQuestions })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-2xl font-bold font-mono text-primary tabular-nums">
                {scorePercentage}%
              </span>
            </div>
          </div>

          {/* Question Breakdown List */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-muted-foreground px-1">
              {t("quiz.breakdown")}
            </div>
            <div className="grid grid-cols-1 gap-2">
              {normalizedQuestions.map((q, idx) => {
                const ansId = selectedAnswers[idx]
                const opt = q.options.find((o) => o.id === ansId)
                const isCorrect = opt?.isCorrect ?? false

                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-background/50 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {isCorrect ? (
                        <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle className="size-4 text-rose-500 shrink-0" />
                      )}
                      <span className="font-semibold shrink-0">Q{idx + 1}:</span>
                      <span className="truncate text-muted-foreground font-sans">
                        {q.question.replace(/[$#*`]/g, "")}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleJumpTo(idx)}
                      className="text-primary hover:underline text-xs shrink-0 ms-2 cursor-pointer font-medium"
                    >
                      {t("quiz.review")}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Socratic Feedback Loop Action */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border/60">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetake}
              className="w-full sm:w-auto text-xs"
            >
              <RotateCcw className="size-3.5 me-1.5" />
              {t("quiz.retake")}
            </Button>

            <Button
              variant={feedbackSent ? "outline" : "default"}
              size="sm"
              disabled={feedbackSent}
              onClick={handleSendFeedback}
              className="w-full sm:w-auto text-xs"
            >
              {feedbackSent ? (
                <>
                  <Check className="size-3.5 me-1.5 text-emerald-500" />
                  {t("quiz.shared")}
                </>
              ) : (
                <>
                  <Send className="size-3.5 me-1.5" />
                  {t("quiz.share")}
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        /* Active Question View */
        <div className="p-4 sm:p-5 space-y-4">
          {/* Question Statement */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="size-5 rounded-full bg-primary/10 text-primary text-[11px] font-bold font-mono flex items-center justify-center shrink-0">
                {currentIndex + 1}
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                {t("quiz.selectAnswer")}
              </span>
            </div>
            <div className="text-sm font-medium leading-relaxed text-foreground pt-1">
              <Markdown content={currentQ.question} />
            </div>
          </div>

          {/* Options List */}
          <div className="grid grid-cols-1 gap-2.5 pt-1">
            {currentQ.options.map((option) => {
              const isSelected = currentAnswerId === option.id
              const showCorrect = isCurrentAnswered && option.isCorrect
              const showWrong = isSelected && !option.isCorrect

              let borderState = "border-border/70 bg-background/50 hover:border-primary/50 hover:bg-muted/30"
              let badgeState = "bg-muted text-muted-foreground"

              if (showCorrect) {
                borderState = "border-emerald-500/70 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100 font-medium"
                badgeState = "bg-emerald-600 text-white"
              } else if (showWrong) {
                borderState = "border-rose-500/70 bg-rose-500/10 text-rose-950 dark:text-rose-100"
                badgeState = "bg-rose-600 text-white"
              } else if (isCurrentAnswered) {
                borderState = "border-border/40 opacity-60"
              }

              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={isCurrentAnswered}
                  onClick={() => handleSelectOption(option)}
                  className={cn(
                    "group relative w-full p-3 sm:p-3.5 rounded-xl border text-start text-xs sm:text-sm flex items-center justify-between gap-3 transition-all",
                    borderState,
                    !isCurrentAnswered && "cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={cn(
                        "size-6 rounded-full flex items-center justify-center font-mono font-bold text-xs shrink-0 transition-colors",
                        badgeState
                      )}
                    >
                      {option.id.toUpperCase()}
                    </span>
                    <div className="min-w-0 leading-relaxed font-sans">
                      <Markdown content={option.label} />
                    </div>
                  </div>

                  {/* Status Icons */}
                  <div className="shrink-0 ms-2">
                    {showCorrect && <CheckCircle2 className="size-4 text-emerald-500" />}
                    {showWrong && <XCircle className="size-4 text-rose-500" />}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Hint Disclosure */}
          {currentQ.hint && !isCurrentAnswered && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() =>
                  setRevealedHints((prev) => ({
                    ...prev,
                    [currentIndex]: !prev[currentIndex],
                  }))
                }
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer"
              >
                <Lightbulb className="size-3.5 text-amber-500" />
                <span>
                  {revealedHints[currentIndex] ? t("quiz.hideHint") : t("quiz.needHint")}
                </span>
              </button>
              {revealedHints[currentIndex] && (
                <div className="mt-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                  <Markdown content={currentQ.hint} />
                </div>
              )}
            </div>
          )}

          {/* Post-Answer Result & Detailed Explanation for this question */}
          {isCurrentAnswered && (
            <div
              className={cn(
                "mt-3.5 p-4 rounded-xl border space-y-2 transition-all text-xs sm:text-sm animate-in fade-in-50 duration-200",
                currentQ.options.find((o) => o.id === currentAnswerId)?.isCorrect
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-100"
                  : "bg-rose-500/10 border-rose-500/30 text-rose-950 dark:text-rose-100"
              )}
            >
              <div className="flex items-center gap-2 font-semibold">
                {currentQ.options.find((o) => o.id === currentAnswerId)?.isCorrect ? (
                  <>
                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                    <span>{t("quiz.correct")}</span>
                  </>
                ) : (
                  <>
                    <XCircle className="size-4 text-rose-500 shrink-0" />
                    <span>{t("quiz.incorrect")}</span>
                  </>
                )}
              </div>

              <div className="text-xs leading-relaxed opacity-95 font-sans">
                <Markdown content={currentQ.explanation} />
              </div>
            </div>
          )}

          {/* 3. Bottom Next-Order Action Navigation */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentIndex === 0}
              onClick={handlePrev}
              className="text-xs"
            >
              <ChevronLeft className="size-4 me-1" />
              {t("quiz.previous")}
            </Button>

            <div className="flex items-center gap-2">
              {currentIndex < totalQuestions - 1 ? (
                <Button
                  type="button"
                  variant={isCurrentAnswered ? "default" : "outline"}
                  size="sm"
                  onClick={handleNext}
                  className="text-xs font-medium"
                >
                  <span>{t("quiz.next")}</span>
                  <ChevronRight className="size-4 ms-1" />
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={handleNext}
                  className="text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Trophy className="size-3.5 me-1.5" />
                  <span>{t("quiz.finish")}</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
