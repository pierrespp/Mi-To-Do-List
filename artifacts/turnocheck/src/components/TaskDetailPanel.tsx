import React, { memo } from 'react'
import { Task, Section } from '@/types'
import { cn } from '@/lib/utils'
import { Pin, Trash2 } from 'lucide-react'
import { taskService } from '@/services/taskService'
import { useTurnoStore } from '@/store/turnoStore'
import { useToast } from '@/hooks/use-toast'

interface TaskDetailPanelProps {
  task: Task | null
  section: Section | null
  sections: Section[]
  onTaskUpdated: () => void
}

const PRIORITY_CONFIG: Record<Task['priority'], { color: string; label: string; bg: string }> = {
  critical: { color: 'text-red-600', label: 'Crítico', bg: 'bg-red-50' },
  high: { color: 'text-orange-600', label: 'Alto', bg: 'bg-orange-50' },
  normal: { color: 'text-gray-600', label: 'Normal', bg: 'bg-gray-50' },
  low: { color: 'text-blue-600', label: 'Baixo', bg: 'bg-blue-50' },
}

export const TaskDetailPanel = memo(function TaskDetailPanel({
  task,
  section,
  sections,
  onTaskUpdated,
}: TaskDetailPanelProps) {
  const { updateTaskOptimistic, rollbackTask, removeTask } = useTurnoStore()
  const { toast } = useToast()

  if (!task) {
    return (
      <aside className="w-72 bg-gray-50 border-l border-gray-200 flex flex-col items-center justify-center p-6">
        <p className="text-gray-400 text-sm text-center">Select a task to view details</p>
      </aside>
    )
  }

  const handleToggle = async () => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed'
    updateTaskOptimistic(task.id, { status: newStatus })
    try {
      await taskService.updateTask(task.id, { status: newStatus })
      onTaskUpdated()
    } catch {
      rollbackTask(task.id, task)
      toast({ title: 'Erro ao atualizar tarefa', variant: 'destructive' })
    }
  }

  const handlePin = async () => {
    const newPinned = !task.is_pinned
    updateTaskOptimistic(task.id, { is_pinned: newPinned })
    try {
      await taskService.updateTask(task.id, { is_pinned: newPinned })
      onTaskUpdated()
    } catch {
      rollbackTask(task.id, task)
      toast({ title: 'Erro ao fixar tarefa', variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    try {
      await taskService.deleteTask(task.id)
      removeTask(task.id)
      onTaskUpdated()
    } catch {
      toast({ title: 'Erro ao remover tarefa', variant: 'destructive' })
    }
  }

  const priorityConfig = PRIORITY_CONFIG[task.priority]
  const isCompleted = task.status === 'completed'
  const progress = Math.round((new Date().getTime() - new Date(task.created_at).getTime()) / (1000 * 60 * 60))

  return (
    <aside className="w-72 bg-gray-50 border-l border-gray-200 flex flex-col overflow-hidden">
      <div className="p-5 border-b border-gray-200 bg-white">
        <div className="flex items-start justify-between gap-3 mb-4">
          <h3 className="text-sm font-semibold text-gray-900 flex-1">Task Details</h3>
          <button
            onClick={handleDelete}
            className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
            aria-label="Delete task"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Task Title */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">
            Task Name
          </label>
          <p className={cn(
            "text-sm font-medium",
            isCompleted ? "line-through text-gray-400" : "text-gray-900"
          )}>
            {task.title}
          </p>
        </div>

        {/* Section */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">
            Section
          </label>
          <p className="text-sm text-gray-700">{section?.name || 'Unknown'}</p>
        </div>

        {/* Priority */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">
            Priority
          </label>
          <div className={cn(
            "inline-flex items-center px-3 py-1.5 rounded-lg font-semibold text-sm",
            priorityConfig.bg,
            priorityConfig.color
          )}>
            {priorityConfig.label}
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">
            Status
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggle}
              className={cn(
                "checkbox-task",
                isCompleted
                  ? "bg-[var(--color-completed)] border-[var(--color-completed)]"
                  : "border-gray-300 hover:border-gray-400"
              )}
              aria-label={`Mark task as ${isCompleted ? 'pending' : 'completed'}`}
            >
              {isCompleted && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            <span className="text-sm text-gray-700">
              {isCompleted ? 'Completed' : 'Pending'}
            </span>
          </div>
        </div>

        {/* Pinned Status */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">
            Pinned
          </label>
          <button
            onClick={handlePin}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-sm transition-colors",
              task.is_pinned
                ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
          >
            <Pin className={cn(
              "w-4 h-4",
              task.is_pinned && "fill-current"
            )} />
            {task.is_pinned ? 'Pinned' : 'Not Pinned'}
          </button>
        </div>

        {/* Created Date */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">
            Created
          </label>
          <p className="text-sm text-gray-700">
            {new Date(task.created_at).toLocaleDateString('pt-BR', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>

        {/* Task Duration */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">
            Duration
          </label>
          <p className="text-sm text-gray-700">
            {progress} hour{progress !== 1 ? 's' : ''} ago
          </p>
        </div>
      </div>

      {/* Actions Footer */}
      <div className="p-5 border-t border-gray-200 bg-white space-y-2">
        <button
          onClick={handleToggle}
          className={cn(
            "w-full py-2 px-3 rounded-lg font-medium text-sm transition-colors",
            isCompleted
              ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
              : "bg-green-100 text-green-700 hover:bg-green-200"
          )}
        >
          {isCompleted ? '↩️ Mark as Pending' : '✓ Mark as Completed'}
        </button>
      </div>
    </aside>
  )
})
