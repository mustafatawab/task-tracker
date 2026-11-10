'use client'

import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Circle, Clock3, LayoutDashboard, ListTodo, LogOut, Pencil, Plus, Search, Sparkles, Trash2, UserPlus, Users, X } from 'lucide-react'

type Status = 'TODO' | 'IN_PROGRESS' | 'COMPLETED'
type Priority = 'LOW' | 'MEDIUM' | 'HIGH'

type Me = { id: string; name: string; email: string; role: string; systemRole: 'FOUNDER' | 'MEMBER' }

type Member = { id: string; name: string; email: string; role: string; systemRole: 'FOUNDER' | 'MEMBER'; active: boolean; taskCount: number }

type Task = {
  id: string
  title: string
  description: string
  status: Status
  priority: Priority
  dueDate: string | null
  deletedAt: string | null
  assignee: { id: string; name: string; role: string }
  updatedAt: string
}

import { Loader } from '@/components/loader'
import { ThemeToggle } from '@/components/theme-toggle'

const AVATAR_TONES = ['bg-violet-500', 'bg-amber-500', 'bg-cyan-500', 'bg-emerald-500', 'bg-rose-500']

function initials(name: string) {
  return name.split(' ').filter(Boolean).map((w) => w[0]!.toUpperCase()).slice(0, 2).join('')
}

function tone(name: string) {
  const sum = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return AVATAR_TONES[sum % AVATAR_TONES.length]!
}

