import React, { useState, useEffect, memo, useRef } from 'react'
import { motion } from 'framer-motion'
import { 
  Pin, Trash2, ChevronDown, ChevronRight, Lock, 
  Settings, Plus, RefreshCcw, ArrowLeftRight, 
  Flag, RotateCcw
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Logic imports from our consolidated file
import { 
  useTurnoStore, taskService, turnoService, workspaceService, 
  useTheme, useToast, type Task, type Section, type Theme 
} from '@/lib/logic'

// UI Components from shadcn
import { Progress } from '@/components/ui/progress'
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

// ==========================================
// 1. PROGRESS BAR
// ==========================================
export function ProgressBar({ completed, total }: { completed: number; total: number }) {
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100)
  const isComplete = total > 0 && completed === total
  return (
    <div className="w-full space-y-1.5">
      <div className="flex justify-between text-xs font-medium">
        <span className="text-muted-foreground">Progresso do turno</span>
        <span className={cn("transition-colors", isComplete ? "text-[#16A34A]" : "text-foreground")}>
          {completed} de {total} ({percentage}%)
        </span>
      </div>
      <Progress value={percentage} className={cn("h-2 transition-all", isComplete && "[&>div]:bg-[#16A34A]")} />
    </div>
  )
}

// ==========================================
// 2. HEADER
// ==========================================
export const Header = memo(function Header() {
  const { workspace, tasks } = useTurnoStore()
  const { theme } = useTheme()
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

  const headerClasses = theme === 'kawaii' 
    ? 'bg-gradient-to-br from-white to-pink-50/30' 
    : 'bg-gradient-to-br from-white to-amber-50/20'

  return (
    <div className={cn("rounded-2xl p-5 shadow-sm transition-all duration-300", headerClasses)}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Mi To do List" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground leading-tight">Mi To do List</h1>
            <p className="text-sm text-muted-foreground leading-tight mt-0.5">{workspace?.name || 'Carregando...'}</p>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-semibold text-foreground">Turno Ativo</p>
          <p className="text-xs text-muted-foreground mt-0.5">{formattedDate}</p>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-colors duration-500" style={{ width: `${percentage}%`, backgroundColor: isAllDone ? 'var(--color-completed)' : 'var(--color-progress)' }} />
        </div>
        <p className="text-xs text-foreground/80">
          {isAllDone ? (
            <span className="font-medium" style={{ color: 'var(--color-completed)' }}>✓ Turno concluído! Todas as tarefas feitas.</span>
          ) : (
            <><span className="font-semibold" style={{ color: 'var(--color-progress)' }}>{percentage}%</span> • {completedCount} de {totalCount} concluídas</>
          )}
        </p>
      </div>
    </div>
  )
})

// ==========================================
// 3. TASK ITEM
// ==========================================
export const TaskItem = memo(function TaskItem({ task, dimmed = false }: { task: Task; dimmed?: boolean }) {
  const { updateTaskOptimistic, rollbackTask, removeTask } = useTurnoStore()
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)
  const isCompleted = task.status === 'completed'

  const handleToggle = async () => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed'
    updateTaskOptimistic(task.id, { status: newStatus })
    try { await taskService.updateTask(task.id, { status: newStatus }) } catch { rollbackTask(task.id, task); toast({ title: 'Erro ao atualizar tarefa', variant: 'destructive' }) }
  }
  const handlePin = async () => {
    const newPinned = !task.is_pinned
    updateTaskOptimistic(task.id, { is_pinned: newPinned })
    try { await taskService.updateTask(task.id, { is_pinned: newPinned }) } catch { rollbackTask(task.id, task); toast({ title: 'Erro ao fixar tarefa', variant: 'destructive' }) }
  }
  const handleDelete = async () => {
    setIsDeleting(true)
    try { await taskService.deleteTask(task.id); removeTask(task.id) } catch { toast({ title: 'Erro ao remover tarefa', variant: 'destructive' }); setIsDeleting(false) }
  }

  return (
    <div className={cn("group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 hover:bg-muted/50", (isDeleting || dimmed) && "opacity-40 pointer-events-none")}>
      <button onClick={handleToggle} className={cn("checkbox-task transition-colors", isCompleted ? "bg-[var(--color-completed)] border-[var(--color-completed)]" : "border-border hover:border-foreground/50")}>
        {isCompleted && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
      </button>
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <span className={cn("text-sm truncate", isCompleted ? "line-through text-muted-foreground" : "text-foreground font-medium")}>{task.title}</span>
        {task.is_pinned && !isCompleted && <Pin className="w-3 h-3 fill-[var(--color-progress)]" style={{ color: 'var(--color-progress)' }} />}
        {!isCompleted && (task.priority === 'critical' || task.priority === 'high') && (
          <span className={cn("text-[10px] font-bold uppercase px-1.5 py-0.5 rounded transition-colors", task.priority === 'critical' ? "text-destructive bg-destructive/10" : "text-orange-600 bg-orange-50/80")}>
            {task.priority === 'critical' ? 'Crítico' : 'Alto'}
          </span>
        )}
      </div>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={handlePin} className="btn-icon-small text-muted-foreground hover:text-foreground transition-colors" style={task.is_pinned ? { color: 'var(--color-progress)' } : undefined}><Pin className="w-3.5 h-3.5" /></button>
        <button onClick={handleDelete} className="btn-icon-small text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  )
})

