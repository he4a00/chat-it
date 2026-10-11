"use client"

import { Show, SignInButton, UserButton } from "@clerk/nextjs"
import { LogInIcon, Settings2Icon } from "lucide-react"

import { SidebarFooter } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { UserPreferencesPage } from "./user-preferences-page"
import { useTranslation } from "react-i18next"

export function AppSidebarFooter() {
  const { t } = useTranslation()

  return (
    <SidebarFooter className="border-t border-sidebar-border/70 p-2.5">
      {/* Signed In: UserAccount Button with Modal Trigger for Preferences */}
      <Show when="signed-in">
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
