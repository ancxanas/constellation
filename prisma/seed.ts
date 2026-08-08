import { hash } from "bcryptjs"

import { prisma } from "../lib/prisma"

const DEMO_EMAIL = "demo@constellation.app"
const DEMO_PASSWORD = "password123"

async function upsertUser() {
  const existing = await prisma.user.findUnique({
    where: { email: DEMO_EMAIL },
  })
  if (existing) return existing

  return prisma.user.create({
    data: {
      email: DEMO_EMAIL,
      name: "Demo User",
      password: await hash(DEMO_PASSWORD, 10),
    },
  })
}

async function main() {
  const user = await upsertUser()

  const existingBoard = await prisma.board.findFirst({
    where: { ownerId: user.id },
  })
  if (existingBoard) {
    console.log(`Demo user already has data (${existingBoard.title}). Skipping board creation.`)
    return
  }

  const board = await prisma.board.create({
    data: {
      title: "Getting Started",
      description: "A sample board to explore Constellation.",
      ownerId: user.id,
      members: { create: { userId: user.id, role: "OWNER" } },
    },
  })

  const todo = await prisma.column.create({
    data: { boardId: board.id, title: "To Do", order: 0 },
  })
  const inProgress = await prisma.column.create({
    data: { boardId: board.id, title: "In Progress", order: 1 },
  })
  const done = await prisma.column.create({
    data: { boardId: board.id, title: "Done", order: 2 },
  })

  await prisma.task.create({
    data: {
      title: "Try drag and drop",
      description: "Grab this card and drag it into another column.",
      status: "TODO",
      priority: "HIGH",
      order: 0,
      columnId: todo.id,
      boardId: board.id,
      assigneeId: user.id,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      tags: {
        create: [
          { name: "tutorial", color: "#3b82f6" },
          { name: "fun", color: "#ec4899" },
        ],
      },
    },
  })

  await prisma.task.create({
    data: {
      title: "Invite a teammate",
      description: "Open Members and add someone by email.",
      status: "TODO",
      priority: "MEDIUM",
      order: 1,
      columnId: todo.id,
      boardId: board.id,
      assigneeId: user.id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  })

  await prisma.task.create({
    data: {
      title: "Open a task to edit it",
      description:
        "Click a card to change status, priority, or add comments and tags.",
      status: "IN_PROGRESS",
      priority: "URGENT",
      order: 0,
      columnId: inProgress.id,
      boardId: board.id,
      assigneeId: user.id,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      comments: {
        create: {
          content: "Protip: press ⌘K to search across all your boards.",
          authorId: user.id,
        },
      },
    },
  })

  await prisma.task.create({
    data: {
      title: "Created your account",
      status: "DONE",
      priority: "LOW",
      order: 0,
      columnId: done.id,
      boardId: board.id,
      assigneeId: user.id,
    },
  })

  console.log("Seeded demo user:")
  console.log(`  email:    ${DEMO_EMAIL}`)
  console.log(`  password: ${DEMO_PASSWORD}`)
  console.log(`  board:    ${board.title}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