// ==========================================
// 4. TASK SECTION
// ==========================================
export const TaskSection = memo(function TaskSection({ section, tasks, index }: { section: Section; tasks: Task[]; index: number }) {
  const pendingTasks = tasks.filter(t => t.status === 'pending')
  const sortedTasks = [...pendingTasks].sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1
    const p = { critical: 4, high: 3, normal: 2, low: 1 }; return p[b.priority] - p[a.priority]
  })
  const isClosing = section.is_closing_section
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: index * 0.08 }} className={cn("bg-card rounded-2xl shadow-sm overflow-hidden border border-card-border transition-colors duration-300", isClosing && "ring-1 ring-destructive/20")}>
      <div className={cn("px-5 pt-4 pb-2 flex items-center justify-between", isClosing && "border-b border-destructive/10")}>
        <div className="flex items-center gap-1.5">
          {isClosing && <Lock className="w-3.5 h-3.5 text-destructive" />}
          <h2 className={cn("text-xs font-bold tracking-widest uppercase", isClosing ? "text-destructive" : "text-muted-foreground")}>{section.name}</h2>
        </div>
        <span className="text-xs text-muted-foreground font-medium">{sortedTasks.length} pendente{sortedTasks.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="px-2 pb-2">
        {sortedTasks.length === 0 ? <p className="text-sm text-muted-foreground text-center py-5">Nenhuma tarefa pendente.</p> : sortedTasks.map(t => <TaskItem key={t.id} task={t} />)}
      </div>
    </motion.div>
  )
})

// ==========================================
// 5. COMPLETED SECTION
// ==========================================
export const CompletedSection = memo(function CompletedSection({ tasks }: { tasks: Task[] }) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.32 }}>
      <button onClick={() => setIsOpen(o => !o)} className="btn-text-sm flex items-center gap-1.5 text-muted-foreground uppercase py-1 hover:text-foreground transition-colors">
        {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        Concluídas hoje ({tasks.length})
      </button>
      {isOpen && (tasks.length > 0 ? <div className="mt-2 bg-card rounded-2xl shadow-sm border border-card-border px-2 py-1 transition-colors duration-300">{tasks.map(t => <TaskItem key={t.id} task={t} dimmed />)}</div> : <p className="text-sm text-muted-foreground mt-2 ml-5">Nenhuma tarefa concluída.</p>)}
    </motion.div>
  )
})

