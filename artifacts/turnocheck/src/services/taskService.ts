import { supabase } from '@/lib/supabase'
import { Task } from '@/types'

export const taskService = {
  async createTask(data: Partial<Task>): Promise<Task> {
    const { data: newTask, error } = await supabase
      .from('tasks')
      .insert(data)
      .select()
      .single()

    if (error) throw error
    return newTask as Task
  },

  async updateTask(id: string, changes: Partial<Task>): Promise<Task> {
    if (changes.status === 'completed' && !changes.completed_at) {
      changes.completed_at = new Date().toISOString()
    } else if (changes.status === 'pending') {
      changes.completed_at = null
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(changes)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Task
  },

  async deleteTask(id: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async toggleTask(id: string, currentStatus: Task['status']): Promise<Task> {
    const newStatus = currentStatus === 'pending' ? 'completed' : 'pending'
    return this.updateTask(id, { status: newStatus })
  },

  async pinTask(id: string, isPinned: boolean): Promise<Task> {
    return this.updateTask(id, { is_pinned: isPinned })
  }
}
