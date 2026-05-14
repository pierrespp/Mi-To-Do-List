import React, { useState, useEffect, memo } from 'react'
import { useTurnoStore } from '@/store/turnoStore'

export const Header = memo(function Header() {
  const { workspace, tasks } = useTurnoStore()
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const completedCount = tasks.filter(t => t.status === 'completed').length
  const totalCount = tasks.length
  const percentage = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100)
  const isAllDone = totalCount > 0 && completedCount === totalCount

  const dateStr = time.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })
  const formattedDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1)

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm" data-testid="app-header">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
            <img
              src={`${import.meta.env.BASE_URL}logo.png`}
              alt="Mi To do List"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">
              Mi To do List
            </h1>
            <p className="text-sm text-gray-400 leading-tight mt-0.5">
              {workspace?.name || 'Carregando...'}
            </p>
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          <p className="text-sm font-semibold text-gray-900">Turno Ativo</p>
          <p className="text-xs text-gray-600 mt-0.5">{formattedDate}</p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-colors duration-500"
            style={{
              width: `${percentage}%`,
              backgroundColor: isAllDone ? 'var(--color-completed)' : 'var(--color-progress)',
            }}
          />
        </div>
        <p className="text-xs text-gray-700">
          {isAllDone ? (
            <span className="font-medium" style={{ color: 'var(--color-completed)' }}>✓ Turno concluído! Todas as tarefas feitas.</span>
          ) : (
            <>
              <span className="font-semibold" style={{ color: 'var(--color-progress)' }}>{percentage}%</span>
              {' '}• {completedCount} de {totalCount} concluídas
            </>
          )}
        </p>
      </div>
    </div>
  )
})