// ==========================================
// 6. QUICK ADD
// ==========================================
export function QuickAdd({ sections }: { sections: Section[] }) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<Task['priority']>('normal')
  const [sectionId, setSectionId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { turno, addTask } = useTurnoStore()
  const { toast } = useToast()

  useEffect(() => { if (sections.length > 0 && !sectionId) setSectionId(sections.find(s => !s.is_closing_section)?.id || sections[0].id) }, [sections, sectionId])
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === '/' && !['INPUT','TEXTAREA'].includes(document.activeElement?.tagName||'')) { e.preventDefault(); inputRef.current?.focus() } }
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!title.trim() || !turno || isSubmitting || !sectionId) return
    setIsSubmitting(true)
    try { const t = await taskService.createTask({ title: title.trim(), turno_id: turno.id, section_id: sectionId, priority, status: 'pending', is_pinned: false }); addTask(t); setTitle(''); setPriority('normal') } catch { toast({ title: 'Erro ao adicionar tarefa', variant: 'destructive' }) } finally { setIsSubmitting(false) }
  }

  const PRIO = { critical: 'text-destructive', high: 'text-orange-600', normal: 'text-muted-foreground', low: 'text-muted-foreground/50' }
  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border transition-colors duration-300">
      <form onSubmit={handleSubmit} className="flex items-center gap-2 px-4 py-3.5">
        <span className="text-muted-foreground/50 text-base font-light">+</span>
        <input ref={inputRef} value={title} onChange={e => setTitle(e.target.value)} placeholder="Adicionar tarefa rápida..." className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground/50" disabled={isSubmitting} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild><button type="button" className="text-xs text-muted-foreground hover:text-foreground truncate max-w-[80px] transition-colors">{sections.find(s => s.id === sectionId)?.name.split(' ')[0] || 'Seção'}</button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">{sections.map(s => <DropdownMenuItem key={s.id} onClick={() => setSectionId(s.id)}>{s.name}</DropdownMenuItem>)}</DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><button type="button" className={cn("btn-icon-small transition-colors", PRIO[priority])}><Flag className="w-4 h-4" /></button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">{Object.keys(PRIO).map((p: any) => <DropdownMenuItem key={p} onClick={() => setPriority(p)} className={PRIO[p as keyof typeof PRIO]}>{p}</DropdownMenuItem>)}</DropdownMenuContent>
        </DropdownMenu>
      </form>
    </div>
  )
}

