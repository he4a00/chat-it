"use client"

import * as React from "react"
import { useTranslation } from "react-i18next"
import {
  AtomIcon,
  CalculatorIcon,
  CheckIcon,
  ClockIcon,
  CopyPlusIcon,
  FlaskConicalIcon,
  LinkIcon,
  MessageSquareTextIcon,
  MoreHorizontalIcon,
  PencilIcon,
  SearchXIcon,
  SigmaIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"

import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from "@/components/ui/sidebar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { notify } from "@/lib/toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChatSession, SessionCategory } from "@/types/session"
import { cn } from "@/lib/utils"

interface SessionListProps {
  sessions: ChatSession[]
  activeSessionId: string | null
  searchQuery: string
  isLoading?: boolean
  onSelectSession: (id: string) => void
  onDeleteSession: (id: string) => void
  onRenameSession: (id: string, newTitle: string) => void
  onDuplicateSession?: (id: string) => void
  onClearSearch: () => void
}

const CATEGORY_ORDER: SessionCategory[] = [
  "today",
  "yesterday",
  "previous_7_days",
  "older",
]

function getSubjectIcon(subject?: string) {
  switch (subject) {
    case "Math":
      return SigmaIcon
    case "Calculus":
      return CalculatorIcon
    case "Physics":
      return AtomIcon
    case "Chemistry":
      return FlaskConicalIcon
    default:
      return MessageSquareTextIcon
  }
}

