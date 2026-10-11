"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTRPC } from "@/trpc/react"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/sidebar/app-sidebar"
import { ChatWorkspace } from "@/components/chat/chat-workspace"
import { ProgressPanel } from "@/components/learner/progress-panel"
import { ChatSession } from "@/types/session"
import { formatSessionTimestamp } from "@/lib/session-utils"
import { useLanguage } from "@/hooks/use-language"
import { notify } from "@/lib/toast"
import type { LearnerOverview } from "@/types/learner"
import type { UIMessage } from "ai"

interface ChatShellProps {
  initialSessions?: ChatSession[]
  initialSessionId?: string | null
  initialMessages?: UIMessage[]
  initialOverview?: LearnerOverview
}

export function ChatShell({
  initialSessions = [],
  initialSessionId = null,
  initialMessages = [],
  initialOverview,
}: ChatShellProps) {
  const router = useRouter()
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const [searchQuery, setSearchQuery] = React.useState("")

  // The active session is route-driven. `newChatId` backs the "new chat" route ("/").
  const [activeSessionId, setActiveSessionId] = React.useState<string | null>(initialSessionId)
  const [newChatId, setNewChatId] = React.useState(() => crypto.randomUUID())

  // Keep the active session in sync with route transitions. Navigating between two
  // existing chats (/c/a -> /c/b) does NOT remount ChatShell, so we mirror the prop.
  const [prevRouteSessionId, setPrevRouteSessionId] = React.useState(initialSessionId)
  if (initialSessionId !== prevRouteSessionId) {
    setPrevRouteSessionId(initialSessionId)
    setActiveSessionId(initialSessionId)
  }

  const listKey = trpc.session.list.queryKey()

  // Sessions: the tRPC query cache is the single source of truth, seeded from RSC.
  const { data: sessionsData, isPending } = useQuery({
    ...trpc.session.list.queryOptions(),
    initialData: initialSessions,
  })

  const sessions = sessionsData ?? initialSessions

  // Learner progress — seeded from RSC; consumed by the progress panel + sidebar card.
  const overviewQuery = trpc.learner.getOverview.queryOptions()
  const { data: overview, isPending: isOverviewPending } = useQuery({
    ...overviewQuery,
    ...(initialOverview ? { initialData: initialOverview } : {}),
  })
  const [progressOpen, setProgressOpen] = React.useState(false)
  const { language } = useLanguage()

  const createMutation = useMutation(trpc.session.create.mutationOptions())
  const renameMutation = useMutation(trpc.session.rename.mutationOptions())
  const deleteMutation = useMutation(trpc.session.delete.mutationOptions())
  const duplicateMutation = useMutation(trpc.session.duplicate.mutationOptions())

  const activeSessionTitle = React.useMemo(
    () => sessions.find((s) => s.id === activeSessionId)?.title,
    [sessions, activeSessionId]
  )

  const handleSelectSession = React.useCallback(
    (id: string) => {
      // Let the route drive state so the workspace remounts with the right messages.
      router.push(`/c/${id}`)
    },
    [router]
  )

  const handleNewChat = React.useCallback(() => {
    setActiveSessionId(null)
    setNewChatId(crypto.randomUUID())
    router.push("/")
  }, [router])

  // Called once, when the first message is sent in a brand-new session.
  const handleFirstMessage = React.useCallback(
    async (chatId: string, title: string) => {
      const now = new Date()
      const optimistic: ChatSession = {
        id: chatId,
        title,
        timestamp: formatSessionTimestamp(now),
        category: "today",
        subject: "Math",
        updatedAt: now.toISOString(),
      }

      queryClient.setQueryData<ChatSession[]>(listKey, (prev) => {
        const list = prev ?? []
        return list.some((s) => s.id === chatId)
          ? list.map((s) => (s.id === chatId ? { ...s, ...optimistic } : s))
          : [optimistic, ...list]
      })

      // `chatId` equals `newChatId`, so the workspace key is unchanged and the
      // in-flight stream is not torn down. Reflect the URL without an RSC nav.
      setActiveSessionId(chatId)
      window.history.replaceState(null, "", `/c/${chatId}`)

      try {
        await createMutation.mutateAsync({ id: chatId, title, subject: "Math" })
      } catch (err) {
        console.error("Failed to create session:", err)
      }
    },
    [queryClient, listKey, createMutation]
  )

  const handleDeleteSession = React.useCallback(
    async (id: string) => {
      queryClient.setQueryData<ChatSession[]>(listKey, (prev) =>
        (prev ?? []).filter((s) => s.id !== id)
      )
      if (activeSessionId === id) handleNewChat()

      try {
        await deleteMutation.mutateAsync({ chatId: id })
      } catch (err) {
        console.error("Failed to delete session:", err)
      } finally {
        queryClient.invalidateQueries({ queryKey: listKey })
      }
    },
    [activeSessionId, handleNewChat, deleteMutation, queryClient, listKey]
  )

  const handleRenameSession = React.useCallback(
    async (id: string, newTitle: string) => {
      const trimmed = newTitle.trim()
      if (!trimmed) return

      queryClient.setQueryData<ChatSession[]>(listKey, (prev) =>
        (prev ?? []).map((s) => (s.id === id ? { ...s, title: trimmed } : s))
      )

      try {
        await renameMutation.mutateAsync({ chatId: id, title: trimmed })
      } catch (err) {
        console.error("Failed to rename session:", err)
      } finally {
        queryClient.invalidateQueries({ queryKey: listKey })
      }
    },
    [renameMutation, queryClient, listKey]
  )

  const handleDuplicateSession = React.useCallback(
    async (id: string) => {
      try {
        const copy = await duplicateMutation.mutateAsync({ chatId: id })
        queryClient.setQueryData<ChatSession[]>(listKey, (prev) => [copy, ...(prev ?? [])])
      } catch (err) {
        console.error("Failed to duplicate session:", err)
      } finally {
        queryClient.invalidateQueries({ queryKey: listKey })
      }
    },
    [duplicateMutation, queryClient, listKey]
  )

  const refreshSessions = React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: listKey })
  }, [queryClient, listKey])

  // One-tap review: create a targeted review session, stash the seed prompt, and open it.
  const startReviewMutation = useMutation(trpc.learner.startReview.mutationOptions())

  const handleStartReview = React.useCallback(async () => {
    try {
      const review = await startReviewMutation.mutateAsync({ lang: language })
      sessionStorage.setItem(`shawky:review:${review.chatId}`, review.prompt)
      setProgressOpen(false)
      queryClient.invalidateQueries({ queryKey: listKey })
      router.push(`/c/${review.chatId}`)
    } catch (err) {
      console.error("Failed to start review:", err)
      notify.error(
        language === "ar" ? "تعذّر بدء جلسة المراجعة" : "Couldn't start the review",
        language === "ar" ? "حاول مرة أخرى بعد قليل." : "Please try again in a moment.",
      )
    }
  }, [startReviewMutation, language, queryClient, listKey, router])

  const currentChatId = activeSessionId || newChatId

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        searchQuery={searchQuery}
        isLoading={isPending && sessions.length === 0}
        onSearchChange={setSearchQuery}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        onDuplicateSession={handleDuplicateSession}
        onNewChat={handleNewChat}
        onClearSearch={() => setSearchQuery("")}
        onOpenProgress={() => setProgressOpen(true)}
      />

      <SidebarInset className="flex flex-col flex-1 h-screen overflow-hidden bg-background">
        <ChatWorkspace
          key={currentChatId}
          chatId={currentChatId}
          initialMessages={initialMessages}
          activeSessionTitle={activeSessionTitle}
          isNewChat={!activeSessionId}
          recentSession={sessions[0] ? { id: sessions[0].id, title: sessions[0].title } : null}
          onFirstMessage={handleFirstMessage}
          onFinishResponse={refreshSessions}
          onOpenSession={handleSelectSession}
          onOpenProgress={() => setProgressOpen(true)}
        />
      </SidebarInset>

      <ProgressPanel
        open={progressOpen}
        onOpenChange={setProgressOpen}
        overview={overview}
        isPending={isOverviewPending}
        onStartReview={handleStartReview}
        isStartingReview={startReviewMutation.isPending}
      />
    </SidebarProvider>
  )
}
