"use client"

import * as React from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { ChatEmptyState } from "@/components/chat/chat-empty-state"
import { ChatMessages } from "@/components/chat/chat-messages"
import { ChatComposer } from "@/components/chat/chat-composer"
import { LanguageMenu } from "@/components/chat/language-menu"
import { ThemeSwitch } from "@/components/chat/theme-switch"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/hooks/use-language"
import { deriveSessionTitle } from "@/lib/session-utils"
import type { UIMessage } from "ai"

interface ChatWorkspaceProps {
  chatId: string
  initialMessages?: UIMessage[]
  activeSessionTitle?: string
  isNewChat?: boolean
  recentSession?: { id: string; title: string } | null
  onFirstMessage?: (chatId: string, title: string) => void
  onFinishResponse?: () => void
  onOpenSession?: (id: string) => void
}

export function ChatWorkspace({
  chatId,
  initialMessages = [],
  activeSessionTitle,
  isNewChat = false,
  recentSession,
  onFirstMessage,
  onFinishResponse,
  onOpenSession,
}: ChatWorkspaceProps) {
  const [input, setInput] = React.useState("")
  const hasTriggeredFirstMessageRef = React.useRef(!isNewChat)
  const { language } = useLanguage()
  const isAr = language === "ar"

  // Send only the newest message; the server loads the rest of the history from Neon.
  const transport = React.useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest: ({ messages, id }) => ({
          body: { message: messages[messages.length - 1], id },
        }),
      }),
    []
  )

  const { messages, sendMessage, status, stop, regenerate, error } = useChat({
    id: chatId,
    messages: initialMessages,
    transport,
    onFinish: () => {
      onFinishResponse?.()
    },
  })

  const isLoading = status === "streaming" || status === "submitted"

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || input).trim()
    if (!text || isLoading) return

    setInput("")

    // Brand-new session: record it in the sidebar + URL on the first send.
    if (!hasTriggeredFirstMessageRef.current) {
      hasTriggeredFirstMessageRef.current = true
      onFirstMessage?.(chatId, deriveSessionTitle(text))
    }

    sendMessage({ text })
  }

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    handleSendMessage()
  }

  return (
    <div className="relative flex flex-col flex-1 h-screen overflow-hidden bg-background">
      {/* Top Header Bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/60 px-4 sm:px-6 bg-background/80 backdrop-blur-md z-20">
        <div className="flex items-center gap-2.5 min-w-0">
          <SidebarTrigger />

          <Separator orientation="vertical" className="h-4" />
          <h1 className="text-xs sm:text-sm font-semibold text-foreground/90 truncate max-w-[200px] sm:max-w-md font-sans">
            {activeSessionTitle ?? (isAr ? "محادثة جديدة" : "New chat")}
          </h1>
        </div>

        {/* Header controls: language + theme, grouped into one pill */}
        <div className="flex items-center gap-1 rounded-full bg-muted/50 p-1">
          <LanguageMenu />
          <ThemeSwitch className="px-1" />
        </div>
      </header>

      {/* Main Chat Stage */}
      <main className="relative flex-1 flex flex-col overflow-hidden">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center overflow-y-auto px-4 pt-6 pb-36">
            <ChatEmptyState
              onSelectPrompt={(prompt) => handleSendMessage(prompt)}
              recentSession={recentSession}
              onOpenSession={onOpenSession}
            />
          </div>
        ) : (
          <div className="flex-1 overflow-hidden">
            <ChatMessages
              messages={messages}
              status={status}
              onRegenerate={regenerate}
              onSendFeedback={(feedback) => handleSendMessage(feedback)}
            />
          </div>
        )}

        {/* Stream error */}
        {error && (
          <div className="pointer-events-none absolute inset-x-0 bottom-24 z-20 px-4">
            <div className="pointer-events-auto mx-auto max-w-3xl">
              <Alert variant="destructive">
                <AlertTitle>{isAr ? "تعذّر إكمال الرد" : "The response failed"}</AlertTitle>
                <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
                  <span>
                    {isAr
                      ? "حدث خطأ أثناء توليد الرد. يمكنك المحاولة مرة أخرى."
                      : "Something went wrong while generating the reply."}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => regenerate()}
                    className="shrink-0"
                  >
                    {isAr ? "إعادة المحاولة" : "Retry"}
                  </Button>
                </AlertDescription>
              </Alert>
            </div>
          </div>
        )}

        {/* Floating Bottom Composer with generous gradient fade */}
        <div className="absolute inset-x-0 bottom-0 pointer-events-none p-4 pb-6 bg-gradient-to-t from-background via-background/90 to-transparent z-10">
          <div className="pointer-events-auto max-w-3xl mx-auto w-full">
            <ChatComposer
              input={input}
              onInputChange={setInput}
              onSubmit={handleSubmit}
              isLoading={isLoading}
              onStop={stop}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
