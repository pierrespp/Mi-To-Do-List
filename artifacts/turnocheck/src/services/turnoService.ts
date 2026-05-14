import { supabase } from '@/lib/supabase'
import { Turno, Task } from '@/types'

export const turnoService = {
  async restartTurno(workspaceId: string, currentTurnoId: string): Promise<{ turno: Turno, tasks: Task[] }> {
    // 1. archive current
    await supabase
      .from('turnos')
      .update({ status: 'archived', finished_at: new Date().toISOString() })
      .eq('id', currentTurnoId)

    // 2. create new active turno
    const { data: newTurno, error: insertError } = await supabase
      .from('turnos')
      .insert({ workspace_id: workspaceId, status: 'active' })
      .select()
      .single()

    if (insertError) throw insertError

    // 3. fetch recurring tasks
    const { data: recurringTasks, error: reqError } = await supabase
      .from('recurring_tasks')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('is_active', true)

    if (reqError) throw reqError

    let tasks: Task[] = []

    // 4. insert new tasks from recurring
    if (recurringTasks && recurringTasks.length > 0) {
      const newTasksData = recurringTasks.map(rt => ({
        turno_id: newTurno.id,
        section_id: rt.section_id,
        recurring_task_id: rt.id,
        title: rt.title,
        priority: rt.priority,
        status: 'pending'
      }))

      const { data: insertedTasks, error: taskError } = await supabase
        .from('tasks')
        .insert(newTasksData)
        .select()

      if (taskError) throw taskError
      tasks = insertedTasks as Task[]
    }

    return { turno: newTurno as Turno, tasks }
  }
}
