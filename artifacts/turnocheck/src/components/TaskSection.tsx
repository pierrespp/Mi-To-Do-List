import React from 'react'
import { Section, Task } from '@/types'
import { TaskItem } from './TaskItem'
import { QuickAdd } from './QuickAdd'
import { Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface TaskSectionProps {
  section: Section
  tasks: Task[]
  index: number
}

export function TaskSection({ section, tasks, index }: TaskSectionProps) {
  // Sort tasks: pinned first, then by priority, then by completed
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'completed' ? 1 : -1
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1
    
    const priorityWeight = { critical: 4, high: 3, normal: 2, low: 1 }
    if (priorityWeight[a.priority] !== priorityWeight[b.priority]) {
      return priorityWeight[b.priority] - priorityWeight[a.priority]
    }
    
    return 0
  })

  const isClosing = section.is_closing_section

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className={cn(
        "rounded-lg border bg-card p-4 space-y-4 shadow-sm",
        isClosing ? "border-destructive/30 shadow-destructive/5" : "border-border"
      )} 
      data-testid={`section-${section.id}`}
    >
      <div className="flex items-center justify-between border-b pb-2">
        <div className="flex items-center space-x-2">
          {isClosing && <Lock className="w-4 h-4 text-destructive" />}
          <h2 className={cn(
            "font-semibold",
            isClosing ? "text-destructive" : "text-foreground"
          )}>
            {section.name}
          </h2>
        </div>
        <span className="text-xs text-muted-foreground font-medium">
          {tasks.filter(t => t.status === 'completed').length} / {tasks.length}
        </span>
      </div>

      <div className="space-y-1 min-h-[40px]">
        {sortedTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">
            Nenhuma tarefa nesta seção.
          </p>
        ) : (
          sortedTasks.map(task => (
            <TaskItem key={task.id} task={task} />
          ))
        )}
      </div>

      <div className="pt-2">
        <QuickAdd sectionId={section.id} />
      </div>
    </motion.div>
  )
}
