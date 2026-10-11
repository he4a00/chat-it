"use client"

import * as React from "react"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/sidebar/app-sidebar"
import { ChatWorkspace } from "@/components/chat/chat-workspace"
import { INITIAL_MOCK_SESSIONS } from "@/lib/mock-sessions"
import { ChatSession } from "@/types/session"

export default function MainPage() {
  const [sessions, setSessions] = React.useState<ChatSession[]>(INITIAL_MOCK_SESSIONS)
  const [activeSessionId, setActiveSessionId] = React.useState<string | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")

  const activeSession = React.useMemo(() => {
    return sessions.find((s) => s.id === activeSessionId) || null
  }, [sessions, activeSessionId])

  const handleSelectSession = React.useCallback((id: string) => {
    setActiveSessionId(id)
  }, [])

  const handleNewChat = React.useCallback(() => {
    setActiveSessionId(null)
  }, [])

  const handleDeleteSession = React.useCallback((id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id))
    setActiveSessionId((current) => (current === id ? null : current))
  }, [])

  const handleRenameSession = React.useCallback((id: string, newTitle: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: newTitle } : s))
    )
  }, [])

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        onNewChat={handleNewChat}
        onClearSearch={() => setSearchQuery("")}
      />

      <SidebarInset className="flex flex-col flex-1 h-screen overflow-hidden bg-background">
        <ChatWorkspace
          activeSessionId={activeSessionId}
          activeSessionTitle={activeSession?.title}
          onNewChat={handleNewChat}
        />
      </SidebarInset>
    </SidebarProvider>
  )
}