function shortDate(dueDate: string | null) {
  if (!dueDate) return 'No due date'
  return new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function isOverdue(task: Task) {
  return task.status !== 'COMPLETED' && task.dueDate !== null && new Date(task.dueDate) < new Date()
}

const PRIORITY_STYLES: Record<Priority, string> = {
  HIGH: 'bg-rose-500/10 text-rose-600 dark:text-rose-300',
  MEDIUM: 'bg-amber-500/10 text-amber-600 dark:text-amber-300',
  LOW: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
}

const columns: { id: Status; label: string; icon: typeof Circle; hint: string; header: string; card: string; badge: string }[] = [
  {
    id: 'TODO',
    label: 'Todo',
    icon: Circle,
    hint: 'Not started yet — pick one up',
    header: 'border-b border-dashed border-amber-400/40',
    card: 'border-dashed border-amber-400/25',
    badge: 'bg-amber-400/15 text-amber-200',
  },
  {
    id: 'IN_PROGRESS',
    label: 'In progress',
    icon: Clock3,
    hint: 'Actively moving right now',
    header: 'border-b border-solid border-violet-400/40',
    card: 'border-solid border-violet-400/25 border-l-[3px] border-l-violet-500',
    badge: 'bg-violet-400/15 text-violet-700 dark:text-violet-200',
  },
  {
    id: 'COMPLETED',
    label: 'Completed',
    icon: CheckCircle2,
    hint: 'Shipped and settled',
    header: 'border-b border-solid border-emerald-400/40',
    card: 'border-solid border-emerald-400/15 opacity-75 hover:opacity-100',
    badge: 'bg-emerald-400/15 text-emerald-200',
  },
]

function Avatar({ name, size = 'size-7' }: { name: string; size?: string }) {
  return <div className={`grid ${size} flex-none place-items-center rounded-full ${tone(name)}/20 text-[10px] font-semibold text-foreground`}>{initials(name)}</div>
}

function AssigneeChip({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2" title={`Assigned to ${name}`}>
      <Avatar name={name} />
      <span className="text-[11px] leading-none text-muted-foreground">
        <span className="text-muted-foreground">Assigned to </span>
        <span className="font-medium text-foreground">{name.split(' ')[0]}</span>
      </span>
    </div>
  )
}

function TaskCard({ task, isFounder, onDragStart, onMove, onEdit, onDelete }: { task: Task; isFounder: boolean; onDragStart: () => void; onMove: (id: string, status: Status) => void; onEdit: (task: Task) => void; onDelete: (task: Task) => void }) {
  const col = columns.find((c) => c.id === task.status)!
  return (
    <article
      draggable
      onDragStart={onDragStart}
      className={`group cursor-grab rounded-xl border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 active:cursor-grabbing ${col.card}`}
    >
      <div className="flex items-start justify-between gap-3">
        <h4 className={`text-sm font-medium leading-5 text-foreground ${task.status === 'COMPLETED' ? 'line-through decoration-emerald-400/60' : ''}`}>{task.title}</h4>
        {isFounder && (
          <div className="flex flex-none items-center gap-1 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
            <button onClick={() => onEdit(task)} aria-label={`Edit "${task.title}"`} title="Edit task" className="grid size-6 place-items-center rounded-md text-muted-foreground transition hover:bg-hover hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-violet-500"><Pencil className="size-3" /></button>
            <button onClick={() => onDelete(task)} aria-label={`Delete "${task.title}"`} title="Delete task" className="grid size-6 place-items-center rounded-md text-muted-foreground transition hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-300 outline-none focus-visible:ring-2 focus-visible:ring-violet-500"><Trash2 className="size-3" /></button>
          </div>
        )}
      </div>
      {task.description && <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">{task.description}</p>}
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3">
        <AssigneeChip name={task.assignee.name} />
        <div className="flex flex-none items-center gap-1.5">
          {isOverdue(task) && <span className="rounded-md bg-rose-500/10 px-2 py-1 text-[10px] font-medium text-rose-600 dark:text-rose-300">Overdue</span>}
          <span className={`rounded-md px-2 py-1 text-[10px] font-medium ${PRIORITY_STYLES[task.priority]}`}>{task.priority.charAt(0) + task.priority.slice(1).toLowerCase()}</span>
          <span className="text-[10px] text-muted-foreground">{shortDate(task.dueDate)}</span>
          <select
            aria-label={`Move "${task.title}" to another stage`}
            title="Change status"
            value={task.status}
            onChange={(e) => onMove(task.id, e.target.value as Status)}
            className="rounded-lg border border-border bg-field px-1.5 py-1 text-[10px] text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            {columns.map((c) => <option key={c.id} value={c.id} className="bg-card">{c.label}</option>)}
          </select>
        </div>
      </div>
    </article>
  )
}

export default function Page() {
  const [me, setMe] = useState<Me | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [active, setActive] = useState('Overview')
  const [query, setQuery] = useState('')
  const [dragged, setDragged] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)
  const [deleting, setDeleting] = useState<Task | null>(null)
  const [deletedTasks, setDeletedTasks] = useState<Task[]>([])
  const [today, setToday] = useState('')

  const isFounder = me?.systemRole === 'FOUNDER'
  const visibleTasks = useMemo(() => tasks.filter((task) => task.title.toLowerCase().includes(query.toLowerCase())), [tasks, query])
  const myTasks = useMemo(() => visibleTasks.filter((t) => me && t.assignee.id === me.id), [visibleTasks, me])
  const doneCount = tasks.filter((t) => t.status === 'COMPLETED').length

  function load() {
    setError(null)
    setLoading(true)
    void (async () => {
      try {
        const meRes = await fetch('/api/auth/me')
        if (meRes.status === 401) { window.location.href = '/login'; return }
        const user: Me = await meRes.json()
        setMe(user)
        const isFounderUser = user.systemRole === 'FOUNDER'
        const [teamRes, tasksRes, deletedRes] = await Promise.all([
          fetch('/api/team'),
          fetch('/api/tasks'),
          isFounderUser ? fetch('/api/tasks?deleted=1') : Promise.resolve(null),
        ])
        if (tasksRes.status === 401) { window.location.href = '/login'; return }
        if (!tasksRes.ok) {
          if (tasksRes.status === 503) { setError('We could not reach the task tracker right now. Check your connection and try again.'); return }
          setError('Something went wrong while loading your workspace.'); return
        }
        if (teamRes.ok) {
          const raw: Array<Member & { _count: { assignedTasks: number } }> = await teamRes.json()
          setMembers(raw.map((m) => ({ ...m, taskCount: m._count?.assignedTasks ?? 0 })))
        }
        const fresh: Task[] = await tasksRes.json()
        setTasks(fresh)
        if (deletedRes && deletedRes.ok) setDeletedTasks(await deletedRes.json())
      } catch {
        setError('We could not reach the task tracker right now. Check your connection and try again.')
      } finally {
        setLoading(false)
      }
    })()
  }

  useEffect(() => {
    load()
    // The date is rendered only after mount — server and client agree,
    // so there is no hydration mismatch (server locale/timezone can differ).
    setToday(new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }))
  }, [])

  async function moveTask(id: string, status: Status) {
    const previous = tasks
    setTasks((current) => current.map((task) => (task.id === id ? { ...task, status } : task)))
    setDragged(null)
    const response = await fetch(`/api/tasks/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    if (!response.ok) setTasks(previous)
  }

  async function editTask(id: string, form: { title: string; description: string }) {
    const previous = tasks
    setTasks((current) => current.map((task) => (task.id === id ? { ...task, ...form } : task)))
    const response = await fetch(`/api/tasks/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    if (!response.ok) { setTasks(previous); return false }
    return true
  }

  async function deleteTask(id: string) {
    const previous = tasks
    setTasks((current) => current.filter((task) => task.id !== id))
    const response = await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    if (!response.ok) { setTasks(previous); return false }
    const task = previous.find((t) => t.id === id)
    if (task) setDeletedTasks((current) => [{ ...task, deletedAt: new Date().toISOString() }, ...current])
    return true
  }

  async function toggleMemberActive(id: string, activeNext: boolean) {
    const response = await fetch(`/api/team/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: activeNext }) })
    if (!response.ok) {
      const body = await response.json().catch(() => null)
      alert(body?.error ?? 'Could not update the member.')
      return
    }
    setMembers((current) => current.map((m) => (m.id === id ? { ...m, active: activeNext } : m)))
  }

  async function createTask(form: { title: string; description: string; assigneeId: string; priority: Priority; dueDate: string }) {
    const response = await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    if (!response.ok) return false
    const task: Task = await response.json()
    setTasks((current) => [task, ...current])
    return true
  }

  async function addMember(form: { name: string; email: string; password: string; role: string }) {
    const response = await fetch('/api/team', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    if (!response.ok) return false
    const member = await response.json()
    setMembers((current) => [...current, { ...member, systemRole: 'MEMBER', taskCount: 0 }])
    return true
  }

  if (loading) {
    return <main className="grid min-h-screen place-items-center bg-background text-foreground"><Loader /></main>
  }

  if (error) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-4 text-foreground">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center">
          <h1 className="text-base font-semibold">The workspace is out of reach</h1>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">{error}</p>
          <button onClick={load} className="mt-5 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 outline-none focus-visible:ring-2 focus-visible:ring-ring">Try again</button>
        </div>
      </main>
    )
  }

  const boardTasks = active === 'My tasks' ? myTasks : visibleTasks

  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-violet-500/30">
      <aside className="fixed inset-y-0 left-0 hidden w-[252px] flex-col border-r border-border bg-surface px-4 py-5 lg:flex">
        <div className="flex items-center gap-3 px-3"><div className="grid size-9 place-items-center rounded-xl bg-violet-500 shadow-lg shadow-violet-500/25"><Sparkles className="size-4 text-white" /></div><div><p className="text-sm font-semibold tracking-tight">Farsight</p><p className="text-[11px] text-muted-foreground">Systems workspace</p></div></div>
        <div className="mt-10 flex flex-col gap-1"><p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-faint">Workspace</p>{[['Overview', LayoutDashboard], ['My tasks', ListTodo], ['Team', Users], ...(isFounder ? [['Deleted', Trash2]] : [])].map(([label, Icon]) => <button key={label as string} onClick={() => setActive(label as string)} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${active === label ? 'bg-violet-500/15 text-violet-600 dark:text-violet-300' : 'text-muted-foreground hover:bg-hover hover:text-foreground'}`}><Icon className="size-4" />{label as string}{label === 'My tasks' && <span className="ml-auto rounded-md bg-hover px-1.5 py-0.5 text-[10px] text-muted-foreground">{myTasks.filter(t => t.status !== 'COMPLETED').length}</span>}{label === 'Deleted' && deletedTasks.length > 0 && <span className="ml-auto rounded-md bg-hover px-1.5 py-0.5 text-[10px] text-muted-foreground">{deletedTasks.length}</span>}</button>)}</div>
        <div className="mt-auto flex flex-col gap-3">
          <ThemeToggle showLabel className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-hover hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-violet-500" />
          <div className="rounded-2xl border border-border bg-card p-3 transition"><div className="flex items-center gap-3"><div className={`grid size-9 place-items-center rounded-full ${tone(me!.name)}/20 text-xs font-semibold text-foreground`}>{initials(me!.name)}</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium">{me!.name}</p><p className="text-[11px] text-muted-foreground">{me!.role}</p></div><a href="/api/auth/logout" aria-label="Log out" title="Sign out" className="grid size-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-hover hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-violet-500"><LogOut className="size-3.5" /></a></div></div>
        </div>
      </aside>

      <section className="lg:pl-[252px]">
        <header className="flex h-[72px] items-center justify-between border-b border-border px-4 sm:px-6 lg:px-10">
          <div><p className="text-xs text-muted-foreground">{today}</p><h1 className="mt-1 text-lg font-semibold tracking-tight">Good to see you, {me!.name.split(' ')[0]}</h1></div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-hover px-3 py-2"><Search className="size-4 text-muted-foreground" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tasks..." className="w-24 bg-transparent text-sm text-foreground outline-none placeholder:text-faint sm:w-36" /></div>
            <div className={`grid size-9 place-items-center rounded-full ${tone(me!.name)}/20 text-xs font-semibold text-foreground`}>{initials(me!.name)}</div>
          </div>
        </header>

        <nav aria-label="Sections" className="flex gap-1 overflow-x-auto border-b border-border px-4 py-2 sm:px-6 lg:hidden">
          {[['Overview', LayoutDashboard], ['My tasks', ListTodo], ['Team', Users], ...(isFounder ? [['Deleted', Trash2]] : [])].map(([label, Icon]) => (
            <button
              key={label as string}
              onClick={() => setActive(label as string)}
              aria-current={active === label ? 'page' : undefined}
              className={`flex flex-none items-center gap-2 rounded-lg px-3 py-2 text-sm transition outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${active === label ? 'bg-violet-500/15 text-violet-600 dark:text-violet-300' : 'text-muted-foreground hover:bg-hover hover:text-foreground'}`}
            >
              <Icon className="size-4" />{label as string}
            </button>
          ))}
        </nav>

        <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          {active === 'Team' ? (
            <TeamView me={me!} members={members} showAddMember={showAddMember} setShowAddMember={setShowAddMember} addMember={addMember} toggleActive={toggleMemberActive} />
          ) : (
            <>
              <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground"><span>Workspace</span><span>/</span><span className="text-foreground">{active}</span></div>
                  <h2 className="text-2xl font-semibold tracking-[-0.04em] text-foreground sm:text-3xl">{active === 'My tasks' ? 'Work with your name on it' : active === 'Deleted' ? 'Deleted tasks' : 'Task board'}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{active === 'My tasks' ? 'Everything assigned to you, in one place.' : active === 'Deleted' ? 'Soft-deleted tasks remain here for the record. They cannot be restored.' : isFounder ? 'Drag tasks between columns and the change saves instantly.' : 'Drag a task between columns to update its status.'}</p>
                </div>
                {isFounder && active !== 'Deleted' && <button onClick={() => setShowCreate(true)} className="flex items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-400"><Plus className="size-4" />Create task</button>}
              </div>

              {active === 'Overview' && (
                <div className="grid gap-4 md:grid-cols-3">
                  <Stat label="Total tasks" value={String(tasks.length).padStart(2, '0')} detail={`${members.length} team members`} icon={ListTodo} tone="violet" />
                  <Stat label="In progress" value={String(tasks.filter(t => t.status === 'IN_PROGRESS').length).padStart(2, '0')} detail="Actively moving" icon={Clock3} tone="amber" />
                  <Stat label="Completed" value={String(doneCount).padStart(2, '0')} detail={tasks.length ? `${Math.round((doneCount / tasks.length) * 100)}% of the board` : 'Nothing shipped yet'} icon={CheckCircle2} tone="emerald" />
                </div>
              )}

              {active === 'Deleted' ? (
                <div className="mt-8 flex flex-col gap-3">
                  <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-700 dark:text-amber-300"><Trash2 className="size-4 flex-none" /><span>Deleted tasks are kept for the record only. They cannot be restored or moved back to the board.</span></div>
                  {deletedTasks.length === 0 && <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-xs text-faint">Nothing has been deleted yet.</p>}
                  {deletedTasks.map((task) => (
                    <div key={task.id} className="rounded-xl border border-border bg-card p-4 opacity-80">
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="text-sm font-medium leading-5 text-foreground line-through decoration-rose-400/50">{task.title}</h4>
                        <span className="flex-none rounded-md bg-rose-500/10 px-2 py-1 text-[10px] font-medium text-rose-600 dark:text-rose-300">Deleted</span>
                      </div>
                      {task.description && <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">{task.description}</p>}
                      <div className="mt-3 flex items-center gap-3 border-t border-border pt-3 text-[11px] text-muted-foreground"><Avatar name={task.assignee.name} />Assigned to <span className="font-medium text-foreground">{task.assignee.name}</span></div>
                    </div>
                  ))}
                </div>
              ) : (
              <>
              <div className="mt-8 flex items-center justify-between">
                <div><h3 className="text-base font-semibold text-foreground">{active === 'My tasks' ? 'Your flow' : 'Task flow'}</h3><p className="mt-1 text-xs text-muted-foreground">Each task shows who it is assigned to. Drag it, or use the menu on the card.</p></div>
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-3">
                {columns.map((column) => (
                  <div key={column.id} onDragOver={(e) => e.preventDefault()} onDrop={() => dragged && moveTask(dragged, column.id)} className="min-h-[220px] rounded-2xl border border-border bg-surface p-3 xl:min-h-[420px]">
                    <div className={`flex items-center justify-between border-b pb-3 px-2 ${column.header}`}>
                      <div className="flex items-center gap-2">
                        {column.id === 'IN_PROGRESS'
                          ? <span className="relative flex size-2.5"><span className="absolute inline-flex size-full animate-ping rounded-full bg-violet-400 opacity-60" /><span className="relative inline-flex size-2.5 rounded-full bg-violet-500" /></span>
                          : <column.icon className={`size-4 ${column.id === 'TODO' ? 'text-amber-600 dark:text-amber-300' : 'text-emerald-600 dark:text-emerald-300'}`} />}
                        <span className="text-sm font-medium text-foreground">{column.label}</span>
                        <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${column.badge}`}>{boardTasks.filter(t => t.status === column.id).length}</span>
                      </div>
                      {isFounder && column.id !== 'COMPLETED' && <button onClick={() => setShowCreate(true)} aria-label={`Add to ${column.label}`} className="text-faint hover:text-foreground"><Plus className="size-4" /></button>}
                    </div>
                    <p className="px-2 pt-2 pb-1 text-[10px] text-faint">{column.hint}</p>
                    <div className="mt-2 flex flex-col gap-3">
                      {boardTasks.filter(t => t.status === column.id).map((task) => (
                        <TaskCard key={task.id} task={task} isFounder={isFounder} onDragStart={() => setDragged(task.id)} onMove={moveTask} onEdit={setEditing} onDelete={setDeleting} />
                      ))}
                      {boardTasks.filter(t => t.status === column.id).length === 0 && (
                        <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-xs text-faint">{column.id === 'TODO' ? 'Nothing waiting. Add a task when you are ready.' : column.id === 'IN_PROGRESS' ? 'Nothing in flight right now.' : 'Nothing shipped yet.'}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              </>
              )}
            </>
          )}
        </div>
      </section>

      {showCreate && isFounder && <CreateTaskModal members={members} onClose={() => setShowCreate(false)} createTask={createTask} onMissing={() => { setActive('Team') }} />}
      {showAddMember && isFounder && <AddMemberModal onClose={() => setShowAddMember(false)} addMember={addMember} />}
      {editing && <EditTaskModal task={editing} onClose={() => setEditing(null)} editTask={editTask} />}
      {deleting && <DeleteTaskModal task={deleting} onClose={() => setDeleting(null)} deleteTask={deleteTask} />}
    </main>
  )
}

function Stat({ label, value, detail, icon: Icon, tone: toneName }: { label: string; value: string; detail: string; icon: typeof ListTodo; tone: 'violet' | 'amber' | 'emerald' }) {
  const styles = { violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-300', amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-300', emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300' }
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">{label}</span><span className={`grid size-8 place-items-center rounded-lg ${styles[toneName]}`}><Icon className="size-4" /></span></div>
      <div className="mt-4 flex items-end gap-3"><span className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{value}</span><span className="pb-1 text-[10px] text-muted-foreground">{detail}</span></div>
    </div>
  )
}

function TeamView({ me, members, showAddMember, setShowAddMember, addMember, toggleActive }: { me: Me; members: Member[]; showAddMember: boolean; setShowAddMember: (v: boolean) => void; addMember: (f: { name: string; email: string; password: string; role: string }) => Promise<boolean>; toggleActive: (id: string, activeNext: boolean) => Promise<void> }) {
  return (
    <>
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground"><span>Workspace</span><span>/</span><span className="text-foreground">Team</span></div>
          <h2 className="text-2xl font-semibold tracking-[-0.04em] text-foreground sm:text-3xl">Everyone on the team</h2>
          <p className="mt-2 text-sm text-muted-foreground">{members.length} {members.length === 1 ? 'person' : 'people'} · {me.systemRole === 'FOUNDER' ? 'You can add members and share their credentials with them.' : 'Added by your Founder.'}</p>
        </div>
        {me.systemRole === 'FOUNDER' && <button onClick={() => setShowAddMember(true)} className="flex items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-400"><UserPlus className="size-4" />Add member</button>}
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-border text-xs text-muted-foreground">
            <tr><th className="px-5 py-3 font-medium">Member</th><th className="px-5 py-3 font-medium">Role</th><th className="px-5 py-3 font-medium">Tasks</th><th className="px-5 py-3 font-medium">Status</th>{me.systemRole === 'FOUNDER' && <th className="px-5 py-3 font-medium">Actions</th>}</tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id} className="border-b border-border last:border-0">
                <td className="px-5 py-4"><div className="flex items-center gap-3"><Avatar name={member.name} size="size-8" /><div><p className="text-sm font-medium text-foreground">{member.name}</p><p className="text-xs text-muted-foreground">{member.email}</p></div></div></td>
                <td className="px-5 py-4"><span className="text-xs text-foreground">{member.role}</span>{member.systemRole === 'FOUNDER' && <span className="ml-2 rounded-md bg-violet-500/15 px-2 py-0.5 text-[10px] font-medium text-violet-600 dark:text-violet-300">Founder</span>}</td>
                <td className="px-5 py-4 text-xs text-muted-foreground">{member.taskCount}</td>
                <td className="px-5 py-4"><span className={`rounded-md px-2 py-1 text-[10px] font-medium ${member.active ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300' : 'bg-slate-500/10 text-muted-foreground'}`}>{member.active ? 'Active' : 'Inactive'}</span></td>
                {me.systemRole === 'FOUNDER' && (
                  <td className="px-5 py-4">
                    {member.systemRole === 'FOUNDER'
                      ? <span className="text-[11px] text-faint">—</span>
                      : <button onClick={() => toggleActive(member.id, !member.active)} className={`rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${member.active ? 'text-rose-600 hover:bg-rose-500/10 dark:text-rose-300' : 'text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-300'}`}>{member.active ? 'Deactivate' : 'Activate'}</button>}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      </div>
      {showAddMember && <AddMemberModal onClose={() => setShowAddMember(false)} addMember={addMember} />}
    </>
  )
}

function CreateTaskModal({ members, onClose, createTask, onMissing }: { members: Member[]; onClose: () => void; createTask: (f: { title: string; description: string; assigneeId: string; priority: Priority; dueDate: string }) => Promise<boolean>; onMissing: () => void }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assigneeId, setAssigneeId] = useState(members[0]?.id ?? '')
  const [priority, setPriority] = useState<Priority>('MEDIUM')
  const [dueDate, setDueDate] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit() {
    if (!title.trim()) { setError('Give the task a name.'); return }
    if (!assigneeId) { setError('Add a team member first, then assign the task.'); return }
    setSaving(true); setError('')
    const ok = await createTask({ title: title.trim(), description, assigneeId, priority, dueDate })
    setSaving(false)
    if (ok) onClose()
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
      <div role="dialog" aria-modal="true" className="my-auto w-full max-w-md rounded-2xl border border-border-strong bg-card p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div><h2 className="text-lg font-semibold text-foreground">Create a task</h2><p className="mt-1 text-xs text-muted-foreground">Assign it to someone so the work has an owner.</p></div>
          <button onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
        </div>
        <div className="mt-6 flex flex-col gap-4">
          <label className="block text-xs font-medium text-muted-foreground">Task name<input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Review product roadmap" className="mt-2 w-full rounded-xl border border-border bg-field px-3 py-3 text-base text-white outline-none transition placeholder:text-faint focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/20" /></label>
          <label className="block text-xs font-medium text-muted-foreground">Description<textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="What does done look like?" className="mt-2 w-full resize-none rounded-xl border border-border bg-field px-3 py-3 text-base text-white outline-none transition placeholder:text-faint focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/20" /></label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block text-xs font-medium text-muted-foreground">Assigned to
              {members.length === 0
                ? <button onClick={onMissing} type="button" className="mt-2 w-full rounded-xl border border-dashed border-border bg-field px-3 py-3 text-left text-xs text-muted-foreground hover:text-violet-600 dark:text-violet-300">Add a team member first →</button>
                : <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className="mt-2 w-full rounded-xl border border-border bg-field px-3 py-3 text-base text-white outline-none focus:border-violet-400/60">
                    {members.map((m) => <option key={m.id} value={m.id} className="bg-card">{m.name} — {m.role}</option>)}
                  </select>}
            </label>
            <label className="block text-xs font-medium text-muted-foreground">Priority
              <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className="mt-2 w-full rounded-xl border border-border bg-field px-3 py-3 text-sm capitalize text-white outline-none focus:border-violet-400/60">
                <option value="LOW" className="bg-card">Low</option>
                <option value="MEDIUM" className="bg-card">Medium</option>
                <option value="HIGH" className="bg-card">High</option>
              </select>
            </label>
          </div>
          <label className="block text-xs font-medium text-muted-foreground">Due date<input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="mt-2 w-full rounded-xl border border-border bg-field px-3 py-3 text-base text-white outline-none focus:border-violet-400/60" /></label>
          {error && <p className="text-xs text-rose-600 dark:text-rose-300">{error}</p>}
          <div className="flex justify-end gap-2"><button onClick={onClose} className="rounded-xl px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground">Cancel</button><button onClick={submit} disabled={saving} className="rounded-xl bg-violet-500 px-4 py-2.5 text-xs font-medium text-white hover:bg-violet-400 disabled:opacity-60">{saving ? 'Creating…' : 'Create task'}</button></div>
        </div>
      </div>
    </div>
  )
}

function EditTaskModal({ task, onClose, editTask }: { task: Task; onClose: () => void; editTask: (id: string, f: { title: string; description: string }) => Promise<boolean> }) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit() {
    if (!title.trim()) { setError('The task needs a name.'); return }
    setSaving(true); setError('')
    const ok = await editTask(task.id, { title: title.trim(), description })
    setSaving(false)
    if (ok) onClose()
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
      <div role="dialog" aria-modal="true" className="my-auto w-full max-w-md rounded-2xl border border-border-strong bg-card p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div><h2 className="text-lg font-semibold text-foreground">Edit task</h2><p className="mt-1 text-xs text-muted-foreground">Update the name or description. Changes save to the board instantly.</p></div>
          <button onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
        </div>
        <div className="mt-6 flex flex-col gap-4">
          <label className="block text-xs font-medium text-muted-foreground">Task name<input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} className="mt-2 w-full rounded-xl border border-border bg-field px-3 py-3 text-base text-foreground outline-none transition focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/20" /></label>
          <label className="block text-xs font-medium text-muted-foreground">Description<textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="mt-2 w-full resize-none rounded-xl border border-border bg-field px-3 py-3 text-base text-foreground outline-none transition focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/20" /></label>
          {error && <p className="text-xs text-rose-600 dark:text-rose-300">{error}</p>}
          <div className="flex justify-end gap-2"><button onClick={onClose} className="rounded-xl px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground">Cancel</button><button onClick={submit} disabled={saving} className="rounded-xl bg-violet-500 px-4 py-2.5 text-xs font-medium text-white hover:bg-violet-400 disabled:opacity-60">{saving ? 'Saving…' : 'Save changes'}</button></div>
        </div>
      </div>
    </div>
  )
}

function DeleteTaskModal({ task, onClose, deleteTask }: { task: Task; onClose: () => void; deleteTask: (id: string) => Promise<boolean> }) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function submit() {
    setDeleting(true); setError('')
    const ok = await deleteTask(task.id)
    setDeleting(false)
    if (ok) onClose()
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
      <div role="dialog" aria-modal="true" className="my-auto w-full max-w-sm rounded-2xl border border-border-strong bg-card p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div><h2 className="text-lg font-semibold text-foreground">Delete this task?</h2><p className="mt-1 text-xs text-muted-foreground">“{task.title}” will be removed from the board and moved to Deleted.</p></div>
          <button onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
        </div>
        <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-700 dark:text-amber-300">Deleted tasks cannot be restored — you will still be able to view them in the Deleted tab, but they never come back to the board.</p>
        {error && <p className="mt-3 text-xs text-rose-600 dark:text-rose-300">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-xl px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground">Cancel</button>
          <button onClick={submit} disabled={deleting} className="rounded-xl bg-rose-500 px-4 py-2.5 text-xs font-medium text-white hover:bg-rose-400 disabled:opacity-60">{deleting ? 'Deleting…' : 'Delete task'}</button>
        </div>
      </div>
    </div>
  )
}

function AddMemberModal({ onClose, addMember }: { onClose: () => void; addMember: (f: { name: string; email: string; password: string; role: string }) => Promise<boolean> }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('Member')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit() {
    if (name.trim().length < 2) { setError('Enter the member’s full name.'); return }
    if (!email.trim()) { setError('Enter an email they will use to sign in.'); return }
    if (password.length < 8) { setError('Password needs at least 8 characters.'); return }
    setSaving(true); setError('')
    const ok = await addMember({ name: name.trim(), email: email.trim(), password, role: role.trim() })
    setSaving(false)
    if (ok) onClose()
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
      <div role="dialog" aria-modal="true" className="my-auto w-full max-w-md rounded-2xl border border-border-strong bg-card p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div><h2 className="text-lg font-semibold text-foreground">Add a team member</h2><p className="mt-1 text-xs text-muted-foreground">They will sign in with the email and password you set here.</p></div>
          <button onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
        </div>
        <div className="mt-6 flex flex-col gap-4">
          <label className="block text-xs font-medium text-muted-foreground">Full name<input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Aisha Khan" className="mt-2 w-full rounded-xl border border-border bg-field px-3 py-3 text-base text-white outline-none transition placeholder:text-faint focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/20" /></label>
          <label className="block text-xs font-medium text-muted-foreground">Email<input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="aisha@farsight.dev" className="mt-2 w-full rounded-xl border border-border bg-field px-3 py-3 text-base text-white outline-none transition placeholder:text-faint focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/20" /></label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block text-xs font-medium text-muted-foreground">Temporary password<input value={password} onChange={(e) => setPassword(e.target.value)} type="text" placeholder="min 8 characters" className="mt-2 w-full rounded-xl border border-border bg-field px-3 py-3 text-base text-white outline-none placeholder:text-faint focus:border-violet-400/60" /></label>
            <label className="block text-xs font-medium text-muted-foreground">Role / job title<input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Design Lead" className="mt-2 w-full rounded-xl border border-border bg-field px-3 py-3 text-base text-white outline-none placeholder:text-faint focus:border-violet-400/60" /></label>
          </div>
          {error && <p className="text-xs text-rose-600 dark:text-rose-300">{error}</p>}
          <div className="flex justify-end gap-2"><button onClick={onClose} className="rounded-xl px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground">Cancel</button><button onClick={submit} disabled={saving} className="rounded-xl bg-violet-500 px-4 py-2.5 text-xs font-medium text-white hover:bg-violet-400 disabled:opacity-60">{saving ? 'Adding…' : 'Add member'}</button></div>
        </div>
      </div>
    </div>
  )
}
