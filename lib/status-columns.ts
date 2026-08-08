import type { TaskStatus } from "@prisma/client"

const STATUS_BY_TITLE: Record<string, TaskStatus> = {
  "backlog": "BACKLOG",
  "to do": "TODO",
  "in progress": "IN_PROGRESS",
  "done": "DONE",
}

export function statusFromColumnTitle(title: string): TaskStatus | null {
  return STATUS_BY_TITLE[title.trim().toLowerCase()] ?? null
}
