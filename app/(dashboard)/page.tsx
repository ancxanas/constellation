import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import type { TaskPriority } from "@prisma/client"
import { endOfDay, format } from "date-fns"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getUserBoards } from "@/lib/queries"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BoardsEmptyState } from "@/components/boards/boards-empty-state"
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge"
import { TaskDueDate } from "@/components/tasks/task-due-date"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const userId = session.user.id

  const cutoff = endOfDay(new Date())
  const [boards, tasks] = await Promise.all([
    getUserBoards(userId, 4),
    prisma.task.findMany({
      where: {
        assigneeId: userId,
        status: { not: "DONE" },
        dueDate: { not: null },
      },
      include: { board: { select: { id: true, title: true } } },
      orderBy: { dueDate: "asc" },
      take: 12,
    }),
  ])
  const todayTasks = tasks.filter(
    (task) => task.dueDate && task.dueDate <= cutoff
  )
  const upcoming = tasks.filter((task) => task.dueDate && task.dueDate > cutoff)

  const firstName = session.user.name?.split(" ")[0] || "there"
  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {greeting}, {firstName}
        </h1>
        <p className="text-sm text-muted-foreground">
          {format(new Date(), "EEEE, MMMM d")} — here&apos;s your orbit.
        </p>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your boards</h2>
          <Button
            render={<Link href="/boards" />}
            nativeButton={false}
            variant="ghost"
            size="sm"
          >
            View all <ArrowRight className="size-3.5" />
          </Button>
        </div>

        {boards.length === 0 ? (
          <BoardsEmptyState />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {boards.map((board) => (
              <Link key={board.id} href={`/boards/${board.id}`}>
                <Card className="h-full glass transition-colors hover:border-primary/50">
                  <CardHeader>
                    <CardTitle className="line-clamp-1 text-base">
                      {board.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{board.tasksCount} tasks</span>
                    <span>{board.membersCount} members</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Today</h2>
          {todayTasks.length === 0 ? (
            <Card className="border-dashed bg-transparent p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Nothing due today. Enjoy the calm.
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {todayTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  title={task.title}
                  priority={task.priority}
                  dueDate={task.dueDate}
                  boardId={task.board.id}
                />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Assigned to you</h2>
          {upcoming.length === 0 ? (
            <Card className="border-dashed bg-transparent p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No upcoming tasks assigned to you.
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {upcoming.map((task) => (
                <TaskRow
                  key={task.id}
                  title={task.title}
                  priority={task.priority}
                  dueDate={task.dueDate}
                  boardId={task.board.id}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function TaskRow({
  title,
  priority,
  dueDate,
  boardId,
}: {
  title: string
  priority: string
  dueDate: Date | null
  boardId: string
}) {
  return (
    <Link href={`/boards/${boardId}`}>
      <Card className="flex items-center gap-3 glass px-4 py-3 transition-colors hover:border-primary/50">
        <CheckCircle2 className="size-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          {title}
        </span>
        <TaskDueDate dueDate={dueDate} />
        <TaskPriorityBadge priority={priority as TaskPriority} />
      </Card>
    </Link>
  )
}
