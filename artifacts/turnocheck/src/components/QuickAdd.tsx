import React, { useState, useRef, useEffect } from 'react'
import { taskService } from '@/services/taskService'
import { useTurnoStore } from '@/store/turnoStore'
import { useToast } from '@/hooks/use-toast'
import { Task, Section } from '@/types'
import { Flag } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface GlobalQuickAddProps {
  sections: Section[]
}

const PRIORITY_OPTIONS: { value: Task['priority']; label: string; color: string }[] = [
  { value: 'critical', label: 'Crítico', color: 'text-red-500' },
  { value: 'high', label: 'Alto', color: 'text-orange-500' },
  { value: 'normal', label: 'Normal', color: 'text-gray-500' },
  { value: 'low', label: 'Baixo', color: 'text-gray-300' },
]

export function QuickAdd({ sections }: GlobalQuickAddProps) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<Task['priority']>('normal')
  const [sectionId, setSectionId] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { turno, addTask } = useTurnoStore()
  const { toast } = useToast()

  useEffect(() => {
    if (sections.length > 0 && !sectionId) {
      const regular = sections.find(s => !s.is_closing_section)
      setSectionId(regular?.id || sections[0].id)
    }
  }, [sections, sectionId])

  useEffect(() => {
    const handleSlash = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleSlash)
    return () => window.removeEventListener('keydown', handleSlash)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !turno || isSubmitting || !sectionId) return
    setIsSubmitting(true)
    try {
      const newTask = await taskService.createTask({
        title: title.trim(),
        turno_id: turno.id,
        section_id: sectionId,
        priority,
        status: 'pending',
        is_pinned: false,
      })
      addTask(newTask)
      setTitle('')
      setPriority('normal')
    } catch {
      toast({ title: 'Erro ao adicionar tarefa', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const currentPriority = PRIORITY_OPTIONS.find(p => p.value === priority)!
  const selectedSection = sections.find(s => s.id === sectionId)

  return (
    <div className="bg-white rounded-2xl shadow-sm">
      <form onSubmit={handleSubmit} className="flex items-center gap-2 px-4 py-3.5">
        <span className="text-gray-300 text-base font-light flex-shrink-0">+</span>
        <input
          ref={inputRef}
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Adicionar tarefa rápida..."
          className="flex-1 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none"
          disabled={isSubmitting}
          data-testid="quickadd-input"
        />

        {sections.length > 1 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="btn-text-sm text-gray-600 hover:text-gray-800 truncate max-w-[80px] flex-shrink-0"
                data-testid="quickadd-section-selector"
                aria-label={`Selecionar seção, atualmente: ${selectedSection?.name || 'Seção'}`}
              >
                {selectedSection?.name.split(' ')[0] || 'Seção'}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {sections.map(s => (
                <DropdownMenuItem key={s.id} onClick={() => setSectionId(s.id)}>
                  {s.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn("btn-icon-small flex-shrink-0", currentPriority.color)}
              data-testid="quickadd-priority"
              aria-label={`Prioridade atual: ${currentPriority.label}`}
            >
              <Flag className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {PRIORITY_OPTIONS.map(p => (
              <DropdownMenuItem
                key={p.value}
                onClick={() => setPriority(p.value)}
                className={p.color}
              >
                {p.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </form>

      <div className="px-4 pb-3 flex items-center gap-1.5">
        <span className="text-[11px] text-gray-600">Dica: Pressione</span>
        <kbd className="text-[10px] bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded font-mono">/</kbd>
        <span className="text-[11px] text-gray-600">para focar e</span>
        <kbd className="text-[10px] bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded font-mono">Enter</kbd>
        <span className="text-[11px] text-gray-600">para adicionar</span>
      </div>
    </div>
  )
}
