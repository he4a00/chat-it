"use client"

import { toast } from "@/components/ui/toast"

/**
 * Thin wrapper over the Base UI toast manager so call-sites read cleanly.
 * Requires <Toaster /> to be mounted (see app/layout.tsx).
 */
export const notify = {
  success: (title: string, description?: string) =>
    toast.add({ title, description, type: "success" }),
  error: (title: string, description?: string) =>
    toast.add({ title, description, type: "error" }),
  info: (title: string, description?: string) =>
    toast.add({ title, description, type: "info" }),
}
