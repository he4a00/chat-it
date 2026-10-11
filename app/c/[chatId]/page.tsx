import { Metadata } from "next"
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

  const [sessions, messages] = await Promise.all([
    api.session.list(),
    api.session.getMessages({ chatId }),
  ])

  return (
    <ChatShell
      initialSessions={sessions}
      initialSessionId={chatId}
      initialMessages={messages}
    />
  )
}
