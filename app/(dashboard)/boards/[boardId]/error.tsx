"use client"

import { useEffect } from "react"

import { Button } from "@/components/ui/button"

export default function BoardError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <div className="space-y-2">
        <h1 className="text-lg font-bold">Could not load this board</h1>
        <p className="text-sm text-muted-foreground">
          {error.digest
            ? `Error code: ${error.digest}`
            : "Something went wrong while loading this board."}
        </p>
      </div>
      <Button onClick={() => unstable_retry()}>Try again</Button>
    </div>
  )
}