// ==========================================
// 7. RECURRING TASKS MODAL
// ==========================================
export function RecurringTasksModal({ trigger }: { trigger?: React.ReactNode }) {
  const { workspace, sections, recurringTasks, setRecurringTasks } = useTurnoStore()
  const { toast } = useToast()
  const [title, setTitle] = useState(''), [priority, setPriority] = useState<Task['priority']>('normal'), [recurrence, setRecurrence] = useState<'daily'|'weekly'|'custom'>('daily'), [sectionId, setSectionId] = useState(''), [isSubmitting, setIsSubmitting] = useState(false)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); if (!title.trim() || !workspace || !sectionId) return
    setIsSubmitting(true); try { const t = await workspaceService.createRecurringTask({ workspace_id: workspace.id, section_id: sectionId, title: title.trim(), priority, recurrence_type: recurrence, is_active: true }); setRecurringTasks([...recurringTasks, t]); setTitle(''); toast({ title: 'Tarefa recorrente adicionada' }) } catch { toast({ title: 'Erro ao adicionar', variant: 'destructive' }) } finally { setIsSubmitting(false) }
  }
  const handleDelete = async (id: string) => { try { await workspaceService.deleteRecurringTask(id); setRecurringTasks(recurringTasks.filter(rt => rt.id !== id)) } catch { toast({ title: 'Erro ao remover', variant: 'destructive' }) } }
  const handleToggle = async (id: string, current: boolean) => {
    try { setRecurringTasks(recurringTasks.map(rt => rt.id === id ? { ...rt, is_active: !current } : rt)); await workspaceService.toggleRecurringTask(id, !current) } catch { setRecurringTasks(recurringTasks.map(rt => rt.id === id ? { ...rt, is_active: current } : rt)); toast({ title: 'Erro ao alterar status', variant: 'destructive' }) }
  }
  
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger ?? <Button variant="outline" size="sm">Recorrentes</Button>}</DialogTrigger>
      <DialogContent className="max-w-xl max-h-[80vh] flex flex-col">
        <DialogHeader><DialogTitle>Tarefas Recorrentes</DialogTitle></DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-4 py-4">{recurringTasks.length === 0 ? <p className="text-sm text-center">Nenhuma tarefa configurada.</p> : <ul className="space-y-2">{recurringTasks.map(rt => <li key={rt.id} className="text-sm p-3 border rounded-md flex justify-between items-center"><div><p className="font-medium">{rt.title}</p><p className="text-xs text-muted-foreground">{rt.priority} • {rt.recurrence_type}</p></div><div className="flex items-center gap-3"><Switch checked={rt.is_active} onCheckedChange={() => handleToggle(rt.id, rt.is_active)} /><Button variant="ghost" size="icon" onClick={() => handleDelete(rt.id)}><Trash2 className="w-4 h-4" /></Button></div></li>)}</ul>}</div>
        <form onSubmit={handleAdd} className="border-t pt-4 space-y-3">
          <Input placeholder="Título..." value={title} onChange={e => setTitle(e.target.value)} required />
          <div className="grid grid-cols-2 gap-3">
            <Select value={sectionId} onValueChange={setSectionId} required><SelectTrigger><SelectValue placeholder="Seção" /></SelectTrigger><SelectContent>{sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select>
            <Select value={priority} onValueChange={(v: any) => setPriority(v)}><SelectTrigger><SelectValue placeholder="Prio" /></SelectTrigger><SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="normal">Normal</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="critical">Critical</SelectItem></SelectContent></Select>
          </div>
          <div className="flex gap-3"><Select value={recurrence} onValueChange={(v: any) => setRecurrence(v)}><SelectTrigger className="flex-1"><SelectValue placeholder="Recorrência" /></SelectTrigger><SelectContent><SelectItem value="daily">Diária</SelectItem><SelectItem value="weekly">Semanal</SelectItem><SelectItem value="custom">Custom</SelectItem></SelectContent></Select><Button type="submit" disabled={isSubmitting}>Add</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ==========================================
// 8. RESTART TURNO DIALOG
// ==========================================
export function RestartTurnoDialog({ trigger }: { trigger?: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false), [isRestarting, setIsRestarting] = useState(false)
  const { workspace, turno, setTurno, setTasks } = useTurnoStore(), { toast } = useToast()
  const handleRestart = async () => {
    if (!workspace || !turno) return; setIsRestarting(true)
    try { const { turno: nt, tasks: nts } = await turnoService.restartTurno(workspace.id, turno.id); setTurno(nt); setTasks(nts); setIsOpen(false) } catch { toast({ title: 'Erro ao reiniciar', variant: 'destructive' }) } finally { setIsRestarting(false) }
  }
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger ?? <Button variant="outline" size="sm"><RefreshCcw className="w-4 h-4 mr-2" />Reiniciar</Button>}</DialogTrigger>
      <DialogContent><DialogHeader><DialogTitle>Reiniciar Turno?</DialogTitle><DialogDescription>Isso arquivará o atual e criará um novo. Tem certeza?</DialogDescription></DialogHeader><DialogFooter><Button variant="ghost" onClick={() => setIsOpen(false)}>Cancelar</Button><Button onClick={handleRestart} disabled={isRestarting}>{isRestarting ? 'Reiniciando...' : 'Confirmar'}</Button></DialogFooter></DialogContent>
    </Dialog>
  )
}

// ==========================================
// 9. THEME FAB
// ==========================================
export function ThemeFAB() {
  const { theme, toggle, themes } = useTheme()
  const next: Theme = theme === 'kawaii' ? 'spatial' : 'kawaii'
  
  const bgClasses = theme === 'kawaii'
    ? 'bg-gradient-to-r from-pink-100/90 to-purple-100/90 border-pink-200/50 shadow-lg shadow-pink-200/50'
    : 'bg-gradient-to-r from-amber-100/90 to-amber-50/90 border-amber-200/50 shadow-lg shadow-amber-100/50'
  
  return (
    <motion.button 
      id="theme-fab" 
      onClick={toggle} 
      className={cn("fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full px-4 py-3 backdrop-blur-md border transition-all duration-300", bgClasses)}
      whileHover={{ scale: 1.08 }} 
      whileTap={{ scale: 0.95 }}
    >
      <motion.span 
        key={theme} 
        initial={{ rotate: -20, opacity: 0, scale: 0.5 }} 
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        exit={{ rotate: 20, opacity: 0, scale: 0.5 }}
        transition={{ duration: 0.3 }}
      >
        {themes[next].emoji}
      </motion.span>
      <span className="text-xs font-bold uppercase text-foreground">{themes[next].label}</span>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <ArrowLeftRight size={14} className="text-foreground/60" />
      </motion.div>
    </motion.button>
  )
}

