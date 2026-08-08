"use client"

import Link from "next/link"
import { useState } from "react"
import { ArrowUpRight, Columns3, Plus, Sparkles } from "lucide-react"

import type { BoardSummaryDTO } from "@/lib/types"
import { useBoards } from "@/hooks/use-tasks"
import { BoardCreateDialog } from "@/components/boards/board-create-dialog"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function BoardList({ initialBoards }: { initialBoards: BoardSummaryDTO[] }) {
  const { data: boards } = useBoards(initialBoards)
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Boards</h1>
          <p className="text-sm text-muted-foreground">
            Your project orbits, all in one place.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          New board
        </Button>
      </div>

      {boards.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No boards yet"
          description="Create your first board to start organizing tasks across columns."
          actionLabel="New board"
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {boards.map((board) => (
            <Link key={board.id} href={`/boards/${board.id}`}>
              <Card className="glass group relative h-full overflow-hidden transition-colors hover:border-primary/50">
                <CardHeader>
                  <CardTitle className="line-clamp-1 text-base">
                    {board.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="line-clamp-2 min-h-8 text-xs text-muted-foreground">
                    {board.description || "No description"}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{board.tasksCount} tasks</span>
                    <span>{board.membersCount} members</span>
                  </div>
                  <ArrowUpRight className="absolute top-3 right-3 size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </CardContent>
              </Card>
            </Link>
          ))}
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="flex min-h-28 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
          >
            <Columns3 className="size-5" />
            New board
          </button>
        </div>
      )}

      <BoardCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
