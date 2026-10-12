import { ClerkProvider } from "@clerk/nextjs"
import { shadcn } from "@clerk/ui/themes"
import type { Metadata } from "next"
import localFont from "next/font/local"
import "./globals.css"
import { I18nProvider } from "@/components/providers/i18n-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/toast"
import { TRPCReactProvider } from "@/trpc/react"
import { dirFor } from "@/lib/i18n/settings"
import { getLocale } from "@/lib/i18n/server"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: {
    default: "Shawky | AI Socratic STEM & Math Companion",
    template: "%s | Shawky",
  },
  description:
    "An intelligent, adaptive Socratic learning companion for mathematics and STEM subjects, featuring interactive Generative UI and personalized pedagogical guidance.",
  applicationName: "Shawky",
}

const ibmPlexSans = localFont({
  src: [
    {
      path: "./fonts/ibm-plex-sans-latin-wght-normal.woff2",
      style: "normal",
      weight: "300 700",
    },
    {
      path: "./fonts/ibm-plex-sans-latin-wght-italic.woff2",
      style: "italic",
      weight: "300 700",
    },
  ],
  variable: "--font-ibm-plex-sans",
  display: "swap",
})

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()

  return (
    <html
      lang={locale}
      dir={dirFor(locale)}
      suppressHydrationWarning
      className={cn("font-sans antialiased", ibmPlexSans.variable)}
    >
      <body>
        <I18nProvider locale={locale}>
          <ClerkProvider
            appearance={{
              theme: shadcn,
              variables: {
                fontFamily:
                  'var(--font-ibm-plex-sans), "IBM Plex Sans Arabic", "IBM Plex Sans", sans-serif',
              },
            }}
          >
            <TRPCReactProvider>
              <ThemeProvider>
                <TooltipProvider>
                  {children}
                  <Toaster />
                </TooltipProvider>
              </ThemeProvider>
            </TRPCReactProvider>
          </ClerkProvider>
        </I18nProvider>
      </body>
    </html>
  )
}
