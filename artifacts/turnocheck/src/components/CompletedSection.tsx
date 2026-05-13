import React, { useState } from 'react'
import { Task } from '@/types'
import { TaskItem } from './TaskItem'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface CompletedSectionProps {
  tasks: Task[]
}

export function CompletedSection({ tasks }: CompletedSectionProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div data-testid="completed-section">
      <button
        onClick={() => setIsOpen(o => !o)}
        className="flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase text-gray-400 hover:text-gray-600 transition-colors py-1"
        data-testid="completed-toggle"
      >
        {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        Concluídas hoje ({tasks.length})
      </button>

      {isOpen && tasks.length > 0 && (
        <div className="mt-2 bg-white rounded-2xl shadow-sm px-2 py-1">
          {tasks.map(task => (
            <TaskItem key={task.id} task={task} dimmed />
          ))}
        </div>
      )}

      {isOpen && tasks.length === 0 && (
        <p className="text-sm text-gray-400 mt-2 ml-5">Nenhuma tarefa concluída ainda.</p>
      )}
    </div>
  )
}
