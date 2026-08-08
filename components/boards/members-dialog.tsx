"use client"

import { useState } from "react"
import { Shield, Trash2, UserPlus, Users } from "lucide-react"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"

import {
  inviteMemberAction,
  removeMemberAction,
  updateMemberRoleAction,
} from "@/actions/user-actions"
import { inviteSchema } from "@/lib/zod-schemas"
import { initials } from "@/lib/utils"
import type { BoardRole, MemberDTO } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const roleLabels: Record<BoardRole, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MEMBER: "Member",
}

const memberOrder: BoardRole[] = ["OWNER", "ADMIN", "MEMBER"]

export function MembersDialog({
  boardId,
  members,
  currentUserId,
  myRole,
}: {
  boardId: string
  members: MemberDTO[]
  currentUserId: string
  myRole: BoardRole
}) {
  const [email, setEmail] = useState("")
  const [inviting, setInviting] = useState(false)
  const queryClient = useQueryClient()

  const canManage = myRole === "OWNER" || myRole === "ADMIN"
  const isOwner = myRole === "OWNER"

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["boards", boardId] })
  }

  async function invite() {
    const parsed = inviteSchema.safeParse({ email })
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid email")
      return
    }
    setInviting(true)
    const result = await inviteMemberAction(boardId, parsed.data.email)
    setInviting(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("Member invited")
    setEmail("")
    invalidate()
  }

  async function remove(memberId: string) {
    const result = await removeMemberAction(boardId, memberId)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("Member removed")
    invalidate()
  }

  async function changeRole(memberId: string, role: BoardRole) {
    const result = await updateMemberRoleAction(boardId, memberId, role)
    if (result.error) {
      toast.error(result.error)
      return
    }
    invalidate()
  }

  const sorted = [...members].sort(
    (a, b) => memberOrder.indexOf(a.role) - memberOrder.indexOf(b.role)
  )

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
        <Users className="size-4" />
        <span className="sr-only">Members</span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Members</DialogTitle>
          <DialogDescription>
            {members.length} member{members.length === 1 ? "" : "s"} on this
            board
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-2">
              <Label htmlFor="invite-email">Invite by email</Label>
              <Input
                id="invite-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") invite()
                }}
                placeholder="friend@example.com"
                disabled={!canManage}
              />
            </div>
            <Button
              onClick={invite}
              disabled={!canManage || inviting || !email.trim()}
            >
              <UserPlus className="size-4" />
              {inviting ? "Inviting…" : "Invite"}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {sorted.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-foreground/10 px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-2">
                <Avatar className="size-8">
                  <AvatarImage
                    src={member.user.image ?? undefined}
                    alt={member.user.name ?? ""}
                  />
                  <AvatarFallback>
                    {initials(member.user.name, member.user.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {member.user.name || member.user.email}
                    {member.user.id === currentUserId && (
                      <span className="ml-1 text-xs text-muted-foreground">
                        (you)
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {member.user.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {isOwner && member.role !== "OWNER" ? (
                  <Select
                    value={member.role}
                    onValueChange={(role) =>
                      changeRole(member.id, role as BoardRole)
                    }
                  >
                    <SelectTrigger className="h-7 w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="MEMBER">Member</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    {member.role === "OWNER" && <Shield className="size-3.5" />}
                    {roleLabels[member.role]}
                  </span>
                )}

                {canManage &&
                  member.role !== "OWNER" &&
                  member.user.id !== currentUserId && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => remove(member.id)}
                    >
                      <Trash2 className="size-4" />
                      <span className="sr-only">
                        Remove {member.user.name || member.user.email}
                      </span>
                    </Button>
                  )}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
