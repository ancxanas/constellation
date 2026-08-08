import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const qa = await prisma.user.findUnique({ where: { email: "qa.audit@test.dev" } })
  if (qa) {
    await prisma.comment.deleteMany({ where: { authorId: qa.id } })
    await prisma.user.delete({ where: { id: qa.id } })
    console.log("deleted qa user")
  } else {
    console.log("no qa user")
  }
  const demo = await prisma.user.findUnique({ where: { email: "demo@constellation.app" } })
  if (demo) {
    const boards = await prisma.board.findMany({
      where: { ownerId: demo.id, title: { not: "Getting Started" } },
      select: { id: true },
    })
    for (const b of boards) await prisma.board.delete({ where: { id: b.id } })
    console.log("deleted demo test boards:", boards.length)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