// ==========================================
// 10. DESKTOP SIDEBAR
// ==========================================
export const DesktopSidebar = memo(function DesktopSidebar({ sections, tasks, selectedSectionId, onSelectSection }: { sections: Section[]; tasks: Task[]; selectedSectionId: string | null; onSelectSection: (id: string | null) => void }) {
  const { theme } = useTheme()
  const pending = tasks.filter(t => t.status === 'pending')
  const completedCount = tasks.filter(t => t.status === 'completed').length
  const criticalCount = tasks.filter(t => t.status === 'pending' && t.priority === 'critical').length
  
  const sidebarBg = theme === 'kawaii' ? 'bg-sidebar' : 'bg-sidebar'
  const activeBg = theme === 'kawaii' ? 'bg-pink-200/50 text-pink-900' : 'bg-amber-200/40 text-amber-900'
  
  return (
    <aside className={cn("w-56 border-r flex flex-col p-4 space-y-4 transition-colors duration-300", sidebarBg, "bg-sidebar border-sidebar-border")}>
      <div>
        <div className="text-xs font-bold text-sidebar-foreground/50 uppercase tracking-widest px-3 py-2">Sections</div>
        <button onClick={() => onSelectSection(null)} className={cn("w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors", selectedSectionId === null ? cn(activeBg, "font-semibold") : "text-sidebar-foreground hover:bg-sidebar-accent")}>📋 All Tasks</button>
        {sections.map(s => <button key={s.id} onClick={() => onSelectSection(s.id)} className={cn("w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center justify-between", selectedSectionId === s.id ? cn(activeBg, "font-semibold") : "text-sidebar-foreground hover:bg-sidebar-accent")}><span>{s.name}</span><span className="text-xs bg-sidebar-accent/60 text-sidebar-accent-foreground px-2 py-0.5 rounded">{tasks.filter(t => t.section_id === s.id && t.status === 'pending').length}</span></button>)}
      </div>
      <div className="border-t border-sidebar-border pt-4"><div className="text-xs font-bold text-sidebar-foreground/50 uppercase tracking-widest px-3 py-2">Stats</div>
        <div className="space-y-2">
          <div className="px-3 py-2 bg-card rounded-lg border border-card-border"><div className="text-xs text-muted-foreground">Total</div><div className="text-xl font-bold text-foreground">{pending.length}</div></div>
          <div className="px-3 py-2 bg-card rounded-lg border border-card-border"><div className="text-xs text-muted-foreground">Done</div><div className="text-xl font-bold" style={{ color: 'var(--color-completed)' }}>{completedCount}</div></div>
          <div className="px-3 py-2 bg-card rounded-lg border border-card-border"><div className="text-xs text-muted-foreground">Critical</div><div className="text-xl font-bold" style={{ color: 'var(--color-critical)' }}>{criticalCount}</div></div>
        </div>
      </div>
    </aside>
  )
})

