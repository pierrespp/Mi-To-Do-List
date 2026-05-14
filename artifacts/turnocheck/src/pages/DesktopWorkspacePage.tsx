import React, { useEffect, useState } from 'react'
import { useRoute } from 'wouter'
import { workspaceService } from '@/services/workspaceService'
import { useTurnoStore } from '@/store/turnoStore'
import { DesktopSidebar } from '@/components/DesktopSidebar'
import { TaskListView } from '@/components/TaskListView'
import { TaskDetailPanel } from '@/components/TaskDetailPanel'
import { QuickAdd } from '@/components/QuickAdd'
import { RecurringTasksModal } from '@/components/RecurringTasksModal'
import { RestartTurnoDialog } from '@/components/RestartTurnoDialog'
import { Loader2, Settings, RotateCcw } from 'lucide-react'
import { ThemeFAB } from '@/components/ThemeFAB'

export default function DesktopWorkspacePage() {
  const [, params] = useRoute('/w/:slug')
  const slug = params?.slug || 'turno-noite'

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const {
    setWorkspace,
    setTurno,
    setSections,
    setTasks,
    setRecurringTasks,
    setSelectedTaskId,
    workspace,
    sections,
    tasks,
    selectedTaskId,
  } = useTurnoStore()

  useEffect(() => {
    const loadWorkspace = async () => {
      setIsLoading(true)
      setError(null)
      try {
        console.log("[Workspace] Carregando slug:", slug);
        const ws = await workspaceService.getOrCreateWorkspace(slug)
        console.log("[Workspace] Workspace carregado:", ws.id);
        setWorkspace(ws)

        console.log("[Workspace] Buscando turno ativo...");
        const turno = await workspaceService.getActiveTurno(ws.id)
        console.log("[Workspace] Turno carregado:", turno?.id || "Nenhum turno ativo");
        setTurno(turno)

        console.log("[Workspace] Buscando seções, tarefas e recorrentes...");
        const [secs, tsks, recTasks] = await Promise.all([
          workspaceService.getSections(ws.id),
          turno ? workspaceService.getTasks(turno.id) : Promise.resolve([]),
          workspaceService.getRecurringTasks(ws.id),
        ])
        console.log("[Workspace] Dados carregados:", { sections: secs.length, tasks: tsks.length });

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
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-sm">
          <p className="font-semibold text-gray-800">Erro ao carregar</p>
          <p className="text-sm text-gray-500 mt-1">{error}</p>
          <p className="text-xs text-gray-400 mt-3">Verifique se o schema do banco foi criado no Supabase.</p>
        </div>
      </div>
    )
  }

  // Create a map of sections for quick lookup
  const sectionsMap = sections.reduce((acc, s) => {
    acc[s.id] = s
    return acc
  }, {} as Record<string, typeof sections[0]>)

  // Get the selected task
  const selectedTask = selectedTaskId ? tasks.find(t => t.id === selectedTaskId) : null
  const selectedSection = selectedTask && selectedTask.section_id ? sectionsMap[selectedTask.section_id] : null

  // Handle task selection and clear if deleted
  useEffect(() => {
    if (selectedTaskId && !tasks.find(t => t.id === selectedTaskId)) {
      setSelectedTaskId(null)
    }
  }, [tasks, selectedTaskId, setSelectedTaskId])

  const handleTaskUpdated = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden" data-testid="desktop-workspace-page">
      {/* Header */}
      <header className="px-6 py-4 border-b border-gray-200 bg-white flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Task Manager</h1>
          <p className="text-sm text-gray-500 mt-1">
            {workspace?.name || 'Workspace'} • {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" aria-label="Notifications">
            🔔
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" aria-label="Search">
            🔍
          </button>
        </div>
      </header>

      {/* Main Content - 3 Column Layout */}
      <div className="flex flex-1 overflow-hidden">
        <DesktopSidebar
          sections={sections}
          tasks={tasks}
          selectedSectionId={selectedSectionId}
          onSelectSection={setSelectedSectionId}
        />
        <TaskListView
          key={refreshKey}
          tasks={tasks}
          sections={sections}
          sections_map={sectionsMap}
          selectedTaskId={selectedTaskId}
          selectedSectionId={selectedSectionId}
          onSelectTask={setSelectedTaskId}
        />
        <TaskDetailPanel
          task={selectedTask || null}
          section={selectedSection || null}
          sections={sections}
          onTaskUpdated={handleTaskUpdated}
        />
      </div>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-gray-200 bg-white flex items-center justify-between gap-4 flex-shrink-0">
        <QuickAdd
          sections={sections}
        />
        <div className="flex items-center gap-2">
          <RecurringTasksModal
            trigger={
              <button
                className="btn-text-sm text-gray-700 hover:text-gray-900 flex items-center gap-2"
                data-testid="btn-recurring"
                aria-label="Gerenciar tarefas recorrentes"
              >
                <Settings className="w-4 h-4" />
                Recurring
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
                New Shift
              </button>
            }
          />
        </div>
      </footer>
      <ThemeFAB />
    </div>
  )
}
