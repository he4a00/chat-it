"use client"

import * as React from "react"
import { type UIMessage, isToolUIPart, getToolName } from "ai"
import { useUser } from "@clerk/nextjs"
import { useLanguage } from "@/hooks/use-language"
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
import {
  Copy,
  Check,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  HelpCircle,
  Layers,
  Calculator,
  CheckCircle2,
} from "lucide-react"
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
  const { language } = useLanguage()
  const isAr = language === "ar"
  const [copiedId, setCopiedId] = React.useState<string | null>(null)

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
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
                  <MessageAvatar className="size-8 rounded-full border border-border/60 shrink-0 mt-0.5">
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
                        src="/images/shawky-headshot.png"
                        alt="Shawky (شوقي)"
                        className="size-full object-cover rounded-full"
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
                                      isAr={isAr}
                                      onSendFeedback={onSendFeedback}
                                    />
                                  )
                                }

                                return null
                              })
                            ) : (
                              <Markdown content={fullText} className="leading-relaxed" />
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
                            title={isAr ? "نسخ النص" : "Copy to clipboard"}
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
                            className="size-7 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                            title={isAr ? "مفيد" : "Helpful"}
                          >
                            <ThumbsUp className="size-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="size-7 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                            title={isAr ? "غير مفيد" : "Not helpful"}
                          >
                            <ThumbsDown className="size-3.5" />
                          </Button>

                          {isLast && onRegenerate && (
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={onRegenerate}
                              className="size-7 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                              title={isAr ? "إعادة الصياغة" : "Regenerate response"}
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

          {/* Typing Indicator while waiting for the first token */}
          {showThinkingIndicator && (
            <MessageScrollerItem messageId="typing-indicator" scrollAnchor>
              <div className="flex items-center gap-2 text-muted-foreground text-xs py-2 px-1 animate-pulse font-sans">
                <div className="size-2 rounded-full bg-primary" />
                <div className="size-2 rounded-full bg-primary delay-75" />
                <div className="size-2 rounded-full bg-primary delay-150" />
                <span className="ms-1">{isAr ? "شوقي يفكر ويبني الإجابة..." : "Shawky is thinking..."}</span>
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
  isAr,
  onSendFeedback,
}: {
  messageId?: string
  part: { type: string; input?: unknown; output?: unknown; state?: string }
  isAr: boolean
  onSendFeedback?: (feedback: string) => void
}) {
  const toolName = (getToolName as (p: unknown) => string)(part) || part.type.replace(/^tool-/, "")
  const input = ((part.input || part.output || {}) as Record<string, unknown>)
  const output = (part.output ?? {}) as Record<string, unknown>
  const submission = (output.userSubmission ?? {}) as Record<string, unknown>

  if (toolName === "updateLearnerNotes") {
    const topic = String(input.topic || "")
    const observation = String(input.observation || "")
    return (
      <div className="my-2.5 p-3 rounded-xl border border-primary/25 bg-primary/5 text-xs text-foreground flex items-center gap-2.5 font-sans">
        <Sparkles className="size-4 text-primary shrink-0" />
        <div className="leading-relaxed">
          <span className="font-semibold text-primary">
            {isAr ? "ملاحظة تربوية مسجلة:" : "Pedagogical Note Captured:"}
          </span>{" "}
          {topic && <span className="text-muted-foreground font-mono">[{topic}]</span>}{" "}
          <span>{observation}</span>
        </div>
      </div>
    )
  }

  if (toolName === "createQuiz") {
    const topic = String(input.topic || "Quiz")
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
        <div className="my-2.5 p-3.5 rounded-xl border border-border/60 bg-muted/20 text-xs text-muted-foreground flex items-center gap-2.5 font-sans animate-pulse">
          <HelpCircle className="size-4 text-primary" />
          <span>{isAr ? "جاري تجهيز الاختبار التفاعلي..." : "Shawky is preparing your quiz challenge..."}</span>
        </div>
      )
    }

    return (
      <QuizWidget
        messageId={messageId}
        topic={topic}
        title={title}
        questions={questionsList}
        isAr={isAr}
        initialAnswers={submission.answers as Record<number, string> | undefined}
        onAnswerSubmitted={(data) => {
          onSendFeedback?.(data.feedbackPrompt)
        }}
      />
    )
  }

  if (toolName === "createFlashcardDeck") {
    const topic = String(input.topic || "Flashcards")
    const cards = (input.cards || []) as Array<{ id: string; front: string; back: string; conceptTag?: string }>

    if (cards.length === 0) {
      return (
        <div className="my-2.5 p-3.5 rounded-xl border border-border/60 bg-muted/20 text-xs text-muted-foreground flex items-center gap-2.5 font-sans animate-pulse">
          <Layers className="size-4 text-primary" />
          <span>{isAr ? "جاري إنشاء البطاقات التعليمية..." : "Shawky is creating your flashcard deck..."}</span>
        </div>
      )
    }

    return (
      <FlashcardDeckWidget
        messageId={messageId}
        topic={topic}
        cards={cards}
        isAr={isAr}
        onDeckCompleted={(prompt) => {
          onSendFeedback?.(prompt)
        }}
      />
    )
  }

  if (toolName === "createMathProblem") {
    const topic = String(input.topic || "Math Problem")
    const problemStatement = String(input.problemStatement || "")
    const steps = (input.steps || []) as Array<{ stepNumber: number; instruction: string; hint?: string }>
    const finalAnswer = String(input.finalAnswer || "")
    const acceptedFormats = (input.acceptedFormats || []) as string[]
    const explanation = String(input.explanation || "")

    if (!problemStatement) {
      return (
        <div className="my-2.5 p-3.5 rounded-xl border border-border/60 bg-muted/20 text-xs text-muted-foreground flex items-center gap-2.5 font-sans animate-pulse">
          <Calculator className="size-4 text-primary" />
          <span>{isAr ? "جاري تجهيز المسألة الرياضية الموجهة..." : "Shawky is structuring the guided math problem..."}</span>
        </div>
      )
    }

    return (
      <MathProblemWidget
        messageId={messageId}
        topic={topic}
        problemStatement={problemStatement}
        steps={steps}
        finalAnswer={finalAnswer}
        acceptedFormats={acceptedFormats}
        explanation={explanation}
        isAr={isAr}
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
        <div className="my-2.5 p-3.5 rounded-xl border border-border/60 bg-muted/20 text-xs text-muted-foreground flex items-center gap-2.5 font-sans animate-pulse">
          <CheckCircle2 className="size-4 text-primary" />
          <span>{isAr ? "جاري تحضير سؤال الصواب والخطأ..." : "Shawky is preparing the quick check..."}</span>
        </div>
      )
    }

    return (
      <QuickCheckWidget
        messageId={messageId}
        statement={statement}
        isTrue={isTrue}
        explanation={explanation}
        isAr={isAr}
        initialUserChoice={typeof submission.userChoice === "boolean" ? submission.userChoice : undefined}
        onAnswerSubmitted={(data) => {
          onSendFeedback?.(data.feedbackPrompt)
        }}
      />
    )
  }

  return null
}
