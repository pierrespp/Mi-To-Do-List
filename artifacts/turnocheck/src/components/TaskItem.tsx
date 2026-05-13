import React, { useState, useEffect } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Task } from '@/types'
import { taskService } from '@/services/taskService'
import { useTurnoStore } from '@/store/turnoStore'
import { Pin, PinOff, Trash2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface TaskItemProps {
  task: Task
}

export function TaskItem({ task }: TaskItemProps) {
  const { updateTaskOptimistic, rollbackTask, removeTask } = useTurnoStore()
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleToggle = async (checked: boolean) => {
    const newStatus = checked ? 'completed' : 'pending'
    updateTaskOptimistic(task.id, { status: newStatus })
    try {
      await taskService.updateTask(task.id, { status: newStatus })
      if (newStatus === 'completed') {
        toast({ title: 'Tarefa concluída' })
      }
    } catch (e) {
      rollbackTask(task.id, task)
      toast({ title: 'Erro ao atualizar tarefa', description: 'Tentar novamente.', variant: 'destructive' })
    }
  }

  const handlePin = async () => {
    const newPinned = !task.is_pinned
    updateTaskOptimistic(task.id, { is_pinned: newPinned })
    try {
      await taskService.updateTask(task.id, { is_pinned: newPinned })
    } catch (e) {
      rollbackTask(task.id, task)
      toast({ title: 'Erro ao fixar tarefa', variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await taskService.deleteTask(task.id)
      removeTask(task.id)
      toast({ title: 'Tarefa removida' })
    } catch (e) {
      toast({ title: 'Erro ao remover tarefa', variant: 'destructive' })
      setIsDeleting(false)
    }
  }

  const isCompleted = task.status === 'completed'

  return (
    <div 
      className={cn(
        "group flex items-center justify-between p-3 rounded-md transition-all duration-200 hover:bg-muted/50 border border-transparent hover:border-border",
        isCompleted && "opacity-60",
        isDeleting && "opacity-0 scale-95 pointer-events-none"
      )}
      data-testid={`task-item-${task.id}`}
    >
      <div className="flex items-center space-x-3 overflow-hidden">
        <Checkbox 
          checked={isCompleted} 
          onCheckedChange={handleToggle}
          className="transition-transform active:scale-90"
          data-testid={`task-toggle-${task.id}`}
        />
        <div className="flex items-center space-x-2 overflow-hidden">
          <span className={cn(
            "text-sm font-medium truncate transition-all duration-200",
            isCompleted ? "line-through text-muted-foreground" : "text-foreground"
          )}>
            {task.title}
          </span>
          {task.priority === 'critical' && !isCompleted && (
            <span className="flex items-center text-[10px] uppercase font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
              <AlertCircle className="w-3 h-3 mr-1" />
              Critical
            </span>
          )}
          {task.priority === 'high' && !isCompleted && (
            <span className="text-[10px] uppercase font-bold text-[#EA580C] bg-[#EA580C]/10 px-1.5 py-0.5 rounded">
              High
            </span>
          )}
          {task.priority === 'low' && !isCompleted && (
            <span className="text-[10px] uppercase font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              Low
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={handlePin} 
          className={cn("p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors", task.is_pinned && "opacity-100 text-primary")}
          data-testid={`task-pin-${task.id}`}
          title={task.is_pinned ? "Desfixar" : "Fixar"}
        >
          {task.is_pinned ? <Pin className="w-4 h-4 fill-current" /> : <Pin className="w-4 h-4" />}
        </button>
        <button 
          onClick={handleDelete}
          className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
          data-testid={`task-delete-${task.id}`}
          title="Remover"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
