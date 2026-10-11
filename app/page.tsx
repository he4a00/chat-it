import { Metadata } from "next"
import { redirect } from "next/navigation"
import { ChatShell } from "@/components/chat/chat-shell"
import { getTRPCApi } from "@/trpc/server"
import { requireUser } from "@/lib/auth/require-user"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "New STEM Practice",
  description: "Shawky AI Socratic STEM & Math Companion",
}

export default async function MainPage() {
  await requireUser()

  const api = await getTRPCApi()
  const [sessions, overview] = await Promise.all([
    api.session.list(),
    api.learner.getOverview(),
  ])

  // First run: send them through the character-led onboarding.
  if (!overview.profile?.onboardingCompleted) {
    redirect("/welcome")
  }

  return <ChatShell initialSessions={sessions} />
}
