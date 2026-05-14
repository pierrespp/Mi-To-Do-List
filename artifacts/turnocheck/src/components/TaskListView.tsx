import React, { memo, useState } from 'react'
import { Task, Section } from '@/types'
import { cn } from '@/lib/utils'
import { Pin, Trash2 } from 'lucide-react'
import { taskService } from '@/services/taskService'
import { useTurnoStore } from '@/store/turnoStore'
import { useToast } from '@/hooks/use-toast'

interface TaskListViewProps {
  tasks: Task[]
  sections: Section[]
  sections_map: Record<string, Section>
  selectedTaskId: string | null
  selectedSectionId: string | null
  onSelectTask: (taskId: string) => void
}

const PRIORITY_ORDER = { critical: 0, high: 1, normal: 2, low: 3 }
const PRIORITY_COLOR = {
  critical: 'bg-red-50 border-l-4 border-red-500',
  high: 'bg-orange-50 border-l-4 border-orange-500',
  normal: 'bg-gray-50 border-l-4 border-gray-300',
  low: 'bg-blue-50 border-l-4 border-blue-300',
}

const PRIORITY_BADGE = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  normal: 'bg-gray-100 text-gray-700',
  low: 'bg-blue-100 text-blue-700',
}

export const TaskListView = memo(function TaskListView({
  tasks,
  sections,
  sections_map,
  selectedTaskId,
  selectedSectionId,
  onSelectTask,
}: TaskListViewProps) {
  const { updateTaskOptimistic, rollbackTask, removeTask } = useTurnoStore()
  const { toast } = useToast()
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())

  // Filter tasks based on selected section
  const filteredTasks = selectedSectionId
    ? tasks.filter(t => t.section_id === selectedSectionId && t.status === 'pending')
    : tasks.filter(t => t.status === 'pending')

  // Sort tasks by pinned, then priority
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1
    return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
  })

  const handleToggle = async (task: Task, e: React.MouseEvent) => {
    e.stopPropagation()
    const newStatus = task.status === 'completed' ? 'pending' : 'completed'
    updateTaskOptimistic(task.id, { status: newStatus })
    try {
      await taskService.updateTask(task.id, { status: newStatus })
    } catch {
      rollbackTask(task.id, task)
      toast({ title: 'Erro ao atualizar tarefa', variant: 'destructive' })
    }
  }

  const handlePin = async (task: Task, e: React.MouseEvent) => {
    e.stopPropagation()
    const newPinned = !task.is_pinned
    updateTaskOptimistic(task.id, { is_pinned: newPinned })
    try {
      await taskService.updateTask(task.id, { is_pinned: newPinned })
    } catch {
      rollbackTask(task.id, task)
      toast({ title: 'Erro ao fixar tarefa', variant: 'destructive' })
    }
  }

  const handleDelete = async (task: Task, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeletingIds(prev => new Set([...prev, task.id]))
    try {
      await taskService.deleteTask(task.id)
      removeTask(task.id)
    } catch {
      toast({ title: 'Erro ao remover tarefa', variant: 'destructive' })
      setDeletingIds(prev => {
        const next = new Set(prev)
        next.delete(task.id)
        return next
      })
    }
  }

  return (
    <main className="flex-1 flex flex-col border-r border-gray-200 bg-white overflow-hidden">
      {/* List Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">
          {selectedSectionId
            ? `${sections_map[selectedSectionId]?.name || 'Tasks'} (${sortedTasks.length})`
            : `All Tasks (${sortedTasks.length})`}
        </h2>
        <span className="text-xs text-gray-500">
          Click to select
        </span>
      </div>

      {/* Task List */}
      {sortedTasks.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-gray-400 text-sm text-center">
            No tasks in this section
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-2 p-4">
            {sortedTasks.map((task) => {
              const section = task.section_id ? sections_map[task.section_id] : undefined
              const isSelected = selectedTaskId === task.id
              const isDeleting = deletingIds.has(task.id)
              const isCompleted = task.status === 'completed'

              return (
                <button
                  key={task.id}
                  onClick={() => onSelectTask(task.id)}
                  className={cn(
                    "w-full text-left transition-all duration-200 rounded-lg p-4 border-2 group",
                    PRIORITY_COLOR[task.priority],
                    isSelected
                      ? "border-blue-500 shadow-md"
                      : "border-transparent hover:border-gray-300",
                    (isDeleting || isCompleted) && "opacity-50 pointer-events-none"
                  )}
                  data-testid={`task-row-${task.id}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <button
                      onClick={(e) => handleToggle(task, e)}
                      className={cn(
                        "checkbox-task flex-shrink-0 mt-0.5",
                        isCompleted
                          ? "bg-[var(--color-completed)] border-[var(--color-completed)]"
                          : "border-gray-300 hover:border-gray-400"
                      )}
                      aria-label={`Mark "${task.title}" as ${isCompleted ? 'pending' : 'completed'}`}
                    >
                      {isCompleted && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>

                    {/* Task Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className={cn(
                          "text-sm font-medium truncate",
                          isCompleted ? "line-through text-gray-400" : "text-gray-900"
                        )}>
                          {task.title}
                        </p>
                        {task.is_pinned && !isCompleted && (
                          <Pin className="w-3.5 h-3.5 flex-shrink-0 fill-[var(--color-progress)]" style={{ color: 'var(--color-progress)' }} />
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-gray-500">
                          {section?.name}
                        </span>
                        {!isCompleted && task.priority !== 'normal' && task.priority !== 'low' && (
                          <span className={cn(
                            "text-[10px] font-bold uppercase px-1.5 py-0.5 rounded",
                            PRIORITY_BADGE[task.priority]
                          )}>
                            {task.priority === 'critical' ? 'Crítico' : 'Alto'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button
                        onClick={(e) => handlePin(task, e)}
                        className={cn(
                          "btn-icon-small text-gray-400 hover:text-gray-600 hover:bg-gray-100",
                          task.is_pinned && "hover:bg-blue-50"
                        )}
                        style={task.is_pinned ? { color: 'var(--color-progress)' } : undefined}
                        aria-label={task.is_pinned ? "Unpin task" : "Pin task"}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(task, e)}
                        className="btn-icon-small text-gray-400 hover:text-red-600 hover:bg-red-50"
                        aria-label={`Delete "${task.title}"`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </main>
  )
})
