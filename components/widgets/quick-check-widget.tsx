"use client"

import * as React from "react"
import { useTranslation } from "react-i18next"
import { Markdown } from "@/components/chat/markdown"
import { CheckCircle2, XCircle, Check, X } from "lucide-react"
import { cn } from "cn"
import { useSubmitWidgetState } from "@/server/hooks/use-learner"

/** Module-scope timestamp helper (keeps render pure). */
const nowMs = () => Date.now()

export interface QuickCheckWidgetProps {
  messageId?: string
  topic?: string
  subject?: string
  statement: string
  isTrue: boolean
  explanation: string
  initialUserChoice?: boolean
  onAnswerSubmitted?: (data: {
    userChoice: boolean
    isCorrect: boolean
    feedbackPrompt: string
  }) => void
}

export function QuickCheckWidget({
  messageId,
  topic,
  subject,
  statement,
  isTrue,
  explanation,
  initialUserChoice,
  onAnswerSubmitted,
}: QuickCheckWidgetProps) {
  const { t } = useTranslation("widgets")
  const [userChoice, setUserChoice] = React.useState<boolean | null>(
    initialUserChoice !== undefined ? initialUserChoice : null
  )
  const isAnswered = userChoice !== null
  const isCorrect = userChoice === isTrue

  const submitWidgetMutation = useSubmitWidgetState()

  // Best-effort time-on-task, measured from mount to submission.
  const startedAtRef = React.useRef<number>(0)
  React.useEffect(() => {
    startedAtRef.current = nowMs()
  }, [])

  const handleChoose = async (choice: boolean) => {
    if (isAnswered) return
    setUserChoice(choice)

    const correct = choice === isTrue
    const feedbackPrompt =
      t("quickCheck.feedback.intro", {
        answer: choice ? t("quickCheck.true") : t("quickCheck.false"),
        statement,
        result: correct
          ? t("quickCheck.feedback.resultCorrect")
          : t("quickCheck.feedback.resultIncorrect"),
      }) +
      (correct
        ? t("quickCheck.feedback.followUpCorrect")
        : t("quickCheck.feedback.followUpIncorrect"))

    // Persist to Neon via tRPC.
    try {
      submitWidgetMutation.mutate({
        messageId,
        widgetType: "quick_check",
        topic,
        subject,
        payload: { statement, isTrue, explanation },
        userSubmission: { userChoice: choice, isCorrect: correct },
        items: [
          {
            itemId: "quick_check",
            outcome: correct ? "correct" : "incorrect",
          },
        ],
        timeSpentMs: startedAtRef.current ? nowMs() - startedAtRef.current : null,
        isCompleted: true,
        score: correct ? 100 : 0,
      })
    } catch {
      // Non-blocking
    }

    if (onAnswerSubmitted) {
      onAnswerSubmitted({
        userChoice: choice,
        isCorrect: correct,
        feedbackPrompt,
      })
    }
  }

  return (
    <div className="my-3.5 rounded-2xl border border-border/80 bg-card/90 shadow-sm overflow-hidden font-sans transition-all">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 border-b border-border/60 bg-muted/30">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-500">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{t("quickCheck.title")}</span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          {t("quickCheck.badge")}
        </span>
      </div>

      {/* Statement Body */}
      <div className="p-4 sm:p-5 space-y-4">
        <div className="text-sm font-medium leading-relaxed text-foreground">
          <Markdown content={statement} />
        </div>

        {/* Binary True / False Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          {/* True Button */}
          <button
            type="button"
            disabled={isAnswered}
            onClick={() => handleChoose(true)}
            className={cn(
              "p-3 rounded-xl border text-center text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all font-sans",
              !isAnswered && "border-border/70 bg-background/50 hover:border-emerald-500/60 hover:bg-emerald-500/5 cursor-pointer hover:-translate-y-0.5",
              isAnswered && isTrue && "border-emerald-500/80 bg-emerald-500/15 text-emerald-950 dark:text-emerald-100 font-bold",
              isAnswered && userChoice === true && !isTrue && "border-rose-500/80 bg-rose-500/15 text-rose-950 dark:text-rose-100",
              isAnswered && userChoice !== true && !isTrue && "border-border/40 opacity-50"
            )}
          >
            <Check className="size-4 text-emerald-500" />
            <span>{t("quickCheck.true")}</span>
          </button>

          {/* False Button */}
          <button
            type="button"
            disabled={isAnswered}
            onClick={() => handleChoose(false)}
            className={cn(
              "p-3 rounded-xl border text-center text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all font-sans",
              !isAnswered && "border-border/70 bg-background/50 hover:border-rose-500/60 hover:bg-rose-500/5 cursor-pointer hover:-translate-y-0.5",
              isAnswered && !isTrue && "border-emerald-500/80 bg-emerald-500/15 text-emerald-950 dark:text-emerald-100 font-bold",
              isAnswered && userChoice === false && isTrue && "border-rose-500/80 bg-rose-500/15 text-rose-950 dark:text-rose-100",
              isAnswered && userChoice !== false && isTrue && "border-border/40 opacity-50"
            )}
          >
            <X className="size-4 text-rose-500" />
            <span>{t("quickCheck.false")}</span>
          </button>
        </div>

        {/* Instant Verification & Explanation Reveal */}
        {isAnswered && (
          <div
            className={cn(
              "mt-3.5 p-4 rounded-xl border space-y-2 transition-all text-xs sm:text-sm",
              isCorrect
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-100"
                : "bg-rose-500/10 border-rose-500/30 text-rose-950 dark:text-rose-100"
            )}
          >
            <div className="flex items-center gap-2 font-semibold">
              {isCorrect ? (
                <>
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                  <span>{t("quickCheck.correct")}</span>
                </>
              ) : (
                <>
                  <XCircle className="size-4 text-rose-500 shrink-0" />
                  <span>{t("quickCheck.incorrect")}</span>
                </>
              )}
            </div>

            <div className="text-xs leading-relaxed opacity-90 font-sans">
              <Markdown content={explanation} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