// ==========================================
// 11. TASK LIST VIEW (DESKTOP)
// ==========================================
export const TaskListView = memo(function TaskListView({ tasks, sections_map, selectedTaskId, selectedSectionId, onSelectTask }: { tasks: Task[]; sections_map: Record<string, Section>; selectedTaskId: string | null; selectedSectionId: string | null; onSelectTask: (id: string) => void }) {
  const { theme } = useTheme()
  const { updateTaskOptimistic, rollbackTask, removeTask } = useTurnoStore(), { toast } = useToast()
  const filtered = selectedSectionId ? tasks.filter(t => t.section_id === selectedSectionId && t.status === 'pending') : tasks.filter(t => t.status === 'pending')
  const sorted = [...filtered].sort((a, b) => { if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1; const p = { critical: 0, high: 1, normal: 2, low: 3 }; return p[a.priority] - p[b.priority] })

  const COLORS = theme === 'kawaii'
    ? { critical: 'bg-red-50 border-l-4 border-red-400', high: 'bg-orange-50 border-l-4 border-orange-400', normal: 'bg-pink-50/50 border-l-4 border-pink-300', low: 'bg-purple-50/50 border-l-4 border-purple-300' }
    : { critical: 'bg-red-50 border-l-4 border-red-600', high: 'bg-amber-50 border-l-4 border-amber-600', normal: 'bg-amber-50/40 border-l-4 border-amber-400', low: 'bg-green-50/30 border-l-4 border-green-400' }
  
  return (
    <main className="flex-1 flex flex-col border-r border-border bg-card overflow-hidden transition-colors duration-300">
      <div className="px-6 py-4 border-b border-border bg-secondary font-semibold text-sm text-secondary-foreground">{selectedSectionId ? sections_map[selectedSectionId]?.name : 'All Tasks'} ({sorted.length})</div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {sorted.length === 0 ? <p className="text-muted-foreground text-sm text-center py-6">No tasks here</p> : sorted.map(t => (
          <button key={t.id} onClick={() => onSelectTask(t.id)} className={cn("w-full text-left p-4 border-2 rounded-lg transition-all", COLORS[t.priority], selectedTaskId === t.id ? "ring-2 ring-primary shadow-md" : "border-transparent hover:border-border")}>
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1"><p className="text-sm font-medium truncate text-foreground">{t.title}</p>{t.is_pinned && <Pin className="w-3 h-3 fill-primary text-primary" />}</div>
                <div className="text-xs text-muted-foreground">{sections_map[t.section_id||'']?.name}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </main>
  )
})

// ==========================================
// 12. TASK DETAIL PANEL (DESKTOP)
// ==========================================
export const TaskDetailPanel = memo(function TaskDetailPanel({ task, section, onTaskUpdated }: { task: Task | null; section: Section | null; onTaskUpdated: () => void }) {
  const { updateTaskOptimistic, rollbackTask, removeTask } = useTurnoStore(), { toast } = useToast()
  if (!task) return <aside className="w-72 bg-secondary border-l border-border p-6 flex items-center justify-center text-sm text-muted-foreground transition-colors duration-300">Select a task</aside>
  const handleToggle = async () => { const s = task.status === 'completed' ? 'pending' : 'completed'; updateTaskOptimistic(task.id, { status: s }); try { await taskService.updateTask(task.id, { status: s }); onTaskUpdated() } catch { rollbackTask(task.id, task); toast({ title: 'Erro', variant: 'destructive' }) } }
  const handlePin = async () => { const p = !task.is_pinned; updateTaskOptimistic(task.id, { is_pinned: p }); try { await taskService.updateTask(task.id, { is_pinned: p }); onTaskUpdated() } catch { rollbackTask(task.id, task) } }
  const handleDelete = async () => { try { await taskService.deleteTask(task.id); removeTask(task.id); onTaskUpdated() } catch { toast({ title: 'Erro', variant: 'destructive' }) } }

  return (
    <aside className="w-72 bg-secondary border-l border-border flex flex-col p-5 space-y-5 transition-colors duration-300">
      <div className="flex justify-between items-center"><h3 className="text-secondary-foreground font-semibold">Details</h3><button onClick={handleDelete} className="p-1.5 hover:bg-destructive/10 rounded transition-colors"><Trash2 className="w-4 h-4 text-destructive" /></button></div>
      <div><label className="text-xs font-bold text-muted-foreground uppercase">Task</label><p className="font-medium text-foreground">{task.title}</p></div>
      <div><label className="text-xs font-bold text-muted-foreground uppercase">Section</label><p className="text-foreground">{section?.name}</p></div>
      <div><label className="text-xs font-bold text-muted-foreground uppercase">Priority</label><div className="text-sm font-semibold text-foreground" style={{ color: `var(--color-${task.priority})` }}>{task.priority}</div></div>
      <button onClick={handleToggle} className={cn("w-full py-2 rounded-lg text-sm font-medium transition-colors", task.status === 'completed' ? "bg-muted text-muted-foreground" : "bg-green-100 text-green-700 hover:bg-green-200")}>{task.status === 'completed' ? '↩️ Pendente' : '✓ Concluir'}</button>
      <button onClick={handlePin} className={cn("w-full py-2 rounded-lg text-sm font-medium transition-colors", task.is_pinned ? "bg-primary/20 text-primary hover:bg-primary/30" : "bg-muted text-muted-foreground hover:bg-muted/80")}>{task.is_pinned ? 'Pinned' : 'Pin Task'}</button>
    </aside>
  )
})
