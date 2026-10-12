"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTRPC } from "@/trpc/react"
import type { ChatSession } from "@/types/session"
import { notify } from "@/lib/toast"

/**
 * Session query + mutations.
 *
 * Mutations update the cache optimistically and roll back on error, rather than
 * invalidating (refetching) after every write — that's what caused the sidebar to
 * briefly flicker back to a just-deleted chat.
 */

function upsertSession(list: ChatSession[] | undefined, session: ChatSession): ChatSession[] {
  const current = list ?? []
  const index = current.findIndex((item) => item.id === session.id)
  if (index === -1) return [session, ...current]
  const next = current.slice()
  next[index] = { ...current[index], ...session }
  return next
}

/** The session list, seeded from RSC so there's no loading flash on first paint. */
export function useSessions(initialSessions: ChatSession[] = []) {
  const trpc = useTRPC()
  const query = useQuery({
    ...trpc.session.list.queryOptions(),
    initialData: initialSessions,
  })

  return { ...query, sessions: query.data ?? initialSessions }
}

export function useCreateSession() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const listKey = trpc.session.list.queryKey()

  return useMutation(
    trpc.session.create.mutationOptions({
      onSuccess: (session) => {
        // Idempotent on the client-supplied id, so merge instead of duplicate.
        queryClient.setQueryData<ChatSession[]>(listKey, (prev) => upsertSession(prev, session))
      },
      onError: (error) => {
        console.error("Failed to create session:", error)
      },
    }),
  )
}

export function useRenameSession() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const listKey = trpc.session.list.queryKey()

  return useMutation(
    trpc.session.rename.mutationOptions({
      onMutate: async ({ chatId, title }) => {
        await queryClient.cancelQueries({ queryKey: listKey })
        const previous = queryClient.getQueryData<ChatSession[]>(listKey)

        queryClient.setQueryData<ChatSession[]>(listKey, (prev) =>
          (prev ?? []).map((session) =>
            session.id === chatId ? { ...session, title: title.trim() } : session,
          ),
        )

        return { previous }
      },
      onError: (error, _variables, context) => {
        if (context?.previous !== undefined) {
          queryClient.setQueryData(listKey, context.previous)
        }
        console.error("Failed to rename session:", error)
      },
    }),
  )
}

export function useDeleteSession() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const listKey = trpc.session.list.queryKey()

  return useMutation(
    trpc.session.delete.mutationOptions({
      onMutate: async ({ chatId }) => {
        await queryClient.cancelQueries({ queryKey: listKey })
        const previous = queryClient.getQueryData<ChatSession[]>(listKey)

        queryClient.setQueryData<ChatSession[]>(listKey, (prev) =>
          (prev ?? []).filter((session) => session.id !== chatId),
        )

        return { previous }
      },
      onSuccess: (_data, { chatId }) => {
        // Drop anything cached for the removed chat.
        queryClient.removeQueries({ queryKey: trpc.session.getMessages.queryKey({ chatId }) })
      },
      onError: (error, _variables, context) => {
        if (context?.previous !== undefined) {
          queryClient.setQueryData(listKey, context.previous)
        }
        notify.error(
          "Couldn't delete the chat",
          "It's back in your list — please try again.",
        )
        console.error("Failed to delete session:", error)
      },
    }),
  )
}

export function useDuplicateSession() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const listKey = trpc.session.list.queryKey()

  return useMutation(
    trpc.session.duplicate.mutationOptions({
      onSuccess: (copy) => {
        queryClient.setQueryData<ChatSession[]>(listKey, (prev) => upsertSession(prev, copy))
      },
      onError: (error) => {
        console.error("Failed to duplicate session:", error)
      },
    }),
  )
}
