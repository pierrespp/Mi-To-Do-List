import React, { useState } from 'react'
import { useTurnoStore } from '@/store/turnoStore'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Settings, Plus, Trash2 } from 'lucide-react'
import { workspaceService } from '@/services/workspaceService'
import { useToast } from '@/hooks/use-toast'
import { Switch } from '@/components/ui/switch'
import { Task } from '@/types'

interface RecurringTasksModalProps {
  trigger?: React.ReactNode
}

export function RecurringTasksModal({ trigger }: RecurringTasksModalProps = {}) {
  const { workspace, sections, recurringTasks, setRecurringTasks } = useTurnoStore()
  const { toast } = useToast()
  
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<Task['priority']>('normal')
  const [recurrence, setRecurrence] = useState<'daily'|'weekly'|'custom'>('daily')
  const [sectionId, setSectionId] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !workspace || !sectionId) return

    setIsSubmitting(true)
    try {
      const newTask = await workspaceService.createRecurringTask({
        workspace_id: workspace.id,
        section_id: sectionId,
        title: title.trim(),
        priority,
        recurrence_type: recurrence,
        is_active: true
      })
      setRecurringTasks([...recurringTasks, newTask])
      setTitle('')
      toast({ title: 'Tarefa recorrente adicionada' })
    } catch (err) {
      toast({ title: 'Erro ao adicionar', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await workspaceService.deleteRecurringTask(id)
      setRecurringTasks(recurringTasks.filter(rt => rt.id !== id))
      toast({ title: 'Tarefa removida' })
    } catch (err) {
      toast({ title: 'Erro ao remover', variant: 'destructive' })
    }
  }

  const handleToggle = async (id: string, current: boolean) => {
    try {
      // Optimistic
      setRecurringTasks(recurringTasks.map(rt => rt.id === id ? { ...rt, is_active: !current } : rt))
      await workspaceService.toggleRecurringTask(id, !current)
    } catch (err) {
      // Revert
      setRecurringTasks(recurringTasks.map(rt => rt.id === id ? { ...rt, is_active: current } : rt))
      toast({ title: 'Erro ao alterar status', variant: 'destructive' })
    }
  }
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="h-8" data-testid="btn-recurring-tasks">
            <Settings className="w-4 h-4 mr-2" />
            Recorrentes
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Tarefas Recorrentes</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-2">
          {recurringTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma tarefa recorrente configurada.</p>
          ) : (
            <ul className="space-y-2">
              {recurringTasks.map(rt => (
                <li key={rt.id} className="text-sm p-3 border rounded-md bg-card flex justify-between items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{rt.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {rt.priority} • {rt.recurrence_type}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Ativa</span>
                      <Switch 
                        checked={rt.is_active} 
                        onCheckedChange={() => handleToggle(rt.id, rt.is_active)} 
                        data-testid={`toggle-rt-${rt.id}`}
                      />
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(rt.id)} data-testid={`delete-rt-${rt.id}`}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t pt-4 mt-2">
          <h4 className="text-sm font-semibold mb-3">Nova Tarefa Recorrente</h4>
          <form onSubmit={handleAdd} className="space-y-3">
            <Input 
              placeholder="Título da tarefa..." 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              disabled={isSubmitting}
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <Select value={sectionId} onValueChange={setSectionId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a seção" />
                </SelectTrigger>
                <SelectContent>
                  {sections.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-3">
              <Select value={recurrence} onValueChange={(v: any) => setRecurrence(v)}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Recorrência" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diária</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="custom">Personalizada</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" disabled={isSubmitting || !title.trim() || !sectionId} className="w-24">
                {isSubmitting ? 'Adicionando' : 'Adicionar'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
