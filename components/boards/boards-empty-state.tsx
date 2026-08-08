"use client"

import { useState } from "react"
import { Sparkles } from "lucide-react"

import { BoardCreateDialog } from "@/components/boards/board-create-dialog"
import { EmptyState } from "@/components/shared/empty-state"

export function BoardsEmptyState() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <EmptyState
        icon={Sparkles}
        title="No boards yet"
        description="Create your first board to start organizing tasks across columns."
        actionLabel="New board"
        onAction={() => setOpen(true)}
      />
      <BoardCreateDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