export function SessionList({
  sessions,
  activeSessionId,
  searchQuery,
  isLoading = false,
  onSelectSession,
  onDeleteSession,
  onRenameSession,
  onDuplicateSession,
  onClearSearch,
}: SessionListProps) {
  const { t } = useTranslation("sidebar")
  const [editingSessionId, setEditingSessionId] = React.useState<string | null>(null)
  const [editTitle, setEditTitle] = React.useState("")
  const [pendingDelete, setPendingDelete] = React.useState<ChatSession | null>(null)

  const handleCopyLink = (id: string) => {
    const url = `${window.location.origin}/c/${id}`
    navigator.clipboard.writeText(url).then(
      () => notify.success(t("toast.linkCopied")),
      () => notify.error(t("toast.linkCopyFailed")),
    )
  }

  // Filter sessions by search query
  const filteredSessions = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return sessions
    return sessions.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.subject?.toLowerCase().includes(q) ||
        s.preview?.toLowerCase().includes(q)
    )
  }, [sessions, searchQuery])

  // Group filtered sessions chronologically
  const groupedSessions = React.useMemo(() => {
    const map = new Map<SessionCategory, ChatSession[]>()
    for (const cat of CATEGORY_ORDER) {
      map.set(cat, [])
    }
    for (const session of filteredSessions) {
      const list = map.get(session.category) || []
      list.push(session)
      map.set(session.category, list)
    }
    return map
  }, [filteredSessions])

  const handleStartRename = (session: ChatSession) => {
    setEditingSessionId(session.id)
    setEditTitle(session.title)
  }

  const handleSaveRename = (id: string) => {
    if (editTitle.trim()) {
      onRenameSession(id, editTitle.trim())
    }
    setEditingSessionId(null)
    setEditTitle("")
  }

  const handleCancelRename = () => {
    setEditingSessionId(null)
    setEditTitle("")
  }

  return (
    <SidebarContent className="px-2 py-1 select-none">
      {isLoading && sessions.length === 0 ? (
        <SidebarGroup className="p-0 py-1.5">
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {Array.from({ length: 6 }).map((_, index) => (
                <SidebarMenuItem key={index}>
                  <SidebarMenuSkeleton showIcon />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ) : filteredSessions.length === 0 ? (
        searchQuery.trim().length > 0 ? (
          /* Case 1: Search returned no matching sessions */
          <div className="flex flex-col items-center justify-center gap-2.5 px-3 py-10 text-center animate-in fade-in-50 duration-200">
            <div className="flex size-8 items-center justify-center rounded-full bg-sidebar-accent/50 text-muted-foreground/70">
              <SearchXIcon className="size-4" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-sidebar-foreground">
                {t("search.empty.title")}
              </p>
              <p className="text-[11px] text-muted-foreground max-w-[180px] truncate font-sans">
                {t("search.empty.description", { query: searchQuery.trim() })}
              </p>
            </div>
            <Button
              variant="ghost"
              size="xs"
              onClick={onClearSearch}
              className="mt-1 h-7 text-xs text-primary hover:text-primary hover:bg-primary/10 rounded-full font-medium"
            >
              {t("search.clear")}
            </Button>
          </div>
        ) : (
          /* Case 2: Clean, minimal empty state when user has no chats yet */
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center animate-in fade-in-50 duration-200">
            <div className="flex size-8 items-center justify-center rounded-full bg-sidebar-accent/30 text-muted-foreground/40">
              <ClockIcon className="size-4" />
            </div>
            <p className="text-[11px] text-muted-foreground/70 leading-relaxed font-sans max-w-[170px]">
              {t("history.empty")}
            </p>
          </div>
        )
      ) : (
        CATEGORY_ORDER.map((category) => {
          const list = groupedSessions.get(category)
          if (!list || list.length === 0) return null

          return (
            <SidebarGroup key={category} className="p-0 py-1.5">
              <SidebarGroupLabel className="h-6 px-2 text-[11px] font-semibold text-muted-foreground/80">
                {t(`categories.${category}`)}
              </SidebarGroupLabel>

              <SidebarGroupContent>
                <SidebarMenu className="gap-0.5">
                  {list.map((session) => {
                    const SubjectIcon = getSubjectIcon(session.subject)
                    const isActive = activeSessionId === session.id
                    const isEditing = editingSessionId === session.id

                    return (
                      <SidebarMenuItem key={session.id} className="group/item">
                        {isEditing ? (
                          <div className="flex items-center gap-1 p-1">
                            <Input
                              autoFocus
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveRename(session.id)
                                if (e.key === "Escape") handleCancelRename()
                              }}
                              className="h-7 text-xs px-2 py-0"
                            />
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => handleSaveRename(session.id)}
                              aria-label={t("rename.save")}
                              className="size-6 text-primary hover:bg-primary/10"
                            >
                              <CheckIcon className="size-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={handleCancelRename}
                              aria-label={t("rename.cancel")}
                              className="size-6 text-muted-foreground hover:bg-sidebar-accent"
                            >
                              <XIcon className="size-3" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <SidebarMenuButton
                              isActive={isActive}
                              onClick={() => onSelectSession(session.id)}
                              tooltip={session.title}
                              className={cn(
                                "group/btn relative h-8.5 rounded-lg px-2.5 py-1.5 text-xs font-normal border border-transparent transition-all duration-150",
                                // Subtle hover styling: soft background highlight & crisp text
                                "hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground text-sidebar-foreground/80",
                                // Active session state
                                isActive &&
                                  "bg-sidebar-accent text-sidebar-accent-foreground font-medium border-sidebar-border/40 shadow-2xs"
                              )}
                            >
                              <SubjectIcon
                                className={cn(
                                  "size-3.5 shrink-0 transition-colors",
                                  isActive
                                    ? "text-primary"
                                    : "text-muted-foreground/80 group-hover/btn:text-sidebar-accent-foreground"
                                )}
                              />
                              <span className="truncate flex-1 text-start">
                                {session.title}
                              </span>
                              {session.timestamp ? (
                                <span className="ms-1 shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground/60 transition-opacity group-hover/btn:opacity-0">
                                  {session.timestamp}
                                </span>
                              ) : null}
                            </SidebarMenuButton>

                            {/* Hover Actions Menu */}
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <SidebarMenuAction
                                    showOnHover
                                    aria-label={t("options")}
                                    className="text-muted-foreground/60 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/80 transition-colors size-6"
                                  >
                                    <MoreHorizontalIcon className="size-3.5" />
                                  </SidebarMenuAction>
                                }
                              />
                              <DropdownMenuContent side="right" align="start" className="min-w-44 text-xs">
                                <DropdownMenuGroup>
                                  <DropdownMenuLabel>{t("menu.chat")}</DropdownMenuLabel>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleStartRename(session)
                                    }}
                                  >
                                    <PencilIcon className="size-3.5 me-2" />
                                    <span>{t("menu.rename")}</span>
                                  </DropdownMenuItem>
                                  {onDuplicateSession ? (
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        onDuplicateSession(session.id)
                                      }}
                                    >
                                      <CopyPlusIcon className="size-3.5 me-2" />
                                      <span>{t("menu.duplicate")}</span>
                                    </DropdownMenuItem>
                                  ) : null}
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleCopyLink(session.id)
                                    }}
                                  >
                                    <LinkIcon className="size-3.5 me-2" />
                                    <span>{t("menu.copyLink")}</span>
                                  </DropdownMenuItem>
                                </DropdownMenuGroup>

                                <DropdownMenuSeparator />
                                <DropdownMenuGroup>
                                  <DropdownMenuLabel>{t("menu.danger")}</DropdownMenuLabel>
                                  <DropdownMenuItem
                                    variant="destructive"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setPendingDelete(session)
                                    }}
                                  >
                                    <Trash2Icon className="size-3.5 me-2" />
                                    <span>{t("menu.delete")}</span>
                                  </DropdownMenuItem>
                                </DropdownMenuGroup>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </>
                        )}
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )
        })
      )}

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>{t("delete.description")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common:cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (pendingDelete) onDeleteSession(pendingDelete.id)
                setPendingDelete(null)
              }}
            >
              {t("common:delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarContent>
  )
}
