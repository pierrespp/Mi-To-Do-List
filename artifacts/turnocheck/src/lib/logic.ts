import * as React from 'react'
import { createClient } from '@supabase/supabase-js'
import { create } from 'zustand'

// ==========================================
// 1. SUPABASE CLIENT
// ==========================================
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ==========================================
// 2. TYPES
// ==========================================
export type Workspace = {
  id: string
  name: string
  slug: string
  created_at: string
  updated_at: string
}

export type Section = {
  id: string
  workspace_id: string
  name: string
  order: number
  color: string | null
  is_closing_section: boolean
  created_at: string
  updated_at: string
}

export type Turno = {
  id: string
  workspace_id: string
  started_at: string
  finished_at: string | null
  status: 'active' | 'completed' | 'archived'
  created_at: string
  updated_at: string
}

export type Task = {
  id: string
  turno_id: string
  section_id: string | null
  recurring_task_id: string | null
  title: string
  description: string | null
  priority: 'low' | 'normal' | 'high' | 'critical'
  status: 'pending' | 'completed'
  is_pinned: boolean
  completed_at: string | null
  created_at: string
  updated_at: string
}

export type RecurringTask = {
  id: string
  workspace_id: string
  section_id: string | null
  title: string
  priority: 'low' | 'normal' | 'high' | 'critical'
  recurrence_type: 'daily' | 'weekly' | 'custom'
  is_active: boolean
  created_at: string
  updated_at: string
}

// ==========================================
// 3. SERVICES
// ==========================================
export const taskService = {
  async createTask(data: Partial<Task>): Promise<Task> {
    const { data: newTask, error } = await supabase.from('tasks').insert(data).select().single()
    if (error) throw error
    return newTask as Task
  },
  async updateTask(id: string, changes: Partial<Task>): Promise<Task> {
    if (changes.status === 'completed' && !changes.completed_at) {
      changes.completed_at = new Date().toISOString()
    } else if (changes.status === 'pending') {
      changes.completed_at = null
    }
    const { data, error } = await supabase.from('tasks').update(changes).eq('id', id).select().single()
    if (error) throw error
    return data as Task
  },
  async deleteTask(id: string): Promise<void> {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) throw error
  },
  async toggleTask(id: string, currentStatus: Task['status']): Promise<Task> {
    const newStatus = currentStatus === 'pending' ? 'completed' : 'pending'
    return this.updateTask(id, { status: newStatus })
  }
}

export const turnoService = {
  async restartTurno(workspaceId: string, currentTurnoId: string): Promise<{ turno: Turno, tasks: Task[] }> {
    await supabase.from('turnos').update({ status: 'archived', finished_at: new Date().toISOString() }).eq('id', currentTurnoId)
    const { data: newTurno, error: insertError } = await supabase.from('turnos').insert({ workspace_id: workspaceId, status: 'active' }).select().single()
    if (insertError) throw insertError
    const { data: recurringTasks, error: reqError } = await supabase.from('recurring_tasks').select('*').eq('workspace_id', workspaceId).eq('is_active', true)
    if (reqError) throw reqError
    let tasks: Task[] = []
    if (recurringTasks && recurringTasks.length > 0) {
      const newTasksData = recurringTasks.map(rt => ({
        turno_id: newTurno.id,
        section_id: rt.section_id,
        recurring_task_id: rt.id,
        title: rt.title,
        priority: rt.priority,
        status: 'pending'
      }))
      const { data: insertedTasks, error: taskError } = await supabase.from('tasks').insert(newTasksData).select()
      if (taskError) throw taskError
      tasks = insertedTasks as Task[]
    }
    return { turno: newTurno as Turno, tasks }
  }
}

export const workspaceService = {
  async getOrCreateWorkspace(slug: string): Promise<Workspace> {
    const { data: existing, error } = await supabase.from('workspaces').select('*').eq('slug', slug).single()
    if (existing) return existing as Workspace
    const { data: newWorkspace, error: createError } = await supabase.from('workspaces').insert({ name: 'Turno Noite', slug }).select().single()
    if (createError) throw createError
    await supabase.from('sections').insert([
      { workspace_id: newWorkspace.id, name: 'Fechamento do Turno', is_closing_section: true, order: 1 },
      { workspace_id: newWorkspace.id, name: 'Tarefas do Turno', is_closing_section: false, order: 2 }
    ])
    await supabase.from('turnos').insert({ workspace_id: newWorkspace.id, status: 'active' })
    return newWorkspace as Workspace
  },
  async getActiveTurno(workspaceId: string): Promise<Turno | null> {
    const { data, error } = await supabase.from('turnos').select('*').eq('workspace_id', workspaceId).eq('status', 'active').single()
    if (error && error.code !== 'PGRST116') throw error
    return data as Turno | null
  },
  async getSections(workspaceId: string): Promise<Section[]> {
    const { data, error } = await supabase.from('sections').select('*').eq('workspace_id', workspaceId).order('order', { ascending: true })
    if (error) throw error
    return data as Section[]
  },
  async getTasks(turnoId: string) {
    const { data, error } = await supabase.from('tasks').select('*').eq('turno_id', turnoId)
    if (error) throw error
    return data
  },
  async getRecurringTasks(workspaceId: string): Promise<RecurringTask[]> {
    const { data, error } = await supabase.from('recurring_tasks').select('*').eq('workspace_id', workspaceId)
    if (error) throw error
    return data as RecurringTask[]
  },
  async createRecurringTask(data: Partial<RecurringTask>): Promise<RecurringTask> {
    const { data: newTask, error } = await supabase.from('recurring_tasks').insert(data).select().single()
    if (error) throw error
    return newTask as RecurringTask
  },
  async deleteRecurringTask(id: string): Promise<void> {
    const { error } = await supabase.from('recurring_tasks').delete().eq('id', id)
    if (error) throw error
  },
  async toggleRecurringTask(id: string, isActive: boolean): Promise<RecurringTask> {
    const { data, error } = await supabase.from('recurring_tasks').update({ is_active: isActive }).eq('id', id).select().single()
    if (error) throw error
    return data as RecurringTask
  }
}

