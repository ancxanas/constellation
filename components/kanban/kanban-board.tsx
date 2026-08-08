"use client"

import { useRef, useState } from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable"

import {
  addColumnAction,
  deleteColumnAction,
  renameColumnAction,
  reorderColumnsAction,
} from "@/actions/board-actions"
import { reorderTasksAction } from "@/actions/task-actions"
import { useBoard } from "@/hooks/use-tasks"
import { useBoardStore } from "@/stores/board-store"
import type { BoardDetailDTO, ColumnDTO, MemberDTO, TaskDTO } from "@/lib/types"
import {
  BoardFilters,
  type TaskFilters,
} from "@/components/kanban/board-filters"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { KanbanColumn } from "@/components/kanban/kanban-column"
import { KanbanTaskCard } from "@/components/kanban/kanban-task-card"

function findColumnForTask(columns: ColumnDTO[], taskId: string) {
  return columns.find((column) =>
    column.tasks.some((task) => task.id === taskId)
  )
}

function findTask(columns: ColumnDTO[], taskId: string) {
  for (const column of columns) {
    const task = column.tasks.find((t) => t.id === taskId)
    if (task) return task
  }
  return undefined
}

function taskMatches(task: TaskDTO, filters: TaskFilters) {
  if (filters.status && task.status !== filters.status) return false
  if (filters.priority && task.priority !== filters.priority) return false
  if (filters.assigneeId && task.assigneeId !== filters.assigneeId) return false
  const query = filters.query.trim().toLowerCase()
  if (query) {
    const inTitle = task.title.toLowerCase().includes(query)
    const inDescription = (task.description ?? "").toLowerCase().includes(query)
    if (!inTitle && !inDescription) return false
  }
  return true
}

