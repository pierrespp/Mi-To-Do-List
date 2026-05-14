import React, { useEffect, useState } from 'react'
import { useRoute } from 'wouter'
import { workspaceService } from '@/services/workspaceService'
import { useTurnoStore } from '@/store/turnoStore'
import { Header } from '@/components/Header'
import { TaskSection } from '@/components/TaskSection'
import { QuickAdd } from '@/components/QuickAdd'
import { CompletedSection } from '@/components/CompletedSection'
import { RecurringTasksModal } from '@/components/RecurringTasksModal'
import { RestartTurnoDialog } from '@/components/RestartTurnoDialog'
import { Loader2, Settings, RotateCcw } from 'lucide-react'

export default function WorkspacePage() {
  const [, params] = useRoute('/w/:slug')
  const slug = params?.slug || 'turno-noite'

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const {
    setWorkspace,
    setTurno,
    setSections,
    setTasks,
    setRecurringTasks,
    sections,
    tasks,
  } = useTurnoStore()

  useEffect(() => {
    const loadWorkspace = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const ws = await workspaceService.getOrCreateWorkspace(slug)
        setWorkspace(ws)

        const turno = await workspaceService.getActiveTurno(ws.id)
        setTurno(turno)

        const [secs, tsks, recTasks] = await Promise.all([
          workspaceService.getSections(ws.id),
          turno ? workspaceService.getTasks(turno.id) : Promise.resolve([]),
          workspaceService.getRecurringTasks(ws.id),
        ])

        setSections(secs)
        setTasks(tsks)
        setRecurringTasks(recTasks)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Erro ao carregar workspace'
        setError(msg)
      } finally {
        setIsLoading(false)
      }
    }

    if (slug) loadWorkspace()
  }, [slug])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EDEDE9]">
        <Loader2 className="w-7 h-7 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#EDEDE9]">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-sm">
          <p className="font-semibold text-gray-800">Erro ao carregar</p>
          <p className="text-sm text-gray-500 mt-1">{error}</p>
          <p className="text-xs text-gray-400 mt-3">Verifique se o schema do banco foi criado no Supabase.</p>
        </div>
      </div>
    )
  }

  const closingSections = sections.filter(s => s.is_closing_section)
  const regularSections = sections.filter(s => !s.is_closing_section)
  const completedTasks = tasks.filter(t => t.status === 'completed')

  let sectionIndex = 0

  return (
    <div className="min-h-screen bg-[#EDEDE9] flex flex-col" data-testid="workspace-page">
      <main className="max-w-xl mx-auto px-4 pt-5 pb-24 space-y-3 flex-1 w-full">
        <Header />

        {closingSections.map(section => (
          <TaskSection
            key={section.id}
            section={section}
            tasks={tasks.filter(t => t.section_id === section.id)}
            index={sectionIndex++}
          />
        ))}

        {regularSections.map(section => (
          <TaskSection
            key={section.id}
            section={section}
            tasks={tasks.filter(t => t.section_id === section.id)}
            index={sectionIndex++}
          />
        ))}

        <QuickAdd sections={sections} />

        <CompletedSection tasks={completedTasks} />
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-[#EDEDE9] border-t border-gray-200 z-40">
        <div className="max-w-2xl mx-auto px-5 py-3 flex items-center justify-center sm:justify-between w-full">
          <RecurringTasksModal
            trigger={
              <button
                className="btn-text-sm text-gray-700 hover:text-gray-900"
                data-testid="btn-recurring"
                aria-label="Gerenciar tarefas recorrentes"
              >
                <Settings className="w-4 h-4" />
                Gerenciar Recorrentes
              </button>
            }
          />
          <RestartTurnoDialog
            trigger={
              <button
                className="btn-footer flex items-center gap-2"
                data-testid="btn-restart"
                aria-label="Reiniciar turno"
              >
                <RotateCcw className="w-4 h-4" />
                Reiniciar Turno
              </button>
            }
          />
        </div>
      </footer>
    </div>
  )
}
