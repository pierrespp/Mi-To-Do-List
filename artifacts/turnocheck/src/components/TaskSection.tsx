import React, { memo } from 'react'
import { Section, Task } from '@/types'
import { TaskItem } from './TaskItem'
import { Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface TaskSectionProps {
  section: Section
  tasks: Task[]
  index: number
}

export const TaskSection = memo(function TaskSection({ section, tasks, index }: TaskSectionProps) {
  const pendingTasks = tasks.filter(t => t.status === 'pending')

  const sortedTasks = [...pendingTasks].sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1
    const priorityWeight = { critical: 4, high: 3, normal: 2, low: 1 }
    return priorityWeight[b.priority] - priorityWeight[a.priority]
  })

  const isClosing = section.is_closing_section

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.08 }}
      className={cn(
        "bg-white rounded-2xl shadow-sm overflow-hidden",
        isClosing && "ring-1 ring-red-200"
      )}
      data-testid={`section-${section.id}`}
    >
      <div className={cn(
        "px-5 pt-4 pb-2 flex items-center justify-between",
        isClosing && "border-b border-red-50"
      )}>
        <div className="flex items-center gap-1.5">
          {isClosing && <Lock className="w-3.5 h-3.5 text-red-500" />}
          <h2 className={cn(
            "text-xs font-bold tracking-widest uppercase",
            isClosing ? "text-red-500" : "text-gray-400"
          )}>
            {section.name}
          </h2>
        </div>
        <span className="text-xs text-gray-500 font-medium">
          {sortedTasks.length} pendente{sortedTasks.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="px-2 pb-2">
        {sortedTasks.length === 0 ? (
          <p className="text-sm text-gray-600 text-center py-5">
            Nenhuma tarefa pendente no momento.
          </p>
        ) : (
          <div>
            {sortedTasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
})
