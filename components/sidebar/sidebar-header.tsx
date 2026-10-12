"use client"

import * as React from "react"
import Link from "next/link"
import { PlusIcon } from "lucide-react"
import { SidebarHeader, SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { SidebarSearch } from "./sidebar-search"
import { shawkyAvatar } from "@/lib/brand"
import { useTranslation } from 'react-i18next'

interface AppSidebarHeaderProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  onNewChat: () => void
}

export function AppSidebarHeader({
  searchQuery,
  onSearchChange,
  onNewChat,
}: AppSidebarHeaderProps) {
  const { t } = useTranslation()
  // Global shortcut Ctrl+K to create a new chat
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        onNewChat()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onNewChat])

  return (
    <SidebarHeader className="border-b border-sidebar-border/70 p-3 flex flex-col gap-2.5">
      {/* Brand Logo & Collapse Trigger */}
      <div className="flex items-center justify-between">
        {/* SidebarHeader sets [--radius:0]; restore it so the avatar can round. */}
        <Link
          href="/"
          aria-label="Shawky"
          className="flex items-center justify-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring/40 [--radius:0.5rem]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={shawkyAvatar(64)}
            alt="Shawky (شوقي)"
            className="size-6 rounded-lg"
            width={24}
            height={24}
          />
        </Link>

        <SidebarTrigger className="rounded-full text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent" />
      </div>

      {/* Rounded New Chat Action Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onNewChat}
        className="w-full justify-between h-9 px-3.5 rounded-full border-sidebar-border bg-sidebar hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-xs font-medium text-sidebar-foreground/90 transition-colors shadow-2xs group"
      >
        <span className="flex items-center gap-2">
          <PlusIcon className="size-3.5 text-primary transition-transform group-hover:scale-110" />
          <span>{t("common:newChat")}</span>
        </span>
        <kbd className="pointer-events-none rounded-full border border-sidebar-border bg-sidebar-accent/50 px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
          Ctrl+K
        </kbd>
      </Button>

      {/* Rounded Search Bar */}
      <SidebarSearch
        value={searchQuery}
        onChange={onSearchChange}
      />
    </SidebarHeader>
  )
}
