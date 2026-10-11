"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, ArrowRight, Check, Compass, Gauge, Sparkles, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "cn"
import { useLanguage } from "@/hooks/use-language"
import { useTRPC } from "@/trpc/react"
import { notify } from "@/lib/toast"
import { LanguageMenu } from "@/components/chat/language-menu"
import { ThemeSwitch } from "@/components/chat/theme-switch"
import { ONBOARDING_STEPS, type OnboardingStepIcon } from "./onboarding-config"

const STEP_ICONS: Record<OnboardingStepIcon, typeof Compass> = {
  compass: Compass,
  gauge: Gauge,
  target: Target,
}

const EASE: [number, number, number, number] = [0.2, 0, 0, 1]

const LIST_VARIANTS = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045 } },
}

const ITEM_VARIANTS = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: EASE } },
}

const BURST = Array.from({ length: 12 }, (_, index) => {
  const angle = (index / 12) * Math.PI * 2
  return {
    id: index,
    x: Math.cos(angle) * 92,
    y: Math.sin(angle) * 92,
    className: `bg-chart-${(index % 4) + 1}`,
  }
})

/**
 * Full-page, character-led onboarding. Shawky speaks each step aloud in his
 * bubble while the learner builds their profile on the task panel.
 */
export function OnboardingExperience() {
  const router = useRouter()
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const { language } = useLanguage()
  const isAr = language === "ar"
  const reduce = useReducedMotion()

  const [stepIndex, setStepIndex] = React.useState(0)
  const [direction, setDirection] = React.useState(1)
  const [choice, setChoice] = React.useState<Record<string, string>>({})
  const [custom, setCustom] = React.useState<Record<string, string>>({})
  const [done, setDone] = React.useState(false)

  const total = ONBOARDING_STEPS.length
  const step = ONBOARDING_STEPS[stepIndex]
  const isLast = stepIndex === total - 1
  const StepIcon = STEP_ICONS[step.icon]

  const completeOnboarding = useMutation(
    trpc.learner.completeOnboarding.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.learner.getOverview.queryKey() })
        setDone(true)
      },
      onError: () => {
        notify.error(
          isAr ? "تعذّر حفظ ملفك" : "Couldn't save your profile",
          isAr ? "حاول مرة أخرى بعد قليل." : "Please try again in a moment.",
        )
      },
    }),
  )

  React.useEffect(() => {
    if (!done) return
    const timer = window.setTimeout(() => {
      router.replace("/")
      router.refresh()
    }, 1700)
    return () => window.clearTimeout(timer)
  }, [done, router])

  const valueFor = (id: string) => (choice[id] ?? "").trim() || (custom[id] ?? "").trim()
  const canAdvance = Boolean(step.optional) || valueFor(step.id).length > 0

  const handleSelect = (value: string) => {
    setChoice((prev) => ({ ...prev, [step.id]: value }))
    setCustom((prev) => ({ ...prev, [step.id]: "" }))
  }

  const handleCustom = (text: string) => {
    setCustom((prev) => ({ ...prev, [step.id]: text }))
    setChoice((prev) => ({ ...prev, [step.id]: text.trim() ? "" : prev[step.id] }))
  }

  const handleSubmit = () => {
    const answers: Record<string, string | string[]> = {}
    for (const s of ONBOARDING_STEPS) {
      const value = valueFor(s.id)
      if (value) answers[s.id] = value
    }
    answers.subjects = typeof answers.subject === "string" ? [answers.subject] : []
    completeOnboarding.mutate({ answers })
  }

  const goNext = () => {
    if (!canAdvance) return
    if (isLast) {
      handleSubmit()
      return
    }
    setDirection(1)
    setStepIndex((index) => Math.min(total - 1, index + 1))
  }

  const goBack = () => {
    setDirection(-1)
    setStepIndex((index) => Math.max(0, index - 1))
  }

  const talk = isAr ? step.talkAr : step.talkEn
  const words = talk.split(" ")
  const headingId = `ob-heading-${step.id}`
  const oc = (multiplier: number) => (isAr ? -1 : 1) * direction * multiplier

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background">
      {/* Ambient plane — restrained, on-brand glow only */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 start-[-12%] size-[38rem] rounded-full bg-primary/10 blur-[130px]" />
        <div className="absolute bottom-[-22%] end-[-8%] size-[32rem] rounded-full bg-primary/5 blur-[130px]" />
        <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(to_right,var(--foreground)_1px,transparent_1px),linear-gradient(to_bottom,var(--foreground)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_75%)]" />
      </div>

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-8">
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/shawky-headshot.png"
            alt=""
            className="size-9 rounded-full ring-1 ring-border/60"
            width={36}
            height={36}
          />
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold">{isAr ? "شوقي" : "Shawky"}</span>
            <span className="text-[11px] text-muted-foreground">
              {isAr ? "رفيقك في التعلّم" : "Your learning companion"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-muted/50 p-1">
          <LanguageMenu />
          <ThemeSwitch className="px-1" />
        </div>
      </header>

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl flex-col items-center justify-center gap-10 px-5 pb-16 sm:px-8 lg:flex-row lg:items-center lg:gap-16">
        {/* Character plane */}
        <section className="flex w-full max-w-md shrink-0 flex-col items-center lg:max-w-sm lg:items-start">
          <div className="relative">
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10 scale-125 rounded-full bg-primary/15 blur-3xl"
            />
            <motion.div
              animate={reduce ? undefined : { y: [0, -7, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="relative"
            >
              {/* react ripple on each step change */}
              <AnimatePresence>
                <motion.span
                  key={step.id}
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full border border-primary/40"
                  initial={{ scale: 0.9, opacity: 0.55 }}
                  animate={{ scale: 1.35, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.9, ease: EASE }}
                />
              </AnimatePresence>
              <div className="absolute inset-1.5 rounded-full border border-primary/15" aria-hidden="true" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/shawky-avatar.png"
                alt={isAr ? "شوقي، مدرّسك" : "Shawky, your tutor"}
                className="size-40 rounded-full ring-1 ring-border/50 sm:size-48 lg:size-56"
                width={224}
                height={224}
              />
            </motion.div>
          </div>

          {/* Speech bubble */}
          <div className="relative mt-7 w-full max-w-sm">
            <div
              aria-hidden="true"
              className="absolute -top-1.5 left-1/2 size-3 -translate-x-1/2 rotate-45 rounded-[3px] border-t border-l border-border/70 bg-card"
            />
            <div
              className="rounded-2xl border border-border/70 bg-card px-5 py-4 shadow-xs"
              aria-live="polite"
            >
              <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-primary">
                <Sparkles className="size-3.5" />
                <span>{isAr ? "شوقي" : "Shawky"}</span>
              </div>
              <p
                key={step.id}
                className="flex flex-wrap gap-x-1.5 text-sm leading-relaxed text-foreground"
              >
                {words.map((word, index) => (
                  <motion.span
                    key={`${step.id}-${index}`}
                    initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ duration: 0.3, delay: index * 0.035, ease: EASE }}
                  >
                    {word}
                  </motion.span>
                ))}
              </p>
            </div>
          </div>
        </section>

        {/* Task plane */}
        <section className="w-full max-w-xl">
          {/* Journey rail */}
          <div className="mb-7">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                {isAr ? "خطوات الإعداد" : "Getting set up"}
              </span>
              <span className="text-xs font-semibold tabular-nums text-primary">
                {isAr ? `${stepIndex + 1} من ${total}` : `Step ${stepIndex + 1} of ${total}`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {ONBOARDING_STEPS.map((item, index) => {
                const isComplete = index < stepIndex
                const isActive = index === stepIndex
                return (
                  <React.Fragment key={item.id}>
                    <div className="relative flex items-center justify-center">
                      {isActive ? (
                        <motion.span
                          aria-hidden="true"
                          className="absolute inset-0 rounded-full bg-primary/15"
                          animate={reduce ? undefined : { scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
                          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                        />
                      ) : null}
                      <div
                        className={cn(
                          "relative flex size-8 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                          isComplete && "border-primary bg-primary text-primary-foreground",
                          isActive && "border-primary bg-primary/10 text-primary",
                          !isComplete && !isActive && "border-border bg-card text-muted-foreground",
                        )}
                      >
                        {isComplete ? <Check className="size-4" /> : index + 1}
                      </div>
                    </div>
                    {index < total - 1 ? (
                      <div className="h-0.5 flex-1 overflow-hidden rounded-full bg-border">
                        <motion.div
                          className="h-full rounded-full bg-primary"
                          initial={false}
                          animate={{ width: index < stepIndex ? "100%" : "0%" }}
                          transition={{ duration: 0.4, ease: EASE }}
                        />
                      </div>
                    ) : null}
                  </React.Fragment>
                )
              })}
            </div>
          </div>

          {/* Step card */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: reduce ? 0 : oc(28) }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: reduce ? 0 : oc(-28) }}
              transition={{ duration: reduce ? 0.15 : 0.3, ease: EASE }}
              className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-xs backdrop-blur-sm sm:p-6"
            >
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <StepIcon className="size-5" />
                </span>
                <div className="min-w-0">
                  <h1 id={headingId} className="text-base font-semibold text-foreground">
                    {isAr ? step.titleAr : step.titleEn}
                  </h1>
                  {isAr ? (
                    step.descriptionAr ? (
                      <p className="mt-0.5 text-sm text-muted-foreground">{step.descriptionAr}</p>
                    ) : null
                  ) : step.descriptionEn ? (
                    <p className="mt-0.5 text-sm text-muted-foreground">{step.descriptionEn}</p>
                  ) : null}
                </div>
              </div>

              {step.choices ? (
                <motion.div
                  role="radiogroup"
                  aria-labelledby={headingId}
                  variants={LIST_VARIANTS}
                  initial="hidden"
                  animate="show"
                  className="mt-5 grid gap-2.5 sm:grid-cols-2"
                >
                  {step.choices.map((item) => {
                    const selected = choice[step.id] === item.value
                    return (
                      <motion.label
                        key={item.value}
                        variants={ITEM_VARIANTS}
                        whileTap={reduce ? undefined : { scale: 0.985 }}
                        className={cn(
                          "group relative flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors",
                          "has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-ring/40 has-[input:focus-visible]:ring-offset-2 has-[input:focus-visible]:ring-offset-background",
                          selected
                            ? "border-primary/50 bg-primary/5"
                            : "border-border/70 bg-background/50 hover:border-primary/40 hover:bg-muted/40",
                        )}
                      >
                        <input
                          type="radio"
                          name={`ob-${step.id}`}
                          value={item.value}
                          checked={selected}
                          onChange={() => handleSelect(item.value)}
                          className="absolute inset-0 size-full cursor-pointer opacity-0"
                        />
                        <span className="flex min-w-0 flex-col">
                          <span className="text-sm font-medium text-foreground">
                            {isAr ? item.labelAr : item.labelEn}
                          </span>
                          {(isAr ? item.descriptionAr : item.descriptionEn) ? (
                            <span className="text-[11px] text-muted-foreground">
                              {isAr ? item.descriptionAr : item.descriptionEn}
                            </span>
                          ) : null}
                        </span>
                        <span
                          className={cn(
                            "ms-auto flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                            selected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-input",
                          )}
                        >
                          <AnimatePresence>
                            {selected ? (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                transition={{ type: "spring", stiffness: 520, damping: 26 }}
                              >
                                <Check className="size-3" />
                              </motion.span>
                            ) : null}
                          </AnimatePresence>
                        </span>
                      </motion.label>
                    )
                  })}
                </motion.div>
              ) : null}

              {step.allowCustom ? (
                <div className="mt-4 flex flex-col gap-1.5">
                  <label
                    htmlFor={`ob-custom-${step.id}`}
                    className="text-xs font-medium text-muted-foreground"
                  >
                    {isAr ? step.customLabelAr : step.customLabelEn}
                  </label>
                  <Input
                    id={`ob-custom-${step.id}`}
                    value={custom[step.id] ?? ""}
                    onChange={(event) => handleCustom(event.target.value)}
                    placeholder={isAr ? step.customPlaceholderAr : step.customPlaceholderEn}
                    className="h-11 text-base sm:h-10 sm:text-sm"
                  />
                </div>
              ) : null}

              {/* Actions */}
              <div className="mt-6 flex items-center justify-between gap-3">
                <Button variant="outline" onClick={goBack} disabled={stepIndex === 0}>
                  <ArrowLeft className="me-1.5 size-4 rtl:rotate-180" />
                  {isAr ? "السابق" : "Back"}
                </Button>

                {isLast ? (
                  <Button
                    onClick={goNext}
                    disabled={!canAdvance || completeOnboarding.isPending}
                    className="min-w-32"
                  >
                    {completeOnboarding.isPending
                      ? isAr
                        ? "جاري الحفظ…"
                        : "Saving…"
                      : isAr
                        ? "لنبدأ التعلّم"
                        : "Start learning"}
                  </Button>
                ) : (
                  <Button onClick={goNext} disabled={!canAdvance}>
                    {isAr ? "التالي" : "Next"}
                    <ArrowRight className="ms-1.5 size-4 rtl:rotate-180" />
                  </Button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </section>
      </main>

      {/* Completion celebration */}
      <AnimatePresence>
        {done ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="relative flex flex-col items-center gap-4 px-6 text-center">
              {!reduce ? (
                <div aria-hidden="true" className="pointer-events-none absolute top-16 left-1/2">
                  {BURST.map((piece) => (
                    <motion.span
                      key={piece.id}
                      className={cn("absolute size-2 rounded-full", piece.className)}
                      initial={{ x: 0, y: 0, opacity: 0, scale: 0.5 }}
                      animate={{ x: piece.x, y: piece.y, opacity: [0, 1, 0], scale: 1 }}
                      transition={{ duration: 0.9, delay: 0.1, ease: EASE }}
                    />
                  ))}
                </div>
              ) : null}

              <motion.div
                className="relative"
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/shawky-avatar.png"
                  alt=""
                  className="size-28 rounded-full ring-4 ring-primary/20"
                  width={112}
                  height={112}
                />
                <motion.span
                  className="absolute -bottom-1 -end-1 flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 420, damping: 18, delay: 0.15 }}
                >
                  <Sparkles className="size-4.5" />
                </motion.span>
              </motion.div>

              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {isAr ? "كل شيء جاهز" : "You're all set"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isAr
                    ? "لنبدأ أول درس معاً."
                    : "Let's dive into your first lesson together."}
                </p>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
