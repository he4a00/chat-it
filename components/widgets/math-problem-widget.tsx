"use client"

import * as React from "react"
import { Markdown } from "@/components/chat/markdown"
import { Calculator, CheckCircle2, Lightbulb, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "cn"
import { useMutation } from "@tanstack/react-query"
import { useTRPC } from "@/trpc/react"

/** Module-scope timestamp helper (keeps render pure). */
const nowMs = () => Date.now()

export interface MathProblemStep {
  stepNumber: number
  instruction: string
  hint?: string
}

export interface MathProblemWidgetProps {
  messageId?: string
  topic: string
  subject?: string
  problemStatement: string
  steps: MathProblemStep[]
  finalAnswer: string
  acceptedFormats?: string[]
  explanation: string
  isAr?: boolean
  initialUserAnswer?: string
  initialCorrect?: boolean
  onAnswerSubmitted?: (data: {
    userAnswer: string
    isCorrect: boolean
    feedbackPrompt: string
  }) => void
}

export function MathProblemWidget({
  messageId,
  topic,
  subject,
  problemStatement,
  steps = [],
  finalAnswer,
  acceptedFormats = [],
  explanation,
  isAr = false,
  initialUserAnswer,
  initialCorrect,
  onAnswerSubmitted,
}: MathProblemWidgetProps) {
  const [userAnswer, setUserAnswer] = React.useState(initialUserAnswer ?? "")
  const [revealedHints, setRevealedHints] = React.useState<Record<number, boolean>>({})
  const [isAnswered, setIsAnswered] = React.useState(initialUserAnswer !== undefined)
  const [isCorrect, setIsCorrect] = React.useState(initialCorrect ?? false)

  const trpc = useTRPC()
  const submitWidgetMutation = useMutation(trpc.widget.submitState.mutationOptions())

  // Best-effort time-on-task, measured from mount to submission.
  const startedAtRef = React.useRef<number>(0)
  React.useEffect(() => {
    startedAtRef.current = nowMs()
  }, [])

  const normalize = (str: string) => str.toLowerCase().replace(/[\s\$,\\{}()]/g, "")

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    const cleanUser = normalize(userAnswer)
    if (!cleanUser || isAnswered) return

    const correctNorm = normalize(finalAnswer)
    const validMatches = [correctNorm, ...acceptedFormats.map(normalize)]
    const match = validMatches.includes(cleanUser)

    setIsCorrect(match)
    setIsAnswered(true)

    const feedbackPrompt = isAr
      ? `[حل المسألة الرياضية]: كتبت إجابتي: "${userAnswer}" والناتج النهائي هو "${finalAnswer}". النتيجة: ${
          match ? "صحيحة ومطابقة ✓" : "غير متطابقة ✗"
        }. ${match ? "هل هناك طريقة حل بديلة أو أسرع لهذه المسألة؟" : "أين حدث الخطأ في خطواتي؟ أريد تلميحاً موجهاً."}`
      : `[Guided Problem Submission]: My answer was: "${userAnswer}" while the target is "${finalAnswer}". Result: ${
          match ? "Correct ✓" : "Incorrect ✗"
        }. ${match ? "Is there an alternative or more elegant way to solve this?" : "Could you guide me through where my derivation went off track?"}`

    // Persist to Neon via tRPC.
    try {
      submitWidgetMutation.mutate({
        messageId,
        widgetType: "math_problem",
        topic,
        subject,
        payload: { problemStatement, steps, finalAnswer, explanation },
        userSubmission: { userAnswer, isCorrect: match },
        items: [
          {
            itemId: "final_answer",
            outcome: match ? "correct" : "incorrect",
            hintUsed: Object.values(revealedHints).some(Boolean),
          },
        ],
        timeSpentMs: startedAtRef.current ? nowMs() - startedAtRef.current : null,
        isCompleted: true,
        score: match ? 100 : 0,
      })
    } catch {
      // Non-blocking
    }

    if (onAnswerSubmitted) {
      onAnswerSubmitted({
        userAnswer,
        isCorrect: match,
        feedbackPrompt,
      })
    }
  }

  const toggleHint = (stepNumber: number) => {
    setRevealedHints((prev) => ({ ...prev, [stepNumber]: !prev[stepNumber] }))
  }

  return (
    <div className="my-3.5 rounded-2xl border border-border/80 bg-card/90 shadow-sm overflow-hidden font-sans transition-all">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 border-b border-border/60 bg-muted/30">
        <div className="flex items-center gap-2 text-xs font-semibold text-primary">
          <Calculator className="size-4 shrink-0" />
          <span>{isAr ? "مسألة رياضية تفاعلية موجهة" : "Guided Math Problem"}</span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
          {topic}
        </span>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* Problem Statement */}
        <div className="text-sm font-medium leading-relaxed text-foreground">
          <Markdown content={problemStatement} />
        </div>

        {/* Guided Steps List */}
        {steps.length > 0 && (
          <div className="space-y-2 border-t border-border/40 pt-3">
            <div className="text-xs font-semibold text-muted-foreground">
              {isAr ? "خطوات التفكير والتوجيه:" : "Scaffolded Steps:"}
            </div>

            <div className="space-y-2">
              {steps.map((s) => {
                const isHintOpen = revealedHints[s.stepNumber]
                return (
                  <div
                    key={s.stepNumber}
                    className="p-3 rounded-xl border border-border/60 bg-background/50 space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <span className="size-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-mono font-bold text-[10px] shrink-0 mt-0.5">
                          {s.stepNumber}
                        </span>
                        <div className="leading-relaxed text-foreground/90">
                          <Markdown content={s.instruction} />
                        </div>
                      </div>

                      {s.hint && (
                        <button
                          type="button"
                          onClick={() => toggleHint(s.stepNumber)}
                          className="shrink-0 p-1 text-muted-foreground hover:text-amber-500 transition-colors"
                          title="Toggle hint"
                        >
                          <Lightbulb className={cn("size-3.5", isHintOpen && "text-amber-500")} />
                        </button>
                      )}
                    </div>

                    {/* Step Hint Reveal */}
                    {isHintOpen && s.hint && (
                      <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-[11px] leading-relaxed">
                        <Markdown content={s.hint} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Final Answer Input Form */}
        {!isAnswered ? (
          <form onSubmit={handleSubmit} className="flex gap-2 pt-1">
            <Input
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder={isAr ? "اكتب ناتجك النهائي (مثال: x = 4)..." : "Enter final answer (e.g. 4, x=2)..."}
              className="text-xs sm:text-sm font-mono h-9"
            />
            <Button type="submit" size="sm" className="rounded-md h-9 px-3 gap-1.5 shrink-0">
              <span>{isAr ? "تحقق" : "Check"}</span>
              <Send className="size-3" />
            </Button>
          </form>
        ) : (
          /* Post-Answer Result & Walkthrough */
          <div
            className={cn(
              "p-4 rounded-xl border space-y-2.5 text-xs sm:text-sm",
              isCorrect
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-100"
                : "bg-rose-500/10 border-rose-500/30 text-rose-950 dark:text-rose-100"
            )}
          >
            <div className="flex items-center gap-2 font-semibold">
              {isCorrect ? (
                <>
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                  <span>{isAr ? "إجابة دقيقة وصحيحة بالكامل!" : "Excellent! Answer matches target."}</span>
                </>
              ) : (
                <>
                  <span className="font-bold text-rose-500">✗</span>
                  <span>
                    {isAr ? `إجابتك (${userAnswer})، والإجابة الدقيقة: ` : `Your answer: (${userAnswer}), Target: `}
                    <code className="px-1.5 py-0.5 rounded bg-muted/60 font-mono text-xs">{finalAnswer}</code>
                  </span>
                </>
              )}
            </div>

            <div className="text-xs leading-relaxed opacity-90 font-sans border-t border-border/30 pt-2">
              <Markdown content={explanation} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
