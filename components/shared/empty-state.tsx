import type { LucideIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <Card className="flex flex-col items-center justify-center border-dashed bg-transparent p-12 text-center">
      <div className="mb-4 rounded-full bg-primary/10 p-4">
        <Icon className="size-8 text-primary/60" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mb-4 mt-1 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>
      {actionLabel && <Button onClick={onAction}>{actionLabel}</Button>}
    </Card>
  )
}
