import React, { useEffect, useState } from 'react'
import { useRoute } from 'wouter'
import { Loader2, Settings, RotateCcw } from 'lucide-react'

// Consolidated logic and components
import { 
  workspaceService, useTurnoStore 
} from '@/lib/logic'
import { 
  DesktopSidebar, TaskListView, TaskDetailPanel, QuickAdd, 
  RecurringTasksModal, RestartTurnoDialog, ThemeFAB 
} from '@/components/AppComponents'

export default function DesktopWorkspacePage() {
  const [, params] = useRoute('/w/:slug')
  const slug = params?.slug || 'turno-noite'

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const {
    setWorkspace, setTurno, setSections, setTasks, setRecurringTasks, setSelectedTaskId,
    workspace, sections, tasks, selectedTaskId,
  } = useTurnoStore()

  useEffect(() => {
    const loadWorkspace = async () => {
      setIsLoading(true); setError(null)
      try {
        const ws = await workspaceService.getOrCreateWorkspace(slug); setWorkspace(ws)
        const turno = await workspaceService.getActiveTurno(ws.id); setTurno(turno)
        const [secs, tsks, recTasks] = await Promise.all([
          workspaceService.getSections(ws.id),
          turno ? workspaceService.getTasks(turno.id) : Promise.resolve([]),
          workspaceService.getRecurringTasks(ws.id),
        ])
        setSections(secs); setTasks(tsks); setRecurringTasks(recTasks)
      } catch (err: any) { setError(err.message || 'Erro ao carregar workspace') } finally { setIsLoading(false) }
    }
    if (slug) loadWorkspace()
  }, [slug, setWorkspace, setTurno, setSections, setTasks, setRecurringTasks])

  const sectionsMap = sections.reduce((acc, s) => { acc[s.id] = s; return acc }, {} as any)
  const selectedTask = selectedTaskId ? tasks.find(t => t.id === selectedTaskId) : null
  const selectedSection = selectedTask && selectedTask.section_id ? sectionsMap[selectedTask.section_id] : null

  useEffect(() => { if (selectedTaskId && !tasks.find(t => t.id === selectedTaskId)) setSelectedTaskId(null) }, [tasks, selectedTaskId, setSelectedTaskId])

  if (isLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
  if (error) return <div className="h-screen flex items-center justify-center p-4"><div className="bg-white rounded-2xl p-6 text-center shadow-sm"><p className="font-semibold text-gray-800">Erro ao carregar</p><p className="text-sm text-gray-500 mt-1">{error}</p></div></div>

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden transition-colors duration-300">
      <header className="px-6 py-4 border-b border-border flex items-center justify-between flex-shrink-0 transition-colors duration-300">
        <div>
          <h1 className="text-2xl font-bold">Task Manager</h1>
          <p className="text-sm text-muted-foreground mt-1">{workspace?.name} • {new Date().toLocaleDateString('pt-BR')}</p>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <DesktopSidebar sections={sections} tasks={tasks} selectedSectionId={selectedSectionId} onSelectSection={setSelectedSectionId} />
        <TaskListView key={refreshKey} tasks={tasks} sections_map={sectionsMap} selectedTaskId={selectedTaskId} selectedSectionId={selectedSectionId} onSelectTask={setSelectedTaskId} />
        <TaskDetailPanel task={selectedTask || null} section={selectedSection || null} onTaskUpdated={() => setRefreshKey(k => k + 1)} />
      </div>

      <footer className="px-6 py-4 border-t border-border flex items-center justify-between gap-4 flex-shrink-0 transition-colors duration-300">
        <QuickAdd sections={sections} />
        <div className="flex items-center gap-2">
          <RecurringTasksModal trigger={<button className="btn-text-sm hover:opacity-80 flex items-center gap-2 transition-opacity"><Settings className="w-4 h-4" />Recurring</button>} />
          <RestartTurnoDialog trigger={<button className="btn-footer flex items-center gap-2"><RotateCcw className="w-4 h-4" />New Shift</button>} />
        </div>
      </footer>
      <ThemeFAB />
    </div>
  )
}
