import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { getUserBoards } from "@/lib/queries"
import { BoardList } from "@/components/boards/board-list"

export const metadata = { title: "Boards" }

export default async function BoardsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const boards = await getUserBoards(session.user.id)

  return <BoardList initialBoards={boards} />
}
