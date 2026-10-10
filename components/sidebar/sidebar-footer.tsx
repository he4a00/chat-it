"use client"

import * as React from "react"
import { Show, SignInButton, UserButton } from "@clerk/nextjs"
import {
  GlobeIcon,
  LogInIcon,
  MoonIcon,
  Settings2Icon,
  SunIcon,
} from "lucide-react"
import { useTheme } from "next-themes"

import { SidebarFooter } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/hooks/use-language"
import { UserPreferencesPage } from "./user-preferences-page"
import { useTranslation } from 'react-i18next'

export function AppSidebarFooter() {
  const { t, i18n } = useTranslation()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const { language, setLanguage } = useLanguage()

  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  const toggleTheme = () => {
    const current = resolvedTheme || theme
    setTheme(current === "dark" ? "light" : "dark")
  }

  const toggleLanguage = () => {
    i18n.changeLanguage(language === "ar" ? "en" : "ar"); setLanguage(language === "ar" ? "en" : "ar")
  }

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
                  t('wfullFlexFlexrowItemscenterJustifystartP15RoundedlgHoverbgsidebaraccent70HovertextsidebaraccentforegroundTransitionallDuration150Gap2OutlinenoneRingsidebarringFocusvisiblering2CursorpointerFontsans', 'w-full flex flex-row items-center justify-start p-1.5 rounded-lg hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground transition-all duration-150 gap-2 outline-none ring-sidebar-ring focus-visible:ring-2 cursor-pointer font-sans'),
                userButtonBox: t('order1Shrink0FlexItemscenterM0P0', 'order-1 shrink-0 flex items-center m-0 p-0'),
                userButtonAvatarBox: t('size8RoundedfullShadow2xsShrink0', 'size-8 rounded-full shadow-2xs shrink-0'),
                userButtonOuterIdentifier:
                  t('order2TextxsFontnormalFontsansTextsidebarforegroundTruncateTextleftFlex1M0P0', 'order-2 text-xs font-normal font-sans text-sidebar-foreground truncate text-left flex-1 m-0 p-0'),
              },
            }}
          >
            {/* Custom popover actions */}
            <UserButton.MenuItems>
              <UserButton.Action
                label="Preferences"
                labelIcon={<Settings2Icon className="size-4" />}
                open="preferences"
              />
              {mounted && (
                <UserButton.Action
                  label={
                    resolvedTheme === "dark"
                      ? t('switchToLightMode', 'Switch to Light Mode')
                      : t('switchToDarkMode', 'Switch to Dark Mode')
                  }
                  labelIcon={
                    resolvedTheme === "dark" ? (
                      <SunIcon className="size-4" />
                    ) : (
                      <MoonIcon className="size-4" />
                    )
                  }
                  onClick={toggleTheme}
                />
              )}
              <UserButton.Action
                label={
                  language === "ar"
                    ? t('languageEnglishLtr', 'Language: English (LTR)')
                    : t('rtl2', 'اللغة: العربية (RTL)')
                }
                labelIcon={<GlobeIcon className="size-4" />}
                onClick={toggleLanguage}
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
