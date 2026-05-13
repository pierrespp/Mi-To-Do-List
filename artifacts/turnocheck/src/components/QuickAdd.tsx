import React, { useState } from 'react'
import { taskService } from '@/services/taskService'
import { useTurnoStore } from '@/store/turnoStore'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Plus, Flag } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Task } from '@/types'

interface QuickAddProps {
  sectionId: string
}

export function QuickAdd({ sectionId }: QuickAddProps) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<Task['priority']>('normal')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { turno, addTask } = useTurnoStore()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !turno || isSubmitting) return

    setIsSubmitting(true)
    try {
      const newTask = await taskService.createTask({
        title: title.trim(),
        turno_id: turno.id,
        section_id: sectionId,
        priority: priority,
        status: 'pending',
        is_pinned: false
      })
      addTask(newTask)
      setTitle('')
      setPriority('normal')
    } catch (err) {
      toast({ title: 'Erro ao adicionar tarefa', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getPriorityColor = (p: Task['priority']) => {
    switch (p) {
      case 'critical': return 'text-destructive'
      case 'high': return 'text-[#EA580C]'
      case 'normal': return 'text-foreground'
      case 'low': return 'text-muted-foreground'
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center space-x-2 border rounded-md px-2 bg-background focus-within:ring-1 focus-within:ring-ring">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Adicionar tarefa..."
        className="flex-1 bg-transparent border-none shadow-none focus-visible:ring-0 px-1 h-9 text-sm"
        disabled={isSubmitting}
        data-testid={`quickadd-input-${sectionId}`}
      />
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className={`h-7 w-7 p-0 ${getPriorityColor(priority)}`} disabled={isSubmitting}>
            <Flag className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setPriority('critical')} className="text-destructive font-medium">Critical</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setPriority('high')} className="text-[#EA580C] font-medium">High</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setPriority('normal')}>Normal</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setPriority('low')} className="text-muted-foreground">Low</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button 
        type="submit" 
        size="sm" 
        variant="ghost" 
        className="h-7 w-7 p-0"
        disabled={!title.trim() || isSubmitting}
        data-testid={`quickadd-submit-${sectionId}`}
      >
        <Plus className="w-4 h-4" />
      </Button>
    </form>
  )
}
