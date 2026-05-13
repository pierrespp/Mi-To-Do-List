import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RefreshCcw } from 'lucide-react'
import { turnoService } from '@/services/turnoService'
import { useTurnoStore } from '@/store/turnoStore'
import { useToast } from '@/hooks/use-toast'

export function RestartTurnoDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [isRestarting, setIsRestarting] = useState(false)
  const { workspace, turno, setTurno, setTasks } = useTurnoStore()
  const { toast } = useToast()

  const handleRestart = async () => {
    if (!workspace || !turno) return
    setIsRestarting(true)
    try {
      const { turno: newTurno, tasks: newTasks } = await turnoService.restartTurno(workspace.id, turno.id)
      setTurno(newTurno)
      setTasks(newTasks)
      toast({ title: 'Turno reiniciado com sucesso', description: 'Novas tarefas carregadas.' })
      setIsOpen(false)
    } catch (e) {
      toast({ title: 'Erro ao reiniciar turno', variant: 'destructive' })
    } finally {
      setIsRestarting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8" data-testid="btn-restart-turno">
          <RefreshCcw className="w-4 h-4 mr-2" />
          Reiniciar Turno
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reiniciar Turno?</DialogTitle>
          <DialogDescription>
            Isso irá arquivar o turno atual e criar um novo, carregando as tarefas recorrentes. Tem certeza?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setIsOpen(false)} disabled={isRestarting}>Cancelar</Button>
          <Button onClick={handleRestart} disabled={isRestarting} data-testid="btn-confirm-restart">
            {isRestarting ? 'Reiniciando...' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
