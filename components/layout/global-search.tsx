"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { useQuery } from "@tanstack/react-query"

import type { TaskDTO } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { TaskDueDate } from "@/components/tasks/task-due-date"
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge"

type SearchResult = {
  tasks: (TaskDTO & { board: { id: string; title: string } })[]
}

async function searchTasks(query: string): Promise<SearchResult["tasks"]> {
  const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
  if (!res.ok) return []
  const data = (await res.json()) as SearchResult
  return data.tasks
}

export function GlobalSearch() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setOpen((value) => !value)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 200)
    return () => clearTimeout(timer)
  }, [query])

  const { data: results } = useQuery({
    queryKey: ["search", debouncedQuery],
    queryFn: () => searchTasks(debouncedQuery),
    enabled: open && debouncedQuery.trim().length > 0,
    placeholderData: [],
  })

  function navigateToBoard(boardId: string) {
    setOpen(false)
    setQuery("")
    setDebouncedQuery("")
    router.push(`/boards/${boardId}`)
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="w-40 justify-start gap-2 text-muted-foreground sm:w-56"
        onClick={() => setOpen(true)}
      >
        <Search className="size-3.5" />
        <span className="flex-1 truncate text-left">Search tasks…</span>
        <kbd className="pointer-events-none hidden rounded-sm border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-block">
          ⌘K
        </kbd>
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search"
        description="Search for a task"
      >
        <CommandInput
          placeholder="Search tasks…"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {results?.length === 0 && debouncedQuery.trim() ? (
            <CommandEmpty>No tasks found.</CommandEmpty>
          ) : (
            <CommandGroup heading="Tasks">
              {results?.map((task) => (
                <CommandItem
                  key={task.id}
                  onSelect={() => navigateToBoard(task.boardId)}
                >
                  <span className="min-w-0 flex-1 truncate">
                    {task.title}
                    <span className="ml-1.5 text-muted-foreground">
                      in {task.board.title}
                    </span>
                  </span>
                  {task.dueDate && (
                    <TaskDueDate dueDate={new Date(task.dueDate)} />
                  )}
                  <TaskPriorityBadge priority={task.priority} />
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
