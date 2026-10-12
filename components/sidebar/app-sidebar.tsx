"use client"

import * as React from "react"
import { useTranslation } from "react-i18next"
import { Sidebar, SidebarRail } from "@/components/ui/sidebar"
import { AppSidebarHeader } from "./sidebar-header"
import { SessionList } from "./session-list"
import { AppSidebarFooter } from "./sidebar-footer"
import { ChatSession } from "@/types/session"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  sessions: ChatSession[]
  activeSessionId: string | null
  searchQuery: string
  isLoading?: boolean
  onSearchChange: (query: string) => void
  onSelectSession: (id: string) => void
  onDeleteSession: (id: string) => void
  onRenameSession: (id: string, newTitle: string) => void
  onDuplicateSession?: (id: string) => void
  onNewChat: () => void
  onClearSearch: () => void
  onOpenProgress?: () => void
}

export function AppSidebar({
  sessions,
  activeSessionId,
  searchQuery,
  isLoading = false,
  onSearchChange,
  onSelectSession,
  onDeleteSession,
  onRenameSession,
  onDuplicateSession,
  onNewChat,
  onClearSearch,
  onOpenProgress,
  ...props
}: AppSidebarProps) {
  const { i18n } = useTranslation()

  return (
    <Sidebar
      side={i18n.dir() === "rtl" ? "right" : "left"}
      collapsible="offcanvas"
      className="border-e border-sidebar-border/80 bg-sidebar text-sidebar-foreground shadow-xs"
      {...props}
    >
      <AppSidebarHeader
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        onNewChat={onNewChat}
      />

      <SessionList
        sessions={sessions}
        activeSessionId={activeSessionId}
        searchQuery={searchQuery}
        isLoading={isLoading}
        onSelectSession={onSelectSession}
        onDeleteSession={onDeleteSession}
        onRenameSession={onRenameSession}
        onDuplicateSession={onDuplicateSession}
        onClearSearch={onClearSearch}
      />

      <AppSidebarFooter onOpenProgress={onOpenProgress} />

      <SidebarRail />
    </Sidebar>
  )
}
