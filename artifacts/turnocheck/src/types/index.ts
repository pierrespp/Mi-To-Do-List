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
