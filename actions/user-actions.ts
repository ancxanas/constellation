"use server"

import type { BoardRole } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/session"
import { canManageBoard, getBoardRole } from "@/lib/permissions"
import { inviteSchema } from "@/lib/zod-schemas"
import type { ActionResponse } from "@/lib/types"

export async function inviteMemberAction(
  boardId: string,
  email: string
): Promise<ActionResponse> {
  const user = await requireUser()
  const canManage = await canManageBoard(user.id, boardId)
  if (!canManage) {
    return { error: "You don't have permission to invite members" }
  }

  const parsed = inviteSchema.safeParse({ email })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid email" }
  }

  const target = await prisma.user.findUnique({
    where: { email: parsed.data.email.trim().toLowerCase() },
    select: { id: true },
  })
  if (!target) return { error: "No user has that email" }

  const existing = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId: target.id } },
    select: { id: true },
  })
  if (existing) return { error: "That user is already a member" }

  await prisma.boardMember.create({
    data: { boardId, userId: target.id, role: "MEMBER" },
  })

  return {}
}

export async function removeMemberAction(
  boardId: string,
  memberId: string
): Promise<ActionResponse> {
  const user = await requireUser()
  const canManage = await canManageBoard(user.id, boardId)
  if (!canManage) {
    return { error: "You don't have permission to remove members" }
  }

  const member = await prisma.boardMember.findUnique({
    where: { id: memberId },
    select: { userId: true, role: true },
  })
  if (!member) return { error: "Member not found" }
  if (member.role === "OWNER") {
    return { error: "You can't remove the board owner" }
  }

  await prisma.boardMember.delete({ where: { id: memberId } })
  return {}
}

export async function updateMemberRoleAction(
  boardId: string,
  memberId: string,
  role: BoardRole
): Promise<ActionResponse> {
  const user = await requireUser()
  const myRole = await getBoardRole(user.id, boardId)
  if (myRole !== "OWNER") {
    return { error: "Only the owner can change roles" }
  }

  const member = await prisma.boardMember.findUnique({
    where: { id: memberId },
    select: { role: true },
  })
  if (!member) return { error: "Member not found" }

  const nextRole = role === "OWNER" ? member.role : role
  await prisma.boardMember.update({
    where: { id: memberId },
    data: { role: nextRole },
  })

  return {}
}
