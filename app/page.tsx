import { SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs"
import { Sparkles, Brain, CheckCircle2, ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function Page() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Navigation Bar */}
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-none bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm tracking-wider">
              CI
            </div>
            <div className="flex flex-col">
              <span className="font-semibold tracking-tight text-sm sm:text-base">
                Chat-It
              </span>
              <span className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground">
                STEM AI Tutor
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Show when="signed-out">
              <SignInButton>
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </SignInButton>
              <SignUpButton>
                <Button size="sm">
                  Sign Up
                </Button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline-block text-xs font-mono text-muted-foreground">
                  Signed in
                </span>
                <UserButton />
              </div>
            </Show>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 sm:py-24 text-center">
        <div className="max-w-3xl flex flex-col items-center gap-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-mono border border-primary/30 bg-primary/5 text-primary">
            <Sparkles className="size-3.5" />
            <span>Clerk Authentication Configured</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-balance leading-tight">
            Master Math & STEM with <span className="text-primary">Socratic AI</span>
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground max-w-xl text-balance leading-relaxed">
            Personalized tutoring with interactive Generative UI widgets, step-by-step
            problem breakdowns, and adaptive memory tracking.
          </p>

          {/* Interactive Call-To-Action */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Show when="signed-out">
              <SignUpButton>
                <Button size="lg" className="gap-2">
                  Create Your Account
                  <ArrowRight className="size-4" />
                </Button>
              </SignUpButton>
              <SignInButton>
                <Button variant="outline" size="lg">
                  Sign In
                </Button>
              </SignInButton>
            </Show>
            <Show when="signed-in">
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-2 p-4 border border-border bg-card">
                  <CheckCircle2 className="size-5 text-primary" />
                  <span className="text-sm font-medium">
                    You are signed in! Welcome to Chat-It.
                  </span>
                  <div className="ml-2">
                    <UserButton />
                  </div>
                </div>
              </div>
            </Show>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mt-12 text-left">
            <div className="border border-border bg-card p-5">
              <div className="size-8 bg-muted flex items-center justify-center mb-3">
                <Brain className="size-4 text-primary" />
              </div>
              <h3 className="font-semibold text-sm mb-1">Dual Memory Engine</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Adaptive topic tracking and learner notes stored to personalize every session.
              </p>
            </div>

            <div className="border border-border bg-card p-5">
              <div className="size-8 bg-muted flex items-center justify-center mb-3">
                <Sparkles className="size-4 text-primary" />
              </div>
              <h3 className="font-semibold text-sm mb-1">Generative UI Widgets</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Quizzes, step-by-step math solver, flashcards, and instant visual validation.
              </p>
            </div>

            <div className="border border-border bg-card p-5">
              <div className="size-8 bg-muted flex items-center justify-center mb-3">
                <CheckCircle2 className="size-4 text-primary" />
              </div>
              <h3 className="font-semibold text-sm mb-1">Clerk Security</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Multi-tenant auth, profile management, and session cookies seamlessly handled.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground font-mono">
        Chat-It &copy; 2026 &mdash; Built with Next.js 16, VTRON theme & Clerk
      </footer>
    </div>
  )
}
