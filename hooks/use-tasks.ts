"use client"

import { useQuery } from "@tanstack/react-query"

import type { BoardDetailDTO, BoardSummaryDTO, CommentDTO } from "@/lib/types"

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json()
}

export function useBoards(initialBoards: BoardSummaryDTO[]) {
  return useQuery({
    queryKey: ["boards"],
    queryFn: async () => {
      const data = await fetchJson<{ boards: BoardSummaryDTO[] }>("/api/boards")
      return data.boards
    },
    initialData: initialBoards,
  })
}

export function useBoard(boardId: string, initialBoard: BoardDetailDTO) {
  return useQuery({
    queryKey: ["boards", boardId],
    queryFn: async () => {
      const data = await fetchJson<{ board: BoardDetailDTO }>(
        `/api/boards/${boardId}`
      )
      return data.board
    },
    initialData: initialBoard,
  })
}

export function useComments(taskId: string) {
  return useQuery({
    queryKey: ["comments", taskId],
    queryFn: async () => {
      const data = await fetchJson<{ comments: CommentDTO[] }>(
        `/api/tasks/${taskId}/comments`
      )
      return data.comments
    },
    enabled: !!taskId,
    initialData: [],
  })
}
