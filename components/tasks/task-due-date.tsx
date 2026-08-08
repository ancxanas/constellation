import { CalendarDays } from "lucide-react"
import { format, isBefore, isToday } from "date-fns"

import { cn } from "@/lib/utils"

export function TaskDueDate({ dueDate }: { dueDate: Date | null }) {
  if (!dueDate) return null

  const overdue = !isToday(dueDate) && isBefore(dueDate, new Date())
  const today = isToday(dueDate)

  return (
    <span
      className={cn(
        "flex items-center gap-1 text-[11px]",
        overdue ? "text-destructive" : today ? "text-amber-400" : "text-muted-foreground"
      )}
    >
      <CalendarDays className="size-3" />
      {today ? "Today" : format(dueDate, "MMM d")}
    </span>
  )
}
