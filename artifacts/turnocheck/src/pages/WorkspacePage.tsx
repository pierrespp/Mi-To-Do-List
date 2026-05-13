import React, { useEffect, useState } from 'react'
import { useRoute } from 'wouter'
import { workspaceService } from '@/services/workspaceService'
import { useTurnoStore } from '@/store/turnoStore'
import { Header } from '@/components/Header'
import { TaskSection } from '@/components/TaskSection'
import { RecurringTasksModal } from '@/components/RecurringTasksModal'
import { RestartTurnoDialog } from '@/components/RestartTurnoDialog'
import { Loader2 } from 'lucide-react'

export default function WorkspacePage() {
  const [match, params] = useRoute('/w/:slug')
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
    tasks 
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
          workspaceService.getRecurringTasks(ws.id)
        ])

        setSections(secs)
        setTasks(tsks)
        setRecurringTasks(recTasks)

      } catch (err: any) {
        console.error("Error loading workspace", err)
        setError(err.message || 'Erro ao carregar workspace')
      } finally {
        setIsLoading(false)
      }
    }

    if (slug) {
      loadWorkspace()
    }
  }, [slug])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="bg-destructive/10 text-destructive p-4 rounded-md max-w-md w-full text-center border border-destructive/20">
          <p className="font-medium">Erro ao carregar</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    )
  }

  const closingSections = sections.filter(s => s.is_closing_section)
  const regularSections = sections.filter(s => !s.is_closing_section)
  let sectionIndex = 0;

  return (
    <div className="min-h-[100dvh] bg-background pb-20">
      <Header />
      
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
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

        {sections.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            Nenhuma seção configurada para este workspace.
          </div>
        )}
      </main>

      <div className="fixed bottom-4 left-0 right-0 flex justify-center gap-2 md:hidden pointer-events-none">
        <div className="pointer-events-auto flex gap-2 bg-card p-2 rounded-full border shadow-lg">
          <RecurringTasksModal />
          <RestartTurnoDialog />
        </div>
      </div>
    </div>
  )
}
