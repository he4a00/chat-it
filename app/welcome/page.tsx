import { redirect } from "next/navigation"
import { OnboardingExperience } from "@/components/learner/onboarding-experience"
import { getTRPCApi } from "@/trpc/server"
import { requireUser } from "@/lib/auth/require-user"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Welcome",
  description: "Set up your Shawky learning profile",
}

export default async function WelcomePage() {
  await requireUser()

  const api = await getTRPCApi()
  const overview = await api.learner.getOverview()

  // Already onboarded? There's nothing to welcome them into.
  if (overview.profile?.onboardingCompleted) {
    redirect("/")
  }

  return <OnboardingExperience />
}
