import * as React from "react"

export function LearnModeIcon({ className = "size-10" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/images/icon-learn.svg"
      alt=""
      aria-hidden="true"
      className={className}
      width={40}
      height={40}
    />
  )
}

export function FlashcardsModeIcon({ className = "size-10" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/images/icon-flashcards.svg"
      alt=""
      aria-hidden="true"
      className={className}
      width={40}
      height={40}
    />
  )
}

export function QuizModeIcon({ className = "size-10" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/images/icon-quiz.svg"
      alt=""
      aria-hidden="true"
      className={className}
      width={40}
      height={40}
    />
  )
}
