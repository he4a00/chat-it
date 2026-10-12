"use client"

import * as React from "react"
import { type UIMessage, isToolUIPart, getToolName } from "ai"
import { useUser } from "@clerk/nextjs"
import { useTranslation } from "react-i18next"
import {
  MessageScrollerProvider,
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerButton,
} from "@/components/ui/message-scroller"
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
} from "@/components/ui/message"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import { Markdown } from "@/components/chat/markdown"
import { ThinkingIndicator } from "@/components/chat/thinking-indicator"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Marker, MarkerIcon, MarkerContent } from "@/components/ui/marker"
import { cn } from "cn"
import { shawkyAvatar } from "@/lib/brand"
import { Copy, Check, RotateCcw, ThumbsUp, ThumbsDown, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { QuizWidget, type QuizQuestionItem, type QuizOption } from "@/components/widgets/quiz-widget"
import { QuickCheckWidget } from "@/components/widgets/quick-check-widget"
import { FlashcardDeckWidget } from "@/components/widgets/flashcard-deck-widget"
import { MathProblemWidget } from "@/components/widgets/math-problem-widget"

interface ChatMessagesProps {
  messages: UIMessage[]
  status: string
  onRegenerate?: () => void
  onToolOutput?: (toolCallId: string, output: unknown) => void
  onSendFeedback?: (feedback: string) => void
}

export function ChatMessages({
  messages,
  status,
  onRegenerate,
  onSendFeedback,
}: ChatMessagesProps) {
  const { user } = useUser()
  const { t } = useTranslation("chat")
  const [copiedId, setCopiedId] = React.useState<string | null>(null)

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const [feedback, setFeedback] = React.useState<Record<string, "up" | "down">>({})

  const handleFeedback = (id: string, value: "up" | "down") => {
    setFeedback((prev) => {
      const next = { ...prev }
      if (next[id] === value) delete next[id]
      else next[id] = value
      return next
    })
  }

  const isGenerating = status === "streaming" || status === "submitted"

  const hasRenderableContent = (message: UIMessage) =>
    message.parts?.some(
      (part) =>
        (part.type === "text" && Boolean((part as { text?: string }).text?.trim())) ||
        isToolUIPart(part),
    ) ?? false

  const lastMessage = messages[messages.length - 1]
  // The model can take a few seconds before its first token, so show the
  // indicator until the pending assistant message actually has content.
  const showThinkingIndicator =
    isGenerating &&
    (!lastMessage || lastMessage.role === "user" || !hasRenderableContent(lastMessage))

  return (
    <MessageScrollerProvider autoScroll>
      <MessageScroller className="size-full">
        <MessageScrollerViewport className="px-4 py-4 md:px-6">
          <MessageScrollerContent className="max-w-3xl mx-auto pb-36">
            {messages.map((message, index) => {
              const isUser = message.role === "user"
              const isLast = index === messages.length - 1
              const messageId = message.id || `msg-${index}`

              // Skip the empty assistant placeholder that exists before the first
              // token arrives — the thinking indicator below covers that state.
              if (!isUser && !hasRenderableContent(message)) return null

              // Extract plain text for copying
              const fullText =
                message.parts
                  ?.filter((p) => p.type === "text")
                  .map((p) => ("text" in p ? p.text : ""))
                  .join("\n") || ""

              return (
                <MessageScrollerItem
                  key={messageId}
                  messageId={messageId}
                  scrollAnchor={isUser}
                >
                  <Message align={isUser ? "end" : "start"} className="gap-3">
                  {/* Avatar */}
                  <MessageAvatar className="size-8 rounded-none border border-border/60 shrink-0 mt-0.5">
                    {isUser ? (
                      user?.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={user.imageUrl}
                          alt="User"
                          className="size-full object-cover rounded-full"
                        />
                      ) : (
                        <div className="size-full flex items-center justify-center bg-secondary text-secondary-foreground text-xs font-semibold">
                          {user?.firstName?.[0] || "U"}
                        </div>
                      )
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={shawkyAvatar(64)}
                        alt="Shawky (شوقي)"
                        className=""
                        width={32}
                        height={32}
                      />
                    )}
                  </MessageAvatar>

                  {/* Content Container (no name headers) */}
                  <MessageContent className={isUser ? "items-end max-w-[85%] sm:max-w-[75%]" : "items-start w-full"}>
                    {isUser ? (
                      /* User Bubble */
                      <Bubble
                        variant="default"
                        align="end"
                        className="rounded-2xl rounded-tr-xs bg-primary text-primary-foreground px-4 py-2.5 shadow-xs"
                      >
                        <BubbleContent className="p-0 text-sm font-sans whitespace-pre-wrap leading-relaxed">
                          {fullText}
                        </BubbleContent>
                      </Bubble>
                    ) : (
                      /* Assistant Bubble */
                      <div className="flex flex-col gap-3 w-full">
                        <Bubble
                          variant="ghost"
                          align="start"
                          className="w-full rounded-2xl rounded-tl-xs border border-border/60 bg-card/60 backdrop-blur-sm px-5 py-4 shadow-xs"
                        >
                          <BubbleContent className="p-0 w-full font-sans text-sm text-foreground">
                            {/* Render text parts with KaTeX math */}
                            {message.parts && message.parts.length > 0 ? (
                              message.parts.map((part, pIdx) => {
                                if (part.type === "text") {
                                  return (
                                    <Markdown
                                      key={`p-${pIdx}`}
                                      content={part.text}
                                      className="leading-relaxed"
                                    />
                                  )
                                }

                                if (isToolUIPart(part)) {
                                  return (
                                    <ToolCallWidgetCard
                                      key={`tool-${pIdx}`}
                                      messageId={message.id}
                                      part={part}
                                      onSendFeedback={onSendFeedback}
                                    />
                                  )
                                }

                                return null
                              })
                            ) : (
                              <Markdown content={fullText} className="leading-relaxed" />
                            )}
                            {isLast && isGenerating && (
                              <span className="ms-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 animate-pulse rounded-xs bg-primary/70 align-middle" />
                            )}
                          </BubbleContent>
                        </Bubble>

                        {/* Message Action Footer */}
                        <MessageFooter className="flex items-center gap-1 text-muted-foreground px-1">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => handleCopy(message.id, fullText)}
                            className="size-7 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                            title={t("messages.copy")}
                          >
                            {copiedId === message.id ? (
                              <Check className="size-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="size-3.5" />
                            )}
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => handleFeedback(message.id, "up")}
                            className={cn(
                              "size-7 rounded-md hover:bg-muted",
                              feedback[message.id] === "up"
                                ? "text-emerald-500"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                            title={t("messages.helpful")}
                          >
                            <ThumbsUp className="size-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => handleFeedback(message.id, "down")}
                            className={cn(
                              "size-7 rounded-md hover:bg-muted",
                              feedback[message.id] === "down"
                                ? "text-rose-500"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                            title={t("messages.notHelpful")}
                          >
                            <ThumbsDown className="size-3.5" />
                          </Button>

                          {isLast && onRegenerate && (
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={onRegenerate}
                              className="size-7 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                              title={t("messages.regenerate")}
                            >
                              <RotateCcw className="size-3.5" />
                            </Button>
                          )}
                        </MessageFooter>
                      </div>
                    )}
                  </MessageContent>
                </Message>
              </MessageScrollerItem>
            )
          })}

          {/* Thinking indicator while waiting for the first token */}
          {showThinkingIndicator && (
            <MessageScrollerItem messageId="thinking-indicator" scrollAnchor>
              <div className="px-1 py-2">
                <ThinkingIndicator label={t("messages.thinking")} />
              </div>
            </MessageScrollerItem>
          )}
        </MessageScrollerContent>
      </MessageScrollerViewport>

      {/* Floating Scroll to Bottom Button */}
      <MessageScrollerButton />
    </MessageScroller>
    </MessageScrollerProvider>
  )
}

/**
 * Visual Tool Call Widget Card rendered inline in the chat message stream
 */
function ToolCallWidgetCard({
  messageId,
  part,
  onSendFeedback,
}: {
  messageId?: string
  part: { type: string; input?: unknown; output?: unknown; state?: string }
  onSendFeedback?: (feedback: string) => void
}) {
  const { t } = useTranslation("chat")
  const toolName = (getToolName as (p: unknown) => string)(part) || part.type.replace(/^tool-/, "")
  const input = ((part.input || part.output || {}) as Record<string, unknown>)
  const output = (part.output ?? {}) as Record<string, unknown>
  const submission = (output.userSubmission ?? {}) as Record<string, unknown>

  if (part.state === "output-error") {
    const errorText = (part as { errorText?: string }).errorText
    return (
      <Alert variant="destructive" className="my-2.5">
        <AlertTitle>{t("tools.errorTitle")}</AlertTitle>
        <AlertDescription>{errorText || t("tools.errorDetail")}</AlertDescription>
      </Alert>
    )
  }

  if (toolName === "updateLearnerNotes") {
    const topic = String(input.topic || "")
    const observation = String(input.observation || "")
    return (
      <Marker variant="border" className="my-3 normal-case tracking-normal">
        <MarkerIcon>
          <Sparkles className="size-3.5 text-primary" />
        </MarkerIcon>
        <MarkerContent className="text-[11px] leading-relaxed text-muted-foreground">
          <span className="font-semibold text-primary">
            {t("tools.noteCaptured")}
          </span>
          {topic ? <span className="font-mono"> [{topic}]</span> : null} — {observation}
        </MarkerContent>
      </Marker>
    )
  }

  if (toolName === "createQuiz") {
    const topic = String(input.topic || t("tools.topicFallback.quiz"))
    const title = input.title ? String(input.title) : undefined
    const rawQuestions = (input.questions || []) as Array<QuizQuestionItem>

    let questionsList: QuizQuestionItem[] = Array.isArray(rawQuestions) && rawQuestions.length > 0 ? rawQuestions : []
    if (questionsList.length === 0 && input.question && input.options) {
      questionsList = [
        {
          id: "q1",
          question: String(input.question),
          options: (input.options || []) as QuizOption[],
          hint: input.hint ? String(input.hint) : undefined,
          explanation: String(input.explanation || ""),
        },
      ]
    }

    if (questionsList.length === 0) {
      return (
        <ToolPlaceholder
          label={t("tools.placeholder.quiz")}
        />
      )
    }

    return (
      <QuizWidget
        messageId={messageId}
        topic={topic}
        subject={input.subject ? String(input.subject) : undefined}
        title={title}
        questions={questionsList}
        initialAnswers={submission.answers as Record<number, string> | undefined}
        onAnswerSubmitted={(data) => {
          onSendFeedback?.(data.feedbackPrompt)
        }}
      />
    )
  }

  if (toolName === "createFlashcardDeck") {
    const topic = String(input.topic || t("tools.topicFallback.flashcards"))
    const cards = (input.cards || []) as Array<{ id: string; front: string; back: string; conceptTag?: string }>

    if (cards.length === 0) {
      return (
        <ToolPlaceholder
          label={t("tools.placeholder.flashcards")}
        />
      )
    }

    return (
      <FlashcardDeckWidget
        messageId={messageId}
        topic={topic}
        subject={input.subject ? String(input.subject) : undefined}
        cards={cards}
        initialMasteredIds={
          Array.isArray(submission.masteredIds) ? (submission.masteredIds as string[]) : undefined
        }
        initialGraded={
          submission.graded && typeof submission.graded === "object"
            ? (submission.graded as Record<string, "mastered" | "review">)
            : undefined
        }
        onDeckCompleted={(prompt) => {
          onSendFeedback?.(prompt)
        }}
      />
    )
  }

  if (toolName === "createMathProblem") {
    const topic = String(input.topic || t("tools.topicFallback.math"))
    const problemStatement = String(input.problemStatement || "")
    const steps = (input.steps || []) as Array<{ stepNumber: number; instruction: string; hint?: string }>
    const finalAnswer = String(input.finalAnswer || "")
    const acceptedFormats = (input.acceptedFormats || []) as string[]
    const explanation = String(input.explanation || "")

    if (!problemStatement) {
      return (
        <ToolPlaceholder
          label={t("tools.placeholder.math")}
        />
      )
    }

    return (
      <MathProblemWidget
        messageId={messageId}
        topic={topic}
        subject={input.subject ? String(input.subject) : undefined}
        problemStatement={problemStatement}
        steps={steps}
        finalAnswer={finalAnswer}
        acceptedFormats={acceptedFormats}
        explanation={explanation}
        initialUserAnswer={typeof submission.userAnswer === "string" ? submission.userAnswer : undefined}
        initialCorrect={typeof submission.isCorrect === "boolean" ? submission.isCorrect : undefined}
        onAnswerSubmitted={(data) => {
          onSendFeedback?.(data.feedbackPrompt)
        }}
      />
    )
  }

  if (toolName === "createQuickCheck") {
    const statement = String(input.statement || "")
    const isTrue = Boolean(input.isTrue)
    const explanation = String(input.explanation || "")

    if (!statement) {
      return (
        <ToolPlaceholder
          label={t("tools.placeholder.quickCheck")}
        />
      )
    }

    return (
      <QuickCheckWidget
        messageId={messageId}
        topic={input.topic ? String(input.topic) : undefined}
        subject={input.subject ? String(input.subject) : undefined}
        statement={statement}
        isTrue={isTrue}
        explanation={explanation}
        initialUserChoice={typeof submission.userChoice === "boolean" ? submission.userChoice : undefined}
        onAnswerSubmitted={(data) => {
          onSendFeedback?.(data.feedbackPrompt)
        }}
      />
    )
  }

  return (
    <div className="my-2.5 rounded-xl border border-border/60 bg-muted/20 p-3.5 font-sans text-xs text-muted-foreground">
      {t("tools.unknown", { name: toolName })}
    </div>
  )
}

/**
 * Skeleton placeholder shown while a tool's payload is still streaming in.
 */
function ToolPlaceholder({ label }: { label: string }) {
  return (
    <div className="my-2.5 rounded-xl border border-border/60 bg-muted/20 p-3.5">
      <div className="flex items-center gap-2.5">
        <Spinner className="size-4 text-primary" />
        <span className="font-sans text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="mt-3 flex flex-col gap-2">
        <Skeleton className="h-3 w-3/4 rounded-full" />
        <Skeleton className="h-3 w-1/2 rounded-full" />
      </div>
    </div>
  )
}
