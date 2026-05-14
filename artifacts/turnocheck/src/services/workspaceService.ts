import { supabase } from '@/lib/supabase'
import { Workspace, Turno, Section, RecurringTask } from '@/types'

export const workspaceService = {
  async getOrCreateWorkspace(slug: string): Promise<Workspace> {
    const { data: existing, error } = await supabase
      .from('workspaces')
      .select('*')
      .eq('slug', slug)
      .single()

    if (existing) return existing as Workspace

    // Create if not exists
    const { data: newWorkspace, error: createError } = await supabase
      .from('workspaces')
      .insert({ name: 'Turno Noite', slug })
      .select()
      .single()

    if (createError) throw createError

    // Create default sections
    await supabase.from('sections').insert([
      { workspace_id: newWorkspace.id, name: 'Fechamento do Turno', is_closing_section: true, order: 1 },
      { workspace_id: newWorkspace.id, name: 'Tarefas do Turno', is_closing_section: false, order: 2 }
    ])

    // Create first active turno
    await supabase.from('turnos').insert({
      workspace_id: newWorkspace.id,
      status: 'active'
    })

    return newWorkspace as Workspace
  },

  async getActiveTurno(workspaceId: string): Promise<Turno | null> {
    const { data, error } = await supabase
      .from('turnos')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('status', 'active')
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data as Turno | null
  },

  async getSections(workspaceId: string): Promise<Section[]> {
    const { data, error } = await supabase
      .from('sections')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('order', { ascending: true })

    if (error) throw error
    return data as Section[]
  },

  async getTasks(turnoId: string) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('turno_id', turnoId)

    if (error) throw error
    return data
  },

  async getRecurringTasks(workspaceId: string): Promise<RecurringTask[]> {
    const { data, error } = await supabase
      .from('recurring_tasks')
      .select('*')
      .eq('workspace_id', workspaceId)

    if (error) throw error
    return data as RecurringTask[]
  },

  async createRecurringTask(data: Partial<RecurringTask>): Promise<RecurringTask> {
    const { data: newTask, error } = await supabase
      .from('recurring_tasks')
      .insert(data)
      .select()
      .single()

    if (error) throw error
    return newTask as RecurringTask
  },

  async deleteRecurringTask(id: string): Promise<void> {
    const { error } = await supabase.from('recurring_tasks').delete().eq('id', id)
    if (error) throw error
  },

  async toggleRecurringTask(id: string, isActive: boolean): Promise<RecurringTask> {
    const { data, error } = await supabase
      .from('recurring_tasks')
      .update({ is_active: isActive })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as RecurringTask
  }
}
