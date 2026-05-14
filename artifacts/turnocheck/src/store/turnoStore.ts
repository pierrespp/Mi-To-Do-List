import { create } from 'zustand'
import { Workspace, Turno, Section, Task, RecurringTask } from '@/types'

interface TurnoState {
  workspace: Workspace | null
  turno: Turno | null
  sections: Section[]
  tasks: Task[]
  recurringTasks: RecurringTask[]
  selectedTaskId: string | null
  setWorkspace: (workspace: Workspace) => void
  setTurno: (turno: Turno | null) => void
  setSections: (sections: Section[]) => void
  setTasks: (tasks: Task[]) => void
  setRecurringTasks: (recurringTasks: RecurringTask[]) => void
  setSelectedTaskId: (taskId: string | null) => void
  addTask: (task: Task) => void
  updateTaskOptimistic: (taskId: string, changes: Partial<Task>) => void
  rollbackTask: (taskId: string, previous: Task) => void
  removeTask: (taskId: string) => void
}

export const useTurnoStore = create<TurnoState>((set) => ({
  workspace: null,
  turno: null,
  sections: [],
  tasks: [],
  recurringTasks: [],
  selectedTaskId: null,
  setWorkspace: (workspace) => set({ workspace }),
  setTurno: (turno) => set({ turno }),
  setSections: (sections) => set({ sections }),
  setTasks: (tasks) => set({ tasks }),
  setRecurringTasks: (recurringTasks) => set({ recurringTasks }),
  setSelectedTaskId: (selectedTaskId) => set({ selectedTaskId }),
  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
  updateTaskOptimistic: (taskId, changes) => set((state) => ({
    tasks: state.tasks.map((t) => t.id === taskId ? { ...t, ...changes } : t)
  })),
  rollbackTask: (taskId, previous) => set((state) => ({
    tasks: state.tasks.map((t) => t.id === taskId ? previous : t)
  })),
  removeTask: (taskId) => set((state) => ({
    tasks: state.tasks.filter((t) => t.id !== taskId)
  }))
}))
