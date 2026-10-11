"use client"

import * as React from "react"
import {
  Award,
  Flame,
  Heart,
  Lightbulb,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  TriangleAlert,
} from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Markdown } from "@/components/chat/markdown"
import { cn } from "cn"
import { useLanguage } from "@/hooks/use-language"
import { masteryBand } from "@/lib/learner/config"
import type { LearnerOverview, MemoryNoteType } from "@/types/learner"

interface ProgressPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  overview?: LearnerOverview
  isPending?: boolean
  onStartReview: () => void
  isStartingReview?: boolean
}

const NOTE_META: Record<
  MemoryNoteType,
  { en: string; ar: string; icon: typeof Award; className: string }
> = {
  strength: {
    en: "Strength",
    ar: "نقطة قوة",
    icon: Award,
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  },
  misconception: {
    en: "Misconception",
    ar: "تصوّر خاطئ",
    icon: TriangleAlert,
    className: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
  },
  preference: {
    en: "Preference",
    ar: "تفضيل",
    icon: Heart,
    className: "bg-primary/10 text-primary border-primary/20",
  },
  goal: {
    en: "Goal",
    ar: "هدف",
    icon: Target,
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  },
  observation: {
    en: "Observation",
    ar: "ملاحظة",
    icon: Lightbulb,
    className: "bg-muted text-muted-foreground border-border",
  },
}

