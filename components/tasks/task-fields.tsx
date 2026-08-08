"use client"

import { useState } from "react"
import { CalendarDays, Plus, X } from "lucide-react"
import { format } from "date-fns"

import type { MemberDTO, TagDTO, TaskPriority, TaskStatus } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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

export function StatusSelect({
  value,
  onChange,
}: {
  value: TaskStatus
  onChange: (value: TaskStatus) => void
}) {
  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v as TaskStatus)}
    >
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {statusOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function PrioritySelect({
  value,
  onChange,
}: {
  value: TaskPriority
  onChange: (value: TaskPriority) => void
}) {
  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v as TaskPriority)}
    >
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {priorityOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function AssigneeSelect({
  value,
  members,
  onChange,
}: {
  value: string | null
  members: MemberDTO[]
  onChange: (value: string | null) => void
}) {
  return (
    <Select value={value ?? ""} onValueChange={(v) => onChange(v || null)}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Unassigned" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">Unassigned</SelectItem>
        {members.map((member) => (
          <SelectItem key={member.id} value={member.user.id}>
            {member.user.name || member.user.email}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function DueDatePicker({
  value,
  onChange,
}: {
  value: string | null
  onChange: (value: string | null) => void
}) {
  const date = value ? new Date(value) : null

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="outline" className="w-full justify-start" />
        }
      >
        <CalendarDays className="size-4" />
        {date ? format(date, "MMM d, yyyy") : "No due date"}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date ?? undefined}
          onSelect={(day) => onChange(day ? day.toISOString() : null)}
        />
        <div className="border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground"
            onClick={() => onChange(null)}
          >
            <X className="size-3.5" />
            Clear due date
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function TagsEditor({
  tags,
  onAdd,
  onRemove,
}: {
  tags: TagDTO[]
  onAdd: (name: string, color: string) => void
  onRemove: (tagId: string) => void
}) {
  const palette = [
    "#3b82f6",
    "#8b5cf6",
    "#ec4899",
    "#ef4444",
    "#f59e0b",
    "#10b981",
    "#14b8a6",
  ]

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag.id}
            className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{
              backgroundColor: `${tag.color}26`,
              color: tag.color,
            }}
          >
            {tag.name}
            <button
              type="button"
              aria-label={`Remove ${tag.name}`}
              className="opacity-70 hover:opacity-100"
              onClick={() => onRemove(tag.id)}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
      </div>
      <TagAddForm palette={palette} onAdd={onAdd} />
    </div>
  )
}

function TagAddForm({
  palette,
  onAdd,
}: {
  palette: string[]
  onAdd: (name: string, color: string) => void
}) {
  const [name, setName] = useState("")
  const [color, setColor] = useState(palette[0])

  function submit() {
    if (!name.trim()) return
    onAdd(name.trim(), color)
    setName("")
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              submit()
            }
          }}
          placeholder="Add a tag"
          className="h-7"
        />
        <Button type="button" size="sm" variant="outline" onClick={submit}>
          <Plus className="size-3.5" />
          Add
        </Button>
      </div>
      <div className="flex gap-1.5">
        {palette.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={`Use color ${c}`}
            className="size-5 rounded-full border border-foreground/10 transition-transform hover:scale-110"
            style={{
              backgroundColor: c,
              boxShadow: color === c ? `0 0 0 2px hsl(var(--background)), 0 0 0 3px ${c}` : undefined,
            }}
            onClick={() => setColor(c)}
          />
        ))}
      </div>
    </div>
  )
}
