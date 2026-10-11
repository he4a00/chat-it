import { Metadata } from "next"
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
  const sessions = await api.session.list()

  return <ChatShell initialSessions={sessions} />
}
