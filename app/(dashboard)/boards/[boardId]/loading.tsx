import { KanbanBoardSkeleton } from "@/components/shared/loading-skeleton"
import { Skeleton } from "@/components/ui/skeleton"

export default function BoardLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-14 w-full max-w-md rounded-xl" />
      <KanbanBoardSkeleton />
    </div>
  )
}