function bandClasses(band: ReturnType<typeof masteryBand>) {
  if (band === "strong") {
    return { bar: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" }
  }
  if (band === "developing") {
    return { bar: "bg-amber-500", text: "text-amber-600 dark:text-amber-400" }
  }
  return { bar: "bg-rose-500", text: "text-rose-600 dark:text-rose-400" }
}

export function ProgressPanel({
  open,
  onOpenChange,
  overview,
  isPending = false,
  onStartReview,
  isStartingReview = false,
}: ProgressPanelProps) {
  const { language } = useLanguage()
  const isAr = language === "ar"

  const streak = overview?.streak
  const accuracy = Math.round((overview?.stats.accuracy ?? 0) * 100)
  const topics = overview?.topics ?? []
  const dueTopics = topics.filter((topic) => topic.isDue)
  const notes = overview?.notes ?? []
  const hasActivity = (overview?.stats.totalAttempts ?? 0) > 0

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border/60 p-6 pe-14">
          <SheetTitle className="flex items-center gap-2">
            <TrendingUp className="size-4 text-primary" />
            {isAr ? "تقدّمك" : "Your progress"}
          </SheetTitle>
          <SheetDescription>
            {isAr
              ? "ملخّص لما راجعه شوقي وتذكّره عن تعلّمك."
              : "A summary of what Shawky has tracked and remembers about your learning."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {isPending && !overview ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-24 rounded-xl" />
                <Skeleton className="h-24 rounded-xl" />
              </div>
              <Skeleton className="h-40 rounded-xl" />
              <Skeleton className="h-32 rounded-xl" />
            </div>
          ) : !hasActivity ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/70 px-6 py-12 text-center">
              <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Sparkles className="size-5" />
              </span>
              <p className="text-sm font-medium text-foreground">
                {isAr ? "لا يوجد تقدّم بعد" : "No progress yet"}
              </p>
              <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
                {isAr
                  ? "جرّب اختباراً أو بطاقات تعليمية، وسيبدأ شوقي في تتبّع إتقانك هنا."
                  : "Try a quiz or a flashcard deck and Shawky will start tracking your mastery here."}
              </p>
            </div>
          ) : (
            <>
              {/* Streak + accuracy */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border/70 bg-card/60 p-4">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                    <Flame className="size-3.5 text-amber-500" />
                    {isAr ? "سلسلة التدريب" : "Practice streak"}
                  </div>
                  <div className="mt-1.5 flex items-baseline gap-1.5">
                    <span className="text-2xl font-semibold tabular-nums text-foreground">
                      {streak?.current ?? 0}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {isAr ? "يوم" : streak?.current === 1 ? "day" : "days"}
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    {streak?.practicedToday
                      ? isAr
                        ? "تدربت اليوم"
                        : "Practiced today"
                      : isAr
                        ? "لم تتدرب اليوم بعد"
                        : "Not practiced yet today"}
                  </div>
                </div>

                <div className="rounded-xl border border-border/70 bg-card/60 p-4">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                    <Target className="size-3.5 text-primary" />
                    {isAr ? "الدقة الإجمالية" : "Overall accuracy"}
                  </div>
                  <div className="mt-1.5 text-2xl font-semibold tabular-nums text-foreground">
                    {accuracy}%
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    {isAr
                      ? `${overview?.stats.totalCorrect ?? 0} من ${overview?.stats.totalAttempts ?? 0}`
                      : `${overview?.stats.totalCorrect ?? 0} of ${overview?.stats.totalAttempts ?? 0} correct`}
                  </div>
                </div>
              </div>

              {/* Topic mastery */}
              <section className="space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground">
                  {isAr ? "إتقان المواضيع" : "Topic mastery"}
                </h3>
                {topics.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    {isAr ? "لا توجد مواضيع بعد." : "No topics tracked yet."}
                  </p>
                ) : (
                  <div className="space-y-3.5">
                    {topics.map((topic) => {
                      const band = bandClasses(masteryBand(topic.masteryScore))
                      const pct = Math.round(topic.masteryScore * 100)
                      return (
                        <div key={topic.topicId}>
                          <div className="mb-1.5 flex items-baseline justify-between gap-2">
                            <span className="truncate text-xs font-medium text-foreground">
                              {topic.topic}
                            </span>
                            <span className={cn("text-xs font-semibold tabular-nums", band.text)}>
                              {pct}%
                            </span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                            <div
                              className={cn("h-full rounded-full transition-all", band.bar)}
                              style={{ width: `${Math.max(4, pct)}%` }}
                            />
                          </div>
                          {topic.isDue ? (
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              {isAr ? "يُنصح بالمراجعة" : "Practice recommended"}
                            </p>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>

              {/* Due for review */}
              <section className="space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground">
                  {isAr ? "مستحق للمراجعة" : "Due for review"}
                </h3>
                {dueTopics.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    {isAr ? "لا يوجد ما يستحق المراجعة الآن." : "Nothing due right now."}
                  </p>
                ) : (
                  <>
                    <ul className="space-y-1.5">
                      {dueTopics.slice(0, 4).map((topic) => (
                        <li
                          key={topic.topicId}
                          className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-background/50 px-3 py-2"
                        >
                          <span className="truncate text-xs text-foreground">{topic.topic}</span>
                          <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                            {Math.round(topic.masteryScore * 100)}%
                          </span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      size="sm"
                      onClick={onStartReview}
                      disabled={isStartingReview}
                      className="w-full"
                    >
                      <RefreshCw
                        className={cn("me-1.5 size-3.5", isStartingReview && "animate-spin")}
                      />
                      {isStartingReview
                        ? isAr
                          ? "جاري التحضير…"
                          : "Preparing…"
                        : isAr
                          ? "ابدأ جلسة مراجعة"
                          : "Start a review session"}
                    </Button>
                  </>
                )}
              </section>

              {/* Coach notes */}
              <section className="space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground">
                  {isAr ? "ملاحظات شوقي" : "Shawky's notes"}
                </h3>
                {notes.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    {isAr
                      ? "سيظهر هنا ما يلاحظه شوقي عن طريقة تعلّمك."
                      : "Observations about how you learn will show up here."}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {notes.map((note) => {
                      const meta = NOTE_META[note.type] ?? NOTE_META.observation
                      const Icon = meta.icon
                      return (
                        <div
                          key={note.id}
                          className="rounded-xl border border-border/60 bg-card/60 p-3.5"
                        >
                          <div className="mb-1.5 flex items-center justify-between gap-2">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium",
                                meta.className,
                              )}
                            >
                              <Icon className="size-3" />
                              {isAr ? meta.ar : meta.en}
                            </span>
                            {typeof note.confidence === "number" ? (
                              <span className="text-[10px] tabular-nums text-muted-foreground">
                                {Math.round(note.confidence * 100)}%
                              </span>
                            ) : null}
                          </div>
                          <div className="text-xs leading-relaxed text-foreground">
                            <Markdown content={note.observation} />
                          </div>
                          {note.recommendation ? (
                            <div className="mt-2 border-t border-border/40 pt-2 text-[11px] leading-relaxed text-muted-foreground">
                              <Markdown content={note.recommendation} />
                            </div>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
