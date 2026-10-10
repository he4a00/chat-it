"use client"

import * as React from "react"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/sidebar/app-sidebar"
import { INITIAL_MOCK_SESSIONS } from "@/lib/mock-sessions"
import { ChatSession } from "@/types/session"
import { Separator } from "@/components/ui/separator"
import { useTranslation } from 'react-i18next'

export default function MainPage() {
  const { t } = useTranslation()
  const [sessions, setSessions] = React.useState<ChatSession[]>(INITIAL_MOCK_SESSIONS)
  const [activeSessionId, setActiveSessionId] = React.useState<string | null>("session-1")
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

      <SidebarInset className="flex flex-col flex-1 h-screen bg-background">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/80 px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              {activeSession ? activeSession.title : t('noSessionSelected', 'No session selected')}
            </span>
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center p-6 text-muted-foreground text-sm">
          {activeSession ? (
            <div className="text-center">
              <p className="font-medium text-foreground">{t('activeSessionTitle', 'Active Session: {{title}}', { title: activeSession.title })}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('idIdBullCategoryCategory', 'ID: {{id}} &bull; Category: {{category}}', { id: activeSession.id, category: activeSession.category })}</p>
            </div>
          ) : (
            <p>{t('selectASessionFromTheSidebarOrClickLdquonewChatrdquo', 'Select a session from the sidebar or click &ldquo;New Chat&rdquo;.')}</p>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
