"use client"

import { useState } from "react"
import { format } from "date-fns"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"

import { addCommentAction, deleteCommentAction } from "@/actions/task-actions"
import { useComments } from "@/hooks/use-tasks"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"

export function TaskComments({
  taskId,
  boardId,
  currentUserId,
}: {
  taskId: string
  boardId: string
  currentUserId: string
}) {
  const { data: comments } = useComments(taskId)
  const queryClient = useQueryClient()
  const [content, setContent] = useState("")
  const [submitting, setSubmitting] = useState(false)

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["comments", taskId] })
    queryClient.invalidateQueries({ queryKey: ["boards", boardId] })
  }

  async function submit() {
    if (!content.trim()) return
    setSubmitting(true)
    const result = await addCommentAction(taskId, content)
    setSubmitting(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    setContent("")
    invalidate()
  }

  async function remove(commentId: string) {
    const result = await deleteCommentAction(commentId)
    if (result.error) {
      toast.error(result.error)
      return
    }
    invalidate()
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold">Comments</h4>
      <ScrollArea className="max-h-64 pr-2">
        <div className="space-y-3">
          {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No comments yet.</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-2">
                <Avatar className="size-6">
                  <AvatarImage
                    src={comment.author.image ?? undefined}
                    alt={comment.author.name ?? ""}
                  />
                  <AvatarFallback className="text-[8px]">
                    {(comment.author.name || comment.author.email || "?")
                      .slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 rounded-md bg-muted/60 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium">
                      {comment.author.name || comment.author.email}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(comment.createdAt), "MMM d, HH:mm")}
                      </span>
                      {currentUserId === comment.author.id && (
                        <button
                          type="button"
                          className="text-[10px] text-destructive hover:underline"
                          onClick={() => remove(comment.id)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="mt-0.5 text-xs">{comment.content}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
      <div className="space-y-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a comment…"
          className="min-h-16"
        />
        <Button
          size="sm"
          onClick={submit}
          disabled={submitting || !content.trim()}
        >
          Comment
        </Button>
      </div>
    </div>
  )
}
