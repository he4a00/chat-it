"use client"

import * as React from "react"
import {
  AtomIcon,
  CalculatorIcon,
  CheckIcon,
  ClockIcon,
  FlaskConicalIcon,
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
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChatSession, SessionCategory } from "@/types/session"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/hooks/use-language"

interface SessionListProps {
  sessions: ChatSession[]
  activeSessionId: string | null
  searchQuery: string
  onSelectSession: (id: string) => void
  onDeleteSession: (id: string) => void
  onRenameSession: (id: string, newTitle: string) => void
  onClearSearch: () => void
}

const CATEGORY_ORDER: SessionCategory[] = [
  "today",
  "yesterday",
  "previous_7_days",
  "older",
]

const CATEGORY_LABELS: Record<SessionCategory, string> = {
  today: "Today",
  yesterday: "Yesterday",
  previous_7_days: "Previous 7 Days",
  older: "Older",
}

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
  onSelectSession,
  onDeleteSession,
  onRenameSession,
  onClearSearch,
}: SessionListProps) {
  const { language } = useLanguage()
  const isAr = language === "ar"
  const [editingSessionId, setEditingSessionId] = React.useState<string | null>(null)
  const [editTitle, setEditTitle] = React.useState("")

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
      {filteredSessions.length === 0 ? (
        searchQuery.trim().length > 0 ? (
          /* Case 1: Search returned no matching sessions */
          <div className="flex flex-col items-center justify-center gap-2.5 px-3 py-10 text-center animate-in fade-in-50 duration-200">
            <div className="flex size-8 items-center justify-center rounded-full bg-sidebar-accent/50 text-muted-foreground/70">
              <SearchXIcon className="size-4" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-sidebar-foreground">
                {isAr ? "لا توجد نتائج" : "No chats found"}
              </p>
              <p className="text-[11px] text-muted-foreground max-w-[180px] truncate font-sans">
                {isAr
                  ? `لا توجد محادثات تطابق "${searchQuery.trim()}"`
                  : `No chats matching "${searchQuery.trim()}"`}
              </p>
            </div>
            <Button
              variant="ghost"
              size="xs"
              onClick={onClearSearch}
              className="mt-1 h-7 text-xs text-primary hover:text-primary hover:bg-primary/10 rounded-full font-medium"
            >
              {isAr ? "مسح البحث" : "Clear search"}
            </Button>
          </div>
        ) : (
          /* Case 2: Clean, minimal empty state when user has no chats yet */
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center animate-in fade-in-50 duration-200">
            <div className="flex size-8 items-center justify-center rounded-full bg-sidebar-accent/30 text-muted-foreground/40">
              <ClockIcon className="size-4" />
            </div>
            <p className="text-[11px] text-muted-foreground/70 leading-relaxed font-sans max-w-[170px]">
              {isAr
                ? "ستظهر محادثاتك السابقة مع شوقي هنا"
                : "Your chat history with Shawky will appear here"}
            </p>
          </div>
        )
      ) : (
        CATEGORY_ORDER.map((category) => {
          const list = groupedSessions.get(category)
          if (!list || list.length === 0) return null

          return (
            <SidebarGroup key={category} className="p-0 py-1.5">
              <SidebarGroupLabel className="h-6 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                {CATEGORY_LABELS[category]}
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
                              aria-label={isAr ? "حفظ العنوان" : "Save title"}
                              className="size-6 text-primary hover:bg-primary/10"
                            >
                              <CheckIcon className="size-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={handleCancelRename}
                              aria-label={isAr ? "إلغاء التعديل" : "Cancel rename"}
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
                              <span className="truncate flex-1 text-left">
                                {session.title}
                              </span>
                            </SidebarMenuButton>

                            {/* Hover Actions Menu */}
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <SidebarMenuAction
                                    showOnHover
                                    aria-label={isAr ? "خيارات المحادثة" : "Session options"}
                                    className="text-muted-foreground/60 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/80 transition-colors size-6"
                                  >
                                    <MoreHorizontalIcon className="size-3.5" />
                                  </SidebarMenuAction>
                                }
                              />
                              <DropdownMenuContent side="right" align="start" className="min-w-36 text-xs">
                                <DropdownMenuGroup>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleStartRename(session)
                                    }}
                                  >
                                    <PencilIcon className="size-3.5 mr-2" />
                                    <span>{isAr ? "إعادة تسمية" : "Rename"}</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    variant="destructive"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      onDeleteSession(session.id)
                                    }}
                                  >
                                    <Trash2Icon className="size-3.5 mr-2" />
                                    <span>{isAr ? "حذف" : "Delete"}</span>
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
    </SidebarContent>
  )
}
