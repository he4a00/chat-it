"use client"

import * as React from "react"
import { Sidebar, SidebarRail } from "@/components/ui/sidebar"
import { AppSidebarHeader } from "./sidebar-header"
import { SessionList } from "./session-list"
import { AppSidebarFooter } from "./sidebar-footer"
import { ChatSession } from "@/types/session"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  sessions: ChatSession[]
  activeSessionId: string | null
  searchQuery: string
  onSearchChange: (query: string) => void
  onSelectSession: (id: string) => void
  onDeleteSession: (id: string) => void
  onRenameSession: (id: string, newTitle: string) => void
  onNewChat: () => void
  onClearSearch: () => void
}

export function AppSidebar({
  sessions,
  activeSessionId,
  searchQuery,
  onSearchChange,
  onSelectSession,
  onDeleteSession,
  onRenameSession,
  onNewChat,
  onClearSearch,
  ...props
}: AppSidebarProps) {
  return (
    <Sidebar
      collapsible="offcanvas"
      className="border-r border-sidebar-border/80 bg-sidebar text-sidebar-foreground shadow-xs"
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
        onSelectSession={onSelectSession}
        onDeleteSession={onDeleteSession}
        onRenameSession={onRenameSession}
        onClearSearch={onClearSearch}
      />

      <AppSidebarFooter />

      <SidebarRail />
    </Sidebar>
  )
}
