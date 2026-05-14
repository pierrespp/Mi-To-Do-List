import React, { useState, memo } from 'react'
import { Task } from '@/types'
import { TaskItem } from './TaskItem'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'

interface CompletedSectionProps {
  tasks: Task[]
}

export const CompletedSection = memo(function CompletedSection({ tasks }: CompletedSectionProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <motion.div 
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.32 }}
      data-testid="completed-section"
    >
      <button
        onClick={() => setIsOpen(o => !o)}
        className="btn-text-sm flex items-center gap-1.5 text-gray-600 hover:text-gray-800 uppercase py-1"
        data-testid="completed-toggle"
        aria-label={isOpen ? "Ocultar tarefas concluídas" : "Mostrar tarefas concluídas"}
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
        <p className="text-sm text-gray-600 mt-2 ml-5">Nenhuma tarefa concluída ainda.</p>
      )}
    </motion.div>
  )
})
