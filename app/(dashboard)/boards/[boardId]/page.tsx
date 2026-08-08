import { notFound } from "next/navigation"

import { requireUser } from "@/lib/session"
import { getBoardDetail } from "@/lib/queries"
import { getBoardRole } from "@/lib/permissions"
import { BoardHeader } from "@/components/boards/board-header"
import { KanbanBoard } from "@/components/kanban/kanban-board"
import { NewTaskDialog } from "@/components/tasks/new-task-dialog"
import { TaskDetailDialog } from "@/components/tasks/task-detail-dialog"

export default async function BoardPage({
  params,
}: {
  params: Promise<{ boardId: string }>
}) {
  const { boardId } = await params
  const user = await requireUser()
  const board = await getBoardDetail(user.id, boardId)

  if (!board) notFound()

  const myRole = await getBoardRole(user.id, board.id)
  const canEdit = myRole === "OWNER" || myRole === "ADMIN"

  return (
    <div className="space-y-4">
      <BoardHeader
        board={board}
        canEdit={canEdit}
        currentUserId={user.id}
        myRole={myRole ?? "MEMBER"}
      />
      <KanbanBoard
        boardId={board.id}
        board={board}
        canEdit={canEdit}
        members={board.members}
      />
      <NewTaskDialog boardId={board.id} members={board.members} />
      <TaskDetailDialog
        boardId={board.id}
        board={board}
        members={board.members}
        currentUserId={user.id}
        canEdit={canEdit}
      />
    </div>
  )
}
