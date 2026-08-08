"use server"

import bcrypt from "bcryptjs"
import { signOut } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { registerSchema, type RegisterValues } from "@/lib/zod-schemas"

export async function signOutAction() {
  await signOut({ redirectTo: "/login" })
}

export async function registerAction(
  values: RegisterValues
): Promise<{ error?: string }> {
  const parsed = registerSchema.safeParse(values)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const { name, email, password } = parsed.data
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return { error: "An account with this email already exists" }
  }

  const hashed = await bcrypt.hash(password, 10)
  await prisma.user.create({
    data: { name, email, password: hashed },
  })

  return {}
}
