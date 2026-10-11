"use client"

import { Show, SignInButton, UserButton } from "@clerk/nextjs"
import { Flame, LogInIcon, Settings2Icon } from "lucide-react"
import { useQuery } from "@tanstack/react-query"

import { SidebarFooter } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { UserPreferencesPage } from "./user-preferences-page"
import { useTRPC } from "@/trpc/react"
import { useLanguage } from "@/hooks/use-language"
import { useTranslation } from "react-i18next"

interface AppSidebarFooterProps {
  onOpenProgress?: () => void
}

export function AppSidebarFooter({ onOpenProgress }: AppSidebarFooterProps) {
  const { t } = useTranslation()
  const trpc = useTRPC()
  const { language } = useLanguage()
  const isAr = language === "ar"

  // Shares the cache entry seeded by ChatShell — no extra request.
  const { data: overview } = useQuery(trpc.learner.getOverview.queryOptions())
  const streak = overview?.streak.current ?? 0
  const accuracy = Math.round((overview?.stats.accuracy ?? 0) * 100)

  return (
    <SidebarFooter className="border-t border-sidebar-border/70 p-2.5">
      {/* Signed In: Progress card + UserAccount Button */}
      <Show when="signed-in">
        {onOpenProgress ? (
          <button
            type="button"
            onClick={onOpenProgress}
            className="mb-2 flex w-full items-center justify-between gap-2 rounded-lg border border-sidebar-border/70 bg-sidebar-accent/40 p-2 text-start transition-colors hover:bg-sidebar-accent/70"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Flame className="size-3.5" />
              </span>
              <span className="flex min-w-0 flex-col leading-tight">
                <span className="truncate text-[11px] font-semibold text-sidebar-foreground">
                  {isAr ? "تقدّمك" : "Your progress"}
                </span>
                <span className="truncate text-[10px] text-muted-foreground">
                  {isAr ? `${streak} يوم متتالي` : `${streak}-day streak`}
                </span>
              </span>
            </span>
            <span className="shrink-0 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-primary-foreground">
              {accuracy}%
            </span>
          </button>
        ) : null}

        <div className="flex w-full items-center">
          <UserButton
            showName
            appearance={{
              elements: {
                rootBox: "w-full",
                userButtonTrigger:
                  "w-full flex flex-row items-center justify-start p-1.5 rounded-lg hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground transition-all duration-150 gap-2 outline-none ring-sidebar-ring focus-visible:ring-2 cursor-pointer font-sans",
                userButtonBox: "order-1 shrink-0 flex items-center m-0 p-0",
                userButtonAvatarBox: "size-8 rounded-full shadow-2xs shrink-0",
                userButtonOuterIdentifier:
                  "order-2 text-xs font-normal font-sans text-sidebar-foreground truncate text-left flex-1 m-0 p-0",
              },
            }}
          >
            {/* Popover actions (theme + language now live in the chat header) */}
            <UserButton.MenuItems>
              <UserButton.Action
                label="Preferences"
                labelIcon={<Settings2Icon className="size-4" />}
                open="preferences"
              />
            </UserButton.MenuItems>

            {/* Custom Preferences Page inside Clerk UserProfile Modal */}
            <UserButton.UserProfilePage
              label="Preferences"
              labelIcon={<Settings2Icon className="size-4" />}
              url="preferences"
            >
              <UserPreferencesPage />
            </UserButton.UserProfilePage>
          </UserButton>
        </div>
      </Show>

      {/* Signed Out: Rounded Sign In Button */}
      <Show when="signed-out">
        <SignInButton mode="modal">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-center h-9 px-3.5 rounded-full border-sidebar-border bg-sidebar hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-xs font-medium text-sidebar-foreground transition-colors shadow-2xs"
          >
            <LogInIcon className="size-3.5 mr-2 text-primary" />
            <span>{t('signIn', 'Sign In')}</span>
          </Button>
        </SignInButton>
      </Show>
    </SidebarFooter>
  )
}
