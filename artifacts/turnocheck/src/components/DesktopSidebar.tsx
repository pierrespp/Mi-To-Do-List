import React, { memo } from 'react'
import { Section, Task } from '@/types'
import { cn } from '@/lib/utils'

interface DesktopSidebarProps {
  sections: Section[]
  tasks: Task[]
  selectedSectionId: string | null
  onSelectSection: (sectionId: string | null) => void
}

const PRIORITY_COUNTS = {
  critical: (tasks: Task[]) => tasks.filter(t => t.status === 'pending' && t.priority === 'critical').length,
  normal: (tasks: Task[]) => tasks.filter(t => t.status === 'pending').length,
  completed: (tasks: Task[]) => tasks.filter(t => t.status === 'completed').length,
}

export const DesktopSidebar = memo(function DesktopSidebar({
  sections,
  tasks,
  selectedSectionId,
  onSelectSection,
}: DesktopSidebarProps) {
  const allTasks = tasks.filter(t => t.status === 'pending')
  const criticalCount = PRIORITY_COUNTS.critical(tasks)
  const completedCount = PRIORITY_COUNTS.completed(tasks)

  return (
    <aside className="w-56 bg-gray-50 border-r border-gray-200 flex flex-col overflow-hidden">
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest px-3 py-2 mb-2">
            Sections
          </div>
          <button
            onClick={() => onSelectSection(null)}
            className={cn(
              "w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              selectedSectionId === null
                ? "bg-blue-100 text-blue-900 font-semibold"
                : "text-gray-700 hover:bg-gray-100"
            )}
          >
            📋 All Tasks
          </button>
          {sections.map((section) => {
            const sectionTasks = tasks.filter(t => t.section_id === section.id && t.status === 'pending')
            const isSelected = selectedSectionId === section.id
            return (
              <button
                key={section.id}
                onClick={() => onSelectSection(section.id)}
                className={cn(
                  "w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-between",
                  isSelected
                    ? "bg-blue-100 text-blue-900 font-semibold"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <span>{section.name}</span>
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded",
                  isSelected ? "bg-blue-200" : "bg-gray-200"
                )}>
                  {sectionTasks.length}
                </span>
              </button>
            )
          })}
        </div>

        {/* Quick Stats */}
        <div className="border-t border-gray-200 pt-4">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest px-3 py-2 mb-3">
            Quick Stats
          </div>
          <div className="space-y-2">
            <div className="px-3 py-2.5 bg-white rounded-lg border border-gray-200">
              <div className="text-xs text-gray-500 mb-1">Total Tasks</div>
              <div className="text-2xl font-bold text-gray-900">{allTasks.length}</div>
            </div>
            <div className="px-3 py-2.5 bg-white rounded-lg border border-gray-200">
              <div className="text-xs text-gray-500 mb-1">Completed</div>
              <div className="text-2xl font-bold text-green-600">{completedCount}</div>
            </div>
            <div className="px-3 py-2.5 bg-white rounded-lg border border-gray-200">
              <div className="text-xs text-gray-500 mb-1">Critical</div>
              <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
            </div>
            {allTasks.length > 0 && (
              <div className="px-3 py-2.5 bg-white rounded-lg border border-gray-200">
                <div className="text-xs text-gray-500 mb-1">Progress</div>
                <div className="text-sm font-semibold text-blue-600">
                  {Math.round((completedCount / (completedCount + allTasks.length)) * 100)}%
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>
    </aside>
  )
})
