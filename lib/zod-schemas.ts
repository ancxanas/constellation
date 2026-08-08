import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})
export type LoginValues = z.infer<typeof loginSchema>

export const registerSchema = z
  .object({
    name: z.string().trim().min(1, "Enter your name").max(80),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters").max(128),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
export type RegisterValues = z.infer<typeof registerSchema>

export const taskStatusSchema = z.enum(["TODO", "IN_PROGRESS", "DONE", "BACKLOG"])
export const taskPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"])

export const boardSchema = z.object({
  title: z.string().trim().min(1, "Give the board a name").max(100),
  description: z.string().trim().max(500).optional().or(z.literal("")),
})
export type BoardValues = z.infer<typeof boardSchema>

export const taskSchema = z.object({
  title: z.string().trim().min(1, "Give the task a title").max(200),
  description: z.string().max(5000).optional().or(z.literal("")),
  status: taskStatusSchema,
  priority: taskPrioritySchema,
  dueDate: z.string().nullable().optional(),
  assigneeId: z.string().nullable().optional(),
  columnId: z.string().min(1),
})
export type TaskValues = z.infer<typeof taskSchema>

export const commentSchema = z.object({
  content: z.string().trim().min(1, "Write a comment").max(2000),
})
export type CommentValues = z.infer<typeof commentSchema>

export const inviteSchema = z.object({
  email: z.string().email("Enter a valid email"),
})
export type InviteValues = z.infer<typeof inviteSchema>

export const tagSchema = z.object({
  name: z.string().trim().min(1).max(30),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a hex color"),
})
export type TagValues = z.infer<typeof tagSchema>
