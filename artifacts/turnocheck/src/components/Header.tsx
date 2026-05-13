import React, { useState, useEffect } from 'react'
import { useTurnoStore } from '@/store/turnoStore'
import { ProgressBar } from './ProgressBar'
import { RecurringTasksModal } from './RecurringTasksModal'
import { RestartTurnoDialog } from './RestartTurnoDialog'

export function Header() {
  const { workspace, tasks } = useTurnoStore()
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const completedCount = tasks.filter(t => t.status === 'completed').length
  const totalCount = tasks.length
  const isAllDone = totalCount > 0 && completedCount === totalCount

  return (
    <header className="bg-card border-b sticky top-0 z-10 shadow-sm" data-testid="app-header">
      <div className="max-w-3xl mx-auto px-4 py-4 md:py-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              🌙 TurnoCheck — {workspace?.name || 'Carregando...'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {time.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })} •{' '}
              {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className="flex gap-2 hidden md:flex">
            <RecurringTasksModal />
            <RestartTurnoDialog />
          </div>
        </div>

        <ProgressBar completed={completedCount} total={totalCount} />

        {isAllDone && (
          <div className="bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/20 p-3 rounded-md text-sm font-medium flex items-center justify-center animate-in fade-in slide-in-from-top-2">
            ✓ Turno concluído! Todas as tarefas feitas.
          </div>
        )}
      </div>
    </header>
  )
}
