"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Settings, Trash2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { deleteBoardAction, updateBoardAction } from "@/actions/board-actions"
import { boardSchema, type BoardValues } from "@/lib/zod-schemas"
import type { BoardDetailDTO, BoardRole } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { MembersDialog } from "@/components/boards/members-dialog"

export function BoardHeader({
  board,
  canEdit,
  currentUserId,
  myRole,
}: {
  board: BoardDetailDTO
  canEdit: boolean
  currentUserId: string
  myRole: BoardRole
}) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BoardValues>({
    resolver: zodResolver(boardSchema),
    defaultValues: { title: board.title, description: board.description ?? "" },
  })

  useEffect(() => {
    if (editOpen) {
      reset({ title: board.title, description: board.description ?? "" })
    }
  }, [editOpen, board.title, board.description, reset])

  async function onSubmit(values: BoardValues) {
    const result = await updateBoardAction(board.id, values)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("Board updated")
    setEditOpen(false)
  }

  async function handleDelete() {
    setDeleting(true)
    const result = await deleteBoardAction(board.id)
    setDeleting(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("Board deleted")
    router.push("/boards")
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h1 className="truncate font-heading text-xl font-bold">
            {board.title}
          </h1>
          {board.description && (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {board.description}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <div className="hidden -space-x-2 sm:flex">
            {board.members.slice(0, 4).map((member) => (
              <Avatar
                key={member.id}
                className="size-7 border-2 border-background"
              >
                <AvatarImage
                  src={member.user.image ?? undefined}
                  alt={member.user.name ?? ""}
                />
                <AvatarFallback className="text-[9px]">
                  {(member.user.name || member.user.email || "?")
                    .slice(0, 2)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ))}
            {board.members.length > 4 && (
              <div className="flex size-7 items-center justify-center rounded-full border-2 border-background bg-muted text-[9px] text-muted-foreground">
                +{board.members.length - 4}
              </div>
            )}
          </div>

          <MembersDialog
            boardId={board.id}
            members={board.members}
            currentUserId={currentUserId}
            myRole={myRole}
          />

          {canEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                <Settings className="size-4" />
                <span className="sr-only">Board settings</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditOpen(true)}>
                  <Pencil className="size-4" />
                  Edit details
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="size-4" />
                  Delete board
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit board</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-board-title">Title</Label>
              <Input id="edit-board-title" {...register("title")} />
              {errors.title && (
                <p className="text-sm text-destructive">
                  {errors.title.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-board-description">Description</Label>
              <Textarea
                id="edit-board-description"
                {...register("description")}
                className="min-h-20"
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this board?"
        description="All columns and tasks will be lost. This action cannot be undone."
        confirmLabel={deleting ? "Deleting…" : "Delete"}
        onConfirm={handleDelete}
      />
    </div>
  )
}
