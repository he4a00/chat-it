"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTRPC } from "@/trpc/react"
import type { LearnerOverview } from "@/types/learner"

/** Learner progress + memory, seeded from RSC so the panel never flashes empty. */
export function useLearnerOverview(initialOverview?: LearnerOverview) {
  const trpc = useTRPC()

  return useQuery({
    ...trpc.learner.getOverview.queryOptions(),
    ...(initialOverview ? { initialData: initialOverview } : {}),
  })
}

/** Refetch the learner overview — call when the progress panel is opened. */
export function useRefreshLearnerOverview() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const overviewKey = trpc.learner.getOverview.queryKey()

  return React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: overviewKey })
  }, [queryClient, overviewKey])
}

/** Create a targeted review session and reveal it in the sidebar. */
export function useStartReview() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const listKey = trpc.session.list.queryKey()

  return useMutation(
    trpc.learner.startReview.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: listKey })
      },
    }),
  )
}

/**
 * Widget submissions record practice attempts, which change mastery and streaks —
 * so the learner overview is refetched once an attempt lands.
 */
export function useSubmitWidgetState() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const overviewKey = trpc.learner.getOverview.queryKey()

  return useMutation(
    trpc.widget.submitState.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: overviewKey })
      },
    }),
  )
}
