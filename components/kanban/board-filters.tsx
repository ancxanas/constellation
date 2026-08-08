"use client"

import { FilterX, Search } from "lucide-react"

import type { MemberDTO, TaskPriority, TaskStatus } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type TaskFilters = {
  status: TaskStatus | null
  priority: TaskPriority | null
  assigneeId: string | null
  query: string
}

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: "BACKLOG", label: "Backlog" },
  { value: "TODO", label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "DONE", label: "Done" },
]

const priorityOptions: { value: TaskPriority; label: string }[] = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
]

export function BoardFilters({
  members,
  value,
  onChange,
}: {
  members: MemberDTO[]
  value: TaskFilters
  onChange: (filters: TaskFilters) => void
}) {
  const active =
    !!value.status ||
    !!value.priority ||
    !!value.assigneeId ||
    value.query.trim().length > 0

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <Search className="absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value.query}
          onChange={(e) => onChange({ ...value, query: e.target.value })}
          placeholder="Filter tasks…"
          className="h-7 w-40 pl-7"
        />
      </div>

      <Select
        value={value.status ?? "all"}
        onValueChange={(v) =>
          onChange({ ...value, status: v === "all" ? null : (v as TaskStatus) })
        }
      >
        <SelectTrigger className="h-7 w-32">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {statusOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value.priority ?? "all"}
        onValueChange={(v) =>
          onChange({
            ...value,
            priority: v === "all" ? null : (v as TaskPriority),
          })
        }
      >
        <SelectTrigger className="h-7 w-32">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All priorities</SelectItem>
          {priorityOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value.assigneeId ?? "all"}
        onValueChange={(v) =>
          onChange({ ...value, assigneeId: v === "all" ? null : v })
        }
      >
        <SelectTrigger className="h-7 w-32">
          <SelectValue placeholder="Assignee" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Everyone</SelectItem>
          {members.map((member) => (
            <SelectItem key={member.id} value={member.user.id}>
              {member.user.name || member.user.email}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {active && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-muted-foreground"
          onClick={() =>
            onChange({
              status: null,
              priority: null,
              assigneeId: null,
              query: "",
            })
          }
        >
          <FilterX className="size-3.5" />
          Clear
        </Button>
      )}
    </div>
  )
}
