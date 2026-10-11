"use client"

import * as React from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { ChatEmptyState } from "@/components/chat/chat-empty-state"
import { ChatMessages } from "@/components/chat/chat-messages"
import { ChatComposer } from "@/components/chat/chat-composer"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"

interface ChatWorkspaceProps {
  activeSessionId: string | null
  activeSessionTitle?: string
  onNewChat?: () => void
}

export function ChatWorkspace({
  activeSessionId,
  activeSessionTitle,
}: ChatWorkspaceProps) {
  const [input, setInput] = React.useState("")

  // Configure AI SDK Transport with dynamic activeSessionId
  const transport = React.useMemo(() => {
    return new DefaultChatTransport({
      api: "/api/chat",
      body: () => ({
        chatId: activeSessionId || undefined,
      }),
    })
  }, [activeSessionId])

  // Initialize AI SDK useChat
  const { messages, sendMessage, status, stop, regenerate } = useChat({
    id: activeSessionId || undefined,
    transport,
  })

  const isLoading = status === "streaming" || status === "submitted"

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || input).trim()
    if (!text || isLoading) return

    setInput("")
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

          {/* Active Session Title (Shown only when in an existing session) */}
          {activeSessionId && activeSessionTitle && (
            <>
              <Separator orientation="vertical" className="h-4" />
              <h1 className="text-xs sm:text-sm font-semibold text-foreground/90 truncate max-w-[200px] sm:max-w-md font-sans">
                {activeSessionTitle}
              </h1>
            </>
          )}
        </div>
      </header>

      {/* Main Chat Stage */}
      <main className="relative flex-1 flex flex-col overflow-hidden">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center overflow-y-auto px-4 pt-6 pb-36">
            <ChatEmptyState onSelectPrompt={(prompt) => handleSendMessage(prompt)} />
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
