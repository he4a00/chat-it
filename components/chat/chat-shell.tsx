"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { useTRPC } from "@/trpc/react"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/sidebar/app-sidebar"
import { ChatWorkspace } from "@/components/chat/chat-workspace"
import { ProgressPanel } from "@/components/learner/progress-panel"
import {
  useCreateSession,
  useDeleteSession,
  useDuplicateSession,
  useRenameSession,
  useSessions,
} from "@/server/hooks/use-sessions"
import {
  useLearnerOverview,
  useRefreshLearnerOverview,
  useStartReview,
} from "@/server/hooks/use-learner"
import { formatSessionTimestamp } from "@/lib/session-utils"
import { useLanguage } from "@/hooks/use-language"
import { notify } from "@/lib/toast"
import type { ChatSession } from "@/types/session"
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
  const { language } = useLanguage()

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

  // Sessions + learner progress: TanStack Query is the source of truth, seeded from RSC.
  const { sessions, isPending } = useSessions(initialSessions)
  const { data: overview, isPending: isOverviewPending } = useLearnerOverview(initialOverview)
  const refreshOverview = useRefreshLearnerOverview()

  const [progressOpen, setProgressOpen] = React.useState(false)

  const createMutation = useCreateSession()
  const renameMutation = useRenameSession()
  const deleteMutation = useDeleteSession()
  const duplicateMutation = useDuplicateSession()
  const startReviewMutation = useStartReview()

  const activeSessionTitle = React.useMemo(
    () => sessions.find((session) => session.id === activeSessionId)?.title,
    [sessions, activeSessionId],
  )

  const handleSelectSession = React.useCallback(
    (id: string) => {
      // Let the route drive state so the workspace remounts with the right messages.
      router.push(`/c/${id}`)
    },
    [router],
  )

  const handleNewChat = React.useCallback(() => {
    setActiveSessionId(null)
    setNewChatId(crypto.randomUUID())
    router.push("/")
  }, [router])

  // The panel refetches progress on open, so it's always current without polling.
  const handleOpenProgress = React.useCallback(() => {
    setProgressOpen(true)
    refreshOverview()
  }, [refreshOverview])

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
        return list.some((session) => session.id === chatId)
          ? list.map((session) => (session.id === chatId ? { ...session, ...optimistic } : session))
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
    [queryClient, listKey, createMutation],
  )

  const handleDeleteSession = React.useCallback(
    (id: string) => {
      // Remove optimistically (with rollback on failure) — handled by the hook.
      if (activeSessionId === id) handleNewChat()
      deleteMutation.mutate({ chatId: id })
    },
    [activeSessionId, handleNewChat, deleteMutation],
  )

  const handleRenameSession = React.useCallback(
    (id: string, newTitle: string) => {
      const trimmed = newTitle.trim()
      if (!trimmed) return
      renameMutation.mutate({ chatId: id, title: trimmed })
    },
    [renameMutation],
  )

  const handleDuplicateSession = React.useCallback(
    (id: string) => {
      duplicateMutation.mutate({ chatId: id })
    },
    [duplicateMutation],
  )

  // A finished turn can change the title/timestamp, so refresh the session list.
  const refreshSessions = React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: listKey })
  }, [queryClient, listKey])

  // One-tap review: create a targeted review session, stash the seed prompt, and open it.
  const handleStartReview = React.useCallback(async () => {
    try {
      const review = await startReviewMutation.mutateAsync({ lang: language })
      sessionStorage.setItem(`shawky:review:${review.chatId}`, review.prompt)
      setProgressOpen(false)
      router.push(`/c/${review.chatId}`)
    } catch (err) {
      console.error("Failed to start review:", err)
      notify.error(
        language === "ar" ? "تعذّر بدء جلسة المراجعة" : "Couldn't start the review",
        language === "ar" ? "حاول مرة أخرى بعد قليل." : "Please try again in a moment.",
      )
    }
  }, [startReviewMutation, language, router])

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
        onOpenProgress={handleOpenProgress}
      />

      <SidebarInset className="flex flex-col flex-1 h-screen overflow-hidden bg-background">
        <ChatWorkspace
          key={currentChatId}
          chatId={currentChatId}
          // Only seed messages for a real session. Otherwise a just-deleted chat's
          // messages would flash into the fresh "new chat" workspace.
          initialMessages={activeSessionId ? initialMessages : []}
          activeSessionTitle={activeSessionTitle}
          isNewChat={!activeSessionId}
          recentSession={sessions[0] ? { id: sessions[0].id, title: sessions[0].title } : null}
          onFirstMessage={handleFirstMessage}
          onFinishResponse={refreshSessions}
          onOpenSession={handleSelectSession}
          onOpenProgress={handleOpenProgress}
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
