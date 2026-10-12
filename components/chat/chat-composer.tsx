"use client"

import * as React from "react"
import { useTranslation } from "react-i18next"
import { ArrowUp, Square, Pi, Code2, Calculator, CheckCircle2, HelpCircle, Layers, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "cn"

interface ChatComposerProps {
  input: string
  onInputChange: (val: string) => void
  onSubmit: (e?: React.FormEvent) => void
  isLoading: boolean
  onStop?: () => void
  className?: string
}

const MATH_SYMBOLS = [
  { label: "x²", insert: "^{2}", titleKey: "composer.symbols.square" },
  { label: "a/b", insert: "\\frac{a}{b}", titleKey: "composer.symbols.fraction" },
  { label: "√x", insert: "\\sqrt{x}", titleKey: "composer.symbols.sqrt" },
  { label: "∫", insert: "\\int_{a}^{b} ", titleKey: "composer.symbols.integral" },
  { label: "π", insert: "\\pi", titleKey: "composer.symbols.pi" },
  { label: "θ", insert: "\\theta", titleKey: "composer.symbols.theta" },
  { label: "Δ", insert: "\\Delta", titleKey: "composer.symbols.delta" },
  { label: "∞", insert: "\\infty", titleKey: "composer.symbols.infinity" },
  { label: "≈", insert: "\\approx", titleKey: "composer.symbols.approx" },
  { label: "∑", insert: "\\sum_{i=1}^{n}", titleKey: "composer.symbols.sum" },
]

/** One-tap starters that drop a tool-shaped prompt into the composer. */
const TOOL_PRESETS = [
  { id: "quiz", icon: HelpCircle, accent: "text-emerald-500" },
  { id: "flashcards", icon: Layers, accent: "text-violet-500" },
  { id: "math", icon: Calculator, accent: "text-blue-500" },
  { id: "quickcheck", icon: CheckCircle2, accent: "text-amber-500" },
] as const

export function ChatComposer({
  input,
  onInputChange,
  onSubmit,
  isLoading,
  onStop,
  className,
}: ChatComposerProps) {
  const { t } = useTranslation("chat")
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const [showMathSymbols, setShowMathSymbols] = React.useState(false)

  // Auto-resize textarea height
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`
    }
  }, [input])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (input.trim() && !isLoading) {
        onSubmit()
      }
    }
  }

  const handleInsertSymbol = (symbolInsert: string, caretOffset?: number) => {
    if (!textareaRef.current) return
    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const currentVal = input
    const nextVal = currentVal.substring(0, start) + symbolInsert + currentVal.substring(end)
    onInputChange(nextVal)

    // Reset focus and cursor position after insertion
    setTimeout(() => {
      textarea.focus()
      const newPos = start + (caretOffset ?? symbolInsert.length)
      textarea.setSelectionRange(newPos, newPos)
    }, 0)
  }

  const handleToolPreset = (preset: (typeof TOOL_PRESETS)[number]) => {
    const text = t(`composer.presets.${preset.id}.prompt`)
    onInputChange(text)
    const textarea = textareaRef.current
    if (textarea) {
      textarea.focus()
      requestAnimationFrame(() => textarea.setSelectionRange(text.length, text.length))
    }
  }

  return (
    <div className={cn("w-full max-w-3xl mx-auto flex flex-col gap-1.5", className)}>
      {/* Floating Capsule */}
      <div className="relative flex flex-col rounded-2xl border border-border/80 bg-card/85 dark:bg-[#12151e]/85 backdrop-blur-xl shadow-[0_12px_36px_-10px_rgba(0,0,0,0.5)] focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all duration-300">
        {/* Collapsible Math Symbol Bar */}
        {showMathSymbols && (
          <div className="flex items-center gap-1 overflow-x-auto px-3.5 py-1.5 border-b border-border/40 scrollbar-none animate-in fade-in-50 slide-in-from-top-1 duration-200">
            <span className="text-[11px] font-mono text-primary font-medium me-1 shrink-0 flex items-center gap-1">
              <Pi className="size-3" />
              <span>TeX:</span>
            </span>
            {MATH_SYMBOLS.map((sym, idx) => (
              <button
                key={idx}
                type="button"
                title={t(sym.titleKey)}
                onClick={() => handleInsertSymbol(sym.insert)}
                className="shrink-0 px-2 py-0.5 rounded-md hover:bg-muted text-foreground/80 hover:text-foreground text-xs font-mono font-medium border border-border/30 transition-colors"
              >
                {sym.label}
              </button>
            ))}
          </div>
        )}

        {/* Textarea Area */}
        <div className="px-4 pt-3 pb-1.5">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("composer.placeholder")}
            className="w-full resize-none bg-transparent text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:outline-none min-h-[38px] max-h-[180px] font-sans"
          />
        </div>

        {/* Bottom Control Strip */}
        <div className="flex items-center justify-between px-3.5 pb-2.5 pt-1">
          {/* Left Actions */}
          <div className="flex items-center gap-1.5">
            {/* Quick tools — pick a tool and it fills the input */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    title={t("composer.toolsTitle")}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors border-border/40 bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
                  >
                    <Sparkles className="size-3.5" />
                    <span className="text-[11px]">{t("composer.toolsLabel")}</span>
                  </button>
                }
              />
              <DropdownMenuContent align="start" side="top" className="min-w-52">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>{t("composer.quickStart")}</DropdownMenuLabel>
                  {TOOL_PRESETS.map((preset) => {
                    const Icon = preset.icon
                    return (
                      <DropdownMenuItem key={preset.id} onClick={() => handleToolPreset(preset)}>
                        <Icon className={cn("size-3.5 mr-2", preset.accent)} />
                        <span>{t(`composer.presets.${preset.id}.label`)}</span>
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Math Symbols Toggle */}
            <button
              type="button"
              onClick={() => setShowMathSymbols(!showMathSymbols)}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                showMathSymbols
                  ? "bg-primary/15 text-primary border-primary/30"
                  : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border-border/40",
              )}
              title={t("composer.mathTitle")}
            >
              <Pi className="size-3.5" />
              <span className="font-mono text-[11px]">fx Math</span>
            </button>

            {/* Code Block Insert */}
            <button
              type="button"
              onClick={() => handleInsertSymbol("```\n\n```", 4)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border border-border/40 bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title={t("composer.codeTitle")}
            >
              <Code2 className="size-3.5" />
              <span className="font-mono text-[11px]">Code</span>
            </button>
          </div>

          {/* Right Actions: Shortcut Hint & Send/Stop Button */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-muted-foreground/50 hidden sm:inline">
              Enter ↵
            </span>

            {isLoading ? (
              <Button
                type="button"
                size="icon"
                variant="destructive"
                onClick={onStop}
                className="size-8 rounded-full shadow-xs"
                title={t("composer.stop")}
              >
                <Square className="size-3.5 fill-current" />
                <span className="sr-only">{t("composer.stopSr")}</span>
              </Button>
            ) : (
              <Button
                type="button"
                size="icon"
                disabled={!input.trim()}
                onClick={() => onSubmit()}
                className="size-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-30 shadow-[0_2px_10px_rgba(46,103,255,0.35)] transition-all"
                title={t("composer.send")}
              >
                <ArrowUp className="size-4" />
                <span className="sr-only">{t("composer.sendSr")}</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