// ==========================================
// 4. ZUSTAND STORE
// ==========================================
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
  workspace: null, turno: null, sections: [], tasks: [], recurringTasks: [], selectedTaskId: null,
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

// ==========================================
// 5. THEME CONTEXT
// ==========================================
export type Theme = 'kawaii' | 'spatial'
const THEME_STORAGE_KEY = 'mi-todo-theme'
const THEMES: Record<Theme, { label: string; emoji: string }> = {
  kawaii:  { label: 'Kawaii Pride',      emoji: '🌸' },
  spatial: { label: 'Spatial Moodboard', emoji: '📔' },
}

interface ThemeCtx {
  theme: Theme
  toggle: () => void
  themes: typeof THEMES
}

const ThemeContext = React.createContext<ThemeCtx | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = React.useState<Theme>(() => {
    try {
      const v = localStorage.getItem(THEME_STORAGE_KEY)
      if (v === 'kawaii' || v === 'spatial') return v
    } catch {}
    return 'kawaii'
  })

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try { localStorage.setItem(THEME_STORAGE_KEY, theme) } catch {}
  }, [theme])

  const toggle = () => setTheme(prev => (prev === 'kawaii' ? 'spatial' : 'kawaii'))

  return React.createElement(ThemeContext.Provider, { value: { theme, toggle, themes: THEMES } }, children)
}

export function useTheme(): ThemeCtx {
  const ctx = React.useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}

// ==========================================
// 6. UTILITY HOOKS
// ==========================================
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)
  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: 767px)`)
    const onChange = () => setIsMobile(window.innerWidth < 768)
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < 768)
    return () => mql.removeEventListener("change", onChange)
  }, [])
  return !!isMobile
}

// Toast Hook (Simplified version of what was in use-toast.ts)
// This part is complex due to shadcn dependencies, so I'll keep it as a wrapper or copy it carefully.
// To keep it simple, I'll export a minimal toast hook that interfaces with the UI component.
import type { ToastActionElement, ToastProps } from "@/components/ui/toast"
const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000
type ToasterToast = ToastProps & { id: string; title?: React.ReactNode; description?: React.ReactNode; action?: ToastActionElement }
const actionTypes = { ADD_TOAST: "ADD_TOAST", UPDATE_TOAST: "UPDATE_TOAST", DISMISS_TOAST: "DISMISS_TOAST", REMOVE_TOAST: "REMOVE_TOAST" } as const
let count = 0
function genId() { count = (count + 1) % Number.MAX_SAFE_INTEGER; return count.toString() }
type Action = { type: "ADD_TOAST"; toast: ToasterToast } | { type: "UPDATE_TOAST"; toast: Partial<ToasterToast> } | { type: "DISMISS_TOAST"; toastId?: string } | { type: "REMOVE_TOAST"; toastId?: string }
const listeners: Array<(state: { toasts: ToasterToast[] }) => void> = []
let memoryState: { toasts: ToasterToast[] } = { toasts: [] }
function dispatch(action: Action) {
  if (action.type === "ADD_TOAST") memoryState = { toasts: [action.toast, ...memoryState.toasts].slice(0, TOAST_LIMIT) }
  else if (action.type === "UPDATE_TOAST") memoryState = { toasts: memoryState.toasts.map((t) => t.id === action.toast.id ? { ...t, ...action.toast } : t) }
  else if (action.type === "DISMISS_TOAST") memoryState = { toasts: memoryState.toasts.map((t) => (t.id === action.toastId || !action.toastId) ? { ...t, open: false } : t) }
  else if (action.type === "REMOVE_TOAST") memoryState = { toasts: action.toastId ? memoryState.toasts.filter((t) => t.id !== action.toastId) : [] }
  listeners.forEach((l) => l(memoryState))
}
export function toast({ ...props }: Omit<ToasterToast, "id">) {
  const id = genId()
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })
  dispatch({ type: "ADD_TOAST", toast: { ...props, id, open: true, onOpenChange: (open) => { if (!open) dismiss() } } })
  return { id, dismiss, update: (p: ToasterToast) => dispatch({ type: "UPDATE_TOAST", toast: { ...p, id } }) }
}
export function useToast() {
  const [state, setState] = React.useState(memoryState)
  React.useEffect(() => { listeners.push(setState); return () => { const i = listeners.indexOf(setState); if (i > -1) listeners.splice(i, 1) } }, [])
  return { ...state, toast, dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }) }
}
