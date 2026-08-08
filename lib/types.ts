import type { BoardRole, TaskPriority, TaskStatus } from "@prisma/client"

export type { BoardRole, TaskPriority, TaskStatus }

export type UserDTO = {
  id: string
  name: string | null
  email: string | null
  image: string | null
}

export type TagDTO = {
  id: string
  name: string
  color: string
}

export type TaskDTO = {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  dueDate: string | null
  order: number
  columnId: string
  boardId: string
  assigneeId: string | null
  assignee: UserDTO | null
  tags: TagDTO[]
  commentsCount: number
}

export type ColumnDTO = {
  id: string
  title: string
  order: number
  boardId: string
  tasks: TaskDTO[]
}

export type MemberDTO = {
  id: string
  role: BoardRole
  user: UserDTO
}

export type CommentDTO = {
  id: string
  content: string
  author: UserDTO
  createdAt: string
  updatedAt: string
}

export type BoardSummaryDTO = {
  id: string
  title: string
  description: string | null
  tasksCount: number
  membersCount: number
  owner: UserDTO
}

export type BoardDetailDTO = {
  id: string
  title: string
  description: string | null
  ownerId: string
  owner: UserDTO
  members: MemberDTO[]
  columns: ColumnDTO[]
}

export type ActionResponse = {
  error?: string
  id?: string
}
