"use client"

import { create } from "zustand"

type BoardStore = {
  selectedTaskId: string | null
  newTaskColumnId: string | null
  openTask: (taskId: string) => void
  closeTask: () => void
  openNewTask: (columnId: string) => void
  closeNewTask: () => void
}

export const useBoardStore = create<BoardStore>((set) => ({
  selectedTaskId: null,
  newTaskColumnId: null,
  openTask: (taskId) => set({ selectedTaskId: taskId }),
  closeTask: () => set({ selectedTaskId: null }),
  openNewTask: (columnId) => set({ newTaskColumnId: columnId }),
  closeNewTask: () => set({ newTaskColumnId: null }),
}))
