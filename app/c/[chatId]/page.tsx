import { Metadata } from "next"
import { redirect } from "next/navigation"
import { ChatShell } from "@/components/chat/chat-shell"
import { getTRPCApi } from "@/trpc/server"
import { requireUser } from "@/lib/auth/require-user"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Chat",
  description: "Shawky AI Socratic STEM & Math Companion",
}

export default async function ChatPage(props: { params: Promise<{ chatId: string }> }) {
  await requireUser()

  const { chatId } = await props.params
  const api = await getTRPCApi()

  const [sessions, messages, overview] = await Promise.all([
    api.session.list(),
    api.session.getMessages({ chatId }),
    api.learner.getOverview(),
  ])

  if (!overview.profile?.onboardingCompleted) {
    redirect("/welcome")
  }

  return (
    <ChatShell
      initialSessions={sessions}
      initialSessionId={chatId}
      initialMessages={messages}
    />
  )
}
