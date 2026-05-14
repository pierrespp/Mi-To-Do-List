import React from 'react'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface ProgressBarProps {
  completed: number
  total: number
}

export function ProgressBar({ completed, total }: ProgressBarProps) {
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100)
  const isComplete = total > 0 && completed === total

  return (
    <div className="w-full space-y-1.5" data-testid="progress-container">
      <div className="flex justify-between text-xs font-medium">
        <span className="text-muted-foreground">Progresso do turno</span>
        <span className={cn(
          "transition-colors",
          isComplete ? "text-[#16A34A]" : "text-foreground"
        )}>
          {completed} de {total} ({percentage}%)
        </span>
      </div>
      <Progress 
        value={percentage} 
        className={cn("h-2 transition-all", isComplete && "[&>div]:bg-[#16A34A]")}
      />
    </div>
  )
}