export function KanbanBoard({
  boardId,
  board,
  canEdit,
  members,
}: {
  boardId: string
  board: BoardDetailDTO
  canEdit: boolean
  members: MemberDTO[]
}) {
  const queryClient = useQueryClient()
  const { data: liveBoard } = useBoard(boardId, board)
  const openNewTask = useBoardStore((state) => state.openNewTask)
  const openTask = useBoardStore((state) => state.openTask)

  const [filters, setFilters] = useState<TaskFilters>({
    status: null,
    priority: null,
    assigneeId: null,
    query: "",
  })
  const filtersActive = !!(
    filters.status ||
    filters.priority ||
    filters.assigneeId ||
    filters.query.trim()
  )

  const [dragColumns, setDragColumns] = useState<ColumnDTO[] | null>(null)
  const [activeTask, setActiveTask] = useState<TaskDTO | null>(null)
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null)
  const [renameTarget, setRenameTarget] = useState<ColumnDTO | null>(null)
  const [renameTitle, setRenameTitle] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<ColumnDTO | null>(null)
  const [addingColumn, setAddingColumn] = useState(false)
  const snapshotRef = useRef<ColumnDTO[]>([])

  const columns = dragColumns ?? liveBoard?.columns ?? board.columns
  const liveMembers = liveBoard?.members ?? members

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["boards", boardId] })
  }

  function applyColumnsToCache(cols: ColumnDTO[]) {
    queryClient.setQueryData<BoardDetailDTO>(["boards", boardId], (old) => {
      if (!old) return old
      return { ...old, columns: cols }
    })
  }

  function handleDragStart(event: DragStartEvent) {
    const id = String(event.active.id)
    const snapshot = columns.map((column) => ({
      ...column,
      tasks: [...column.tasks],
    }))
    snapshotRef.current = snapshot
    setDragColumns(snapshot)
    if (id.startsWith("task:")) {
      const taskId = id.replace("task:", "")
      setActiveTask(findTask(columns, taskId) ?? null)
    } else if (id.startsWith("column:")) {
      setActiveColumnId(id.replace("column:", ""))
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return
    const activeId = String(active.id)
    const overId = String(over.id)
    if (activeId === overId) return

    if (activeId.startsWith("column:")) {
      if (!overId.startsWith("column:")) return
      setDragColumns((cols) => {
        if (!cols) return cols
        const oldIndex = cols.findIndex(
          (c) => c.id === activeId.replace("column:", "")
        )
        const newIndex = cols.findIndex(
          (c) => c.id === overId.replace("column:", "")
        )
        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
          return cols
        }
        return arrayMove(cols, oldIndex, newIndex)
      })
      return
    }

    if (!activeId.startsWith("task:")) return
    const activeTaskId = activeId.replace("task:", "")

    if (overId.startsWith("column:")) {
      const targetColumnId = overId.replace("column:", "")
      setDragColumns((cols) => {
        if (!cols) return cols
        const source = findColumnForTask(cols, activeTaskId)
        if (!source || source.id === targetColumnId) return cols
        const task = source.tasks.find((t) => t.id === activeTaskId)
        if (!task) return cols
        return cols.map((column) => {
          if (column.id === source.id) {
            return {
              ...column,
              tasks: column.tasks.filter((t) => t.id !== activeTaskId),
            }
          }
          if (column.id === targetColumnId) {
            return { ...column, tasks: [...column.tasks, task] }
          }
          return column
        })
      })
      return
    }

    if (!overId.startsWith("task:")) return
    const overTaskId = overId.replace("task:", "")

    setDragColumns((cols) => {
      if (!cols) return cols
      const source = findColumnForTask(cols, activeTaskId)
      const target = findColumnForTask(cols, overTaskId)
      if (!source || !target) return cols
      const task = source.tasks.find((t) => t.id === activeTaskId)
      if (!task) return cols

      if (source.id === target.id) {
        const oldIndex = source.tasks.findIndex((t) => t.id === activeTaskId)
        const newIndex = source.tasks.findIndex((t) => t.id === overTaskId)
        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
          return cols
        }
        return cols.map((column) =>
          column.id === source.id
            ? { ...column, tasks: arrayMove(column.tasks, oldIndex, newIndex) }
            : column
        )
      }

      const overIndex = target.tasks.findIndex((t) => t.id === overTaskId)
      const newTasks = [...target.tasks]
      newTasks.splice(overIndex, 0, task)
      return cols.map((column) => {
        if (column.id === source.id) {
          return {
            ...column,
            tasks: column.tasks.filter((t) => t.id !== activeTaskId),
          }
        }
        if (column.id === target.id) {
          return { ...column, tasks: newTasks }
        }
        return column
      })
    })
  }

  async function handleDragEnd(event: DragEndEvent) {
    const activeId = String(event.active.id)

    if (activeId.startsWith("column:")) {
      const updates = columns.map((column, index) => ({
        columnId: column.id,
        order: index,
      }))
      const result = await reorderColumnsAction({ boardId, updates })
      if (result.error) toast.error(result.error)
      applyColumnsToCache(columns)
      invalidate()
    } else if (activeId.startsWith("task:")) {
      const previous = new Map<string, { columnId: string; order: number }>()
      snapshotRef.current.forEach((column) =>
        column.tasks.forEach((task, index) =>
          previous.set(task.id, { columnId: column.id, order: index })
        )
      )
      const updates: { taskId: string; columnId: string; order: number }[] = []
      columns.forEach((column) =>
        column.tasks.forEach((task, index) => {
          const before = previous.get(task.id)
          if (
            !before ||
            before.columnId !== column.id ||
            before.order !== index
          ) {
            updates.push({ taskId: task.id, columnId: column.id, order: index })
          }
        })
      )
      if (updates.length > 0) {
        const result = await reorderTasksAction({ boardId, updates })
        if (result.error) toast.error(result.error)
      }
      applyColumnsToCache(columns)
      invalidate()
    }

    setDragColumns(null)
    setActiveTask(null)
    setActiveColumnId(null)
  }

  async function handleAddColumn() {
    setAddingColumn(true)
    const result = await addColumnAction(boardId, "New column")
    setAddingColumn(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    invalidate()
  }

  async function confirmRename() {
    if (!renameTarget || !renameTitle.trim()) return
    const result = await renameColumnAction(renameTarget.id, renameTitle)
    if (result.error) {
      toast.error(result.error)
      return
    }
    setRenameTarget(null)
    invalidate()
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    const result = await deleteColumnAction(deleteTarget.id)
    if (result.error) {
      toast.error(result.error)
      return
    }
    setDeleteTarget(null)
    invalidate()
  }

  const visibleColumns = filtersActive
    ? columns.map((column) => ({
        ...column,
        tasks: column.tasks.filter((task) => taskMatches(task, filters)),
      }))
    : columns

  return (
    <div className="flex flex-col gap-4">
      <BoardFilters
        members={liveMembers}
        value={filters}
        onChange={setFilters}
      />
      <DndContext
        id="board-dnd-context"
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={() => {
          setDragColumns(null)
          setActiveTask(null)
          setActiveColumnId(null)
        }}
      >
        <SortableContext
          items={visibleColumns.map((column) => `column:${column.id}`)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex gap-3 overflow-x-auto pb-4">
            {visibleColumns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                canEdit={canEdit}
                disabled={filtersActive}
                onAddTask={(columnId) => openNewTask(columnId)}
                onOpenTask={(taskId) => openTask(taskId)}
                onRename={(columnId, title) => {
                  setRenameTarget(
                    columns.find((c) => c.id === columnId) ?? null
                  )
                  setRenameTitle(title)
                }}
                onDelete={(columnId) =>
                  setDeleteTarget(
                    columns.find((c) => c.id === columnId) ?? null
                  )
                }
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay dropAnimation={null}>
          {activeTask ? (
            <div className="shadow-[0_0_0_2px_hsl(var(--primary)/0.5)]">
              <KanbanTaskCard task={activeTask} onClick={() => {}} />
            </div>
          ) : activeColumnId ? (
            <div className="flex w-72 shrink-0 flex-col gap-3 rounded-xl border border-foreground/10 bg-card p-3 shadow-[0_0_0_2px_hsl(var(--primary)/0.5)]">
              <span className="text-sm font-semibold">
                {columns.find((c) => c.id === activeColumnId)?.title}
              </span>
              <span className="text-xs text-muted-foreground">
                {columns.find((c) => c.id === activeColumnId)?.tasks.length ??
                  0}{" "}
                tasks
              </span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {canEdit && (
        <Button
          variant="outline"
          size="sm"
          className="self-start"
          onClick={handleAddColumn}
          disabled={addingColumn}
        >
          <Plus className="size-4" />
          {addingColumn ? "Adding…" : "Add column"}
        </Button>
      )}

      <Dialog
        open={!!renameTarget}
        onOpenChange={(open) => {
          if (!open) setRenameTarget(null)
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename column</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rename-column">Name</Label>
            <Input
              id="rename-column"
              value={renameTitle}
              onChange={(e) => setRenameTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmRename()
              }}
            />
          </div>
          <DialogFooter>
            <Button onClick={confirmRename} disabled={!renameTitle.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title={`Delete "${deleteTarget?.title}"?`}
        description="Its tasks will also be deleted. This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
      />
    </div>
  )
}
