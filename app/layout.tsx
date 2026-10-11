import { ClerkProvider } from "@clerk/nextjs"
import { shadcn } from "@clerk/ui/themes"
import type { Metadata } from "next"
import localFont from "next/font/local"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/toast"
import { TRPCReactProvider } from "@/trpc/react"
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
    },
    {
      path: "./fonts/ibm-plex-sans-latin-wght-italic.woff2",
      style: "italic",
    },
  ],
  variable: "--font-ibm-plex-sans",
  display: "swap",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("font-sans antialiased", ibmPlexSans.variable)}
    >
      <body>
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
      </body>
    </html>
  )
}
