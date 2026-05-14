import React, { useState } from 'react'
import { Task } from '@/types'
import { taskService } from '@/services/taskService'
import { useTurnoStore } from '@/store/turnoStore'
import { Pin, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface TaskItemProps {
  task: Task
  dimmed?: boolean
}

const PRIORITY_DOT: Record<Task['priority'], string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  normal: 'bg-transparent',
  low: 'bg-transparent',
}

const PRIORITY_LABEL: Record<Task['priority'], string | null> = {
  critical: 'Crítico',
  high: 'Alto',
  normal: null,
  low: null,
}

export function TaskItem({ task, dimmed = false }: TaskItemProps) {
  const { updateTaskOptimistic, rollbackTask, removeTask } = useTurnoStore()
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleToggle = async () => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed'
    updateTaskOptimistic(task.id, { status: newStatus })
    try {
      await taskService.updateTask(task.id, { status: newStatus })
    } catch {
      rollbackTask(task.id, task)
      toast({ title: 'Erro ao atualizar tarefa', description: 'Tente novamente.', variant: 'destructive' })
    }
  }

  const handlePin = async () => {
    const newPinned = !task.is_pinned
    updateTaskOptimistic(task.id, { is_pinned: newPinned })
    try {
      await taskService.updateTask(task.id, { is_pinned: newPinned })
    } catch {
      rollbackTask(task.id, task)
      toast({ title: 'Erro ao fixar tarefa', variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await taskService.deleteTask(task.id)
      removeTask(task.id)
    } catch {
      toast({ title: 'Erro ao remover tarefa', variant: 'destructive' })
      setIsDeleting(false)
    }
  }

  const isCompleted = task.status === 'completed'
  const priorityLabel = PRIORITY_LABEL[task.priority]

  return (
    <div
      className={cn(
        "group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 hover:bg-gray-50",
        (isDeleting || dimmed) && "opacity-40 pointer-events-none"
      )}
      data-testid={`task-item-${task.id}`}
    >
      <button
        onClick={handleToggle}
        data-testid={`task-toggle-${task.id}`}
        className={cn(
          "flex-shrink-0 w-5 h-5 rounded-full border-2 transition-all duration-150 flex items-center justify-center",
          isCompleted
            ? "bg-[#16A34A] border-[#16A34A]"
            : "border-gray-300 hover:border-gray-400"
        )}
      >
        {isCompleted && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0 flex items-center gap-2">
        <span className={cn(
          "text-sm transition-all duration-200 truncate",
          isCompleted ? "line-through text-gray-400" : "text-gray-800 font-medium"
        )}>
          {task.title}
        </span>

        {task.is_pinned && !isCompleted && (
          <Pin className="w-3 h-3 text-[#4A90E2] flex-shrink-0 fill-[#4A90E2]" />
        )}

        {priorityLabel && !isCompleted && (
          <span className={cn(
            "text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded flex-shrink-0",
            task.priority === 'critical' && "text-red-600 bg-red-50",
            task.priority === 'high' && "text-orange-600 bg-orange-50",
          )}>
            {priorityLabel}
          </span>
        )}
      </div>

      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button
          onClick={handlePin}
          className={cn(
            "p-1.5 rounded-lg transition-colors text-gray-300 hover:text-gray-500 hover:bg-gray-100",
            task.is_pinned && "text-[#4A90E2]"
          )}
          data-testid={`task-pin-${task.id}`}
          title={task.is_pinned ? "Desfixar" : "Fixar"}
        >
          <Pin className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleDelete}
          className="p-1.5 rounded-lg transition-colors text-gray-300 hover:text-red-500 hover:bg-red-50"
          data-testid={`task-delete-${task.id}`}
          title="Remover"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
