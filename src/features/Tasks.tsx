import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import type { HackathonBundle, Task, TaskPriority, TaskStatus } from '@/types'
import { useStore } from '@/store/StoreProvider'
import { cn } from '@/lib/cn'
import { isOverdue, relativeDay, toDateInput, fromDateInput } from '@/lib/time'
import {
  Button,
  Dialog,
  Field,
  Input,
  Select,
  Textarea,
  Checkbox,
  useToast,
} from '@/components/ui'
import { IconPlus } from '@/components/icons'

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: 'todo', label: 'To Do' },
  { status: 'in_progress', label: 'In Progress' },
  { status: 'done', label: 'Done' },
]

const PRIORITIES: TaskPriority[] = ['urgent', 'high', 'medium', 'low']

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  urgent: 'Urgent',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

export function Tasks() {
  const bundle = useOutletContext<HackathonBundle>()
  const { dispatch, now } = useStore()
  const toast = useToast()
  const [editing, setEditing] = useState<Task | null>(null)
  const [creatingIn, setCreatingIn] = useState<TaskStatus | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<TaskStatus | null>(null)

  const columns = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = { todo: [], in_progress: [], done: [] }
    for (const task of bundle.tasks) grouped[task.status].push(task)
    for (const status of Object.keys(grouped) as TaskStatus[]) {
      grouped[status].sort((a, b) => a.order - b.order)
    }
    return grouped
  }, [bundle.tasks])

  const drop = (status: TaskStatus) => {
    if (!dragId) return
    const task = bundle.tasks.find((t) => t.id === dragId)
    setDropTarget(null)
    setDragId(null)
    if (!task || task.status === status) return
    dispatch({ type: 'task/move', id: dragId, status, index: columns[status].length })
    if (status === 'done') toast('Task completed', 'success')
  }

  return (
    <>
      <div className="toolbar" style={{ marginTop: 0 }}>
        <div>
          <h3 className="panel__title">Task board</h3>
          <p className="crow__desc" style={{ marginTop: 'var(--sp-2)' }}>
            {bundle.tasks.filter((t) => t.status !== 'done').length} open ·{' '}
            {bundle.tasks.filter((t) => t.status === 'done').length} done
          </p>
        </div>
        <Button variant="primary" onClick={() => setCreatingIn('todo')}>
          <IconPlus style={{ width: 14, height: 14 }} />
          New task
        </Button>
      </div>

      <div className="board">
        {COLUMNS.map(({ status, label }) => (
          <section
            key={status}
            className={cn('column', dropTarget === status && dragId && 'is-drop')}
            onDragOver={(e) => {
              e.preventDefault()
              setDropTarget(status)
            }}
            onDragLeave={(e) => {
              if (e.currentTarget.contains(e.relatedTarget as Node)) return
              setDropTarget((current) => (current === status ? null : current))
            }}
            onDrop={(e) => {
              e.preventDefault()
              drop(status)
            }}
            aria-label={label}
          >
            <header className="column__head">
              <span className="section-title">{label}</span>
              <span className="column__count">{columns[status].length}</span>
            </header>

            <div className="column__items">
              {columns[status].length === 0 ? (
                <p className="column__empty">
                  {status === 'done' ? 'Nothing finished yet' : 'Nothing here'}
                </p>
              ) : (
                columns[status].map((task) => (
                  <article
                    key={task.id}
                    className={cn(
                      'tcard',
                      task.status === 'done' && 'tcard--done',
                      dragId === task.id && 'is-dragging',
                    )}
                    draggable
                    onDragStart={() => setDragId(task.id)}
                    onDragEnd={() => {
                      setDragId(null)
                      setDropTarget(null)
                    }}
                    onClick={() => setEditing(task)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setEditing(task)
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`Edit task ${task.title}`}
                  >
                    <h4 className="tcard__title">{task.title}</h4>
                    {task.description && (
                      <p className="tcard__desc u-clamp-2">{task.description}</p>
                    )}
                    <div className="tcard__foot">
                      <span className={cn('prio', `prio--${task.priority}`)}>
                        <span className="prio__bar" aria-hidden="true" />
                        {PRIORITY_LABEL[task.priority]}
                      </span>
                      {task.dueDate && (
                        <span
                          className={cn(
                            'due',
                            task.status !== 'done' && isOverdue(task.dueDate, now) && 'due--over',
                          )}
                        >
                          {relativeDay(task.dueDate, now)}
                        </span>
                      )}
                    </div>
                  </article>
                ))
              )}
            </div>

            <Button size="sm" variant="ghost" onClick={() => setCreatingIn(status)}>
              <IconPlus style={{ width: 12, height: 12 }} />
              Add task
            </Button>
          </section>
        ))}
      </div>

      <TaskDialog
        open={creatingIn !== null || editing !== null}
        task={editing}
        initialStatus={creatingIn ?? 'todo'}
        hackathonId={bundle.hackathon.id}
        onClose={() => {
          setEditing(null)
          setCreatingIn(null)
        }}
      />
    </>
  )
}

function TaskDialog({
  open,
  task,
  initialStatus,
  hackathonId,
  onClose,
}: {
  open: boolean
  task: Task | null
  initialStatus: TaskStatus
  hackathonId: string
  onClose: () => void
}) {
  const { dispatch } = useStore()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TaskStatus>(initialStatus)
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [dueDate, setDueDate] = useState('')
  const [hasDue, setHasDue] = useState(false)
  const [error, setError] = useState('')
  const [key, setKey] = useState('')

  // Re-seed the form whenever a different task (or a fresh create) opens.
  const identity = `${open}:${task?.id ?? `new-${initialStatus}`}`
  if (identity !== key) {
    setKey(identity)
    setTitle(task?.title ?? '')
    setDescription(task?.description ?? '')
    setStatus(task?.status ?? initialStatus)
    setPriority(task?.priority ?? 'medium')
    setDueDate(toDateInput(task?.dueDate))
    setHasDue(Boolean(task?.dueDate))
    setError('')
  }

  const save = () => {
    if (!title.trim()) {
      setError('A title is required.')
      return
    }
    const patch = {
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      dueDate: hasDue && dueDate ? fromDateInput(dueDate) : undefined,
    }
    if (task) {
      dispatch({ type: 'task/update', id: task.id, patch })
    } else {
      dispatch({ type: 'task/add', hackathonId, patch })
    }
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={task ? 'Edit task' : 'New task'}
      footer={
        <>
          {task && (
            <Button
              variant="danger"
              onClick={() => {
                dispatch({ type: 'task/remove', id: task.id })
                onClose()
              }}
              style={{ marginRight: 'auto' }}
            >
              Delete
            </Button>
          )}
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save}>
            {task ? 'Save' : 'Add task'}
          </Button>
        </>
      }
    >
      <div className="form-grid">
        <Field label="Title" htmlFor="task-title" error={error} span>
          <Input
            id="task-title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              setError('')
            }}
            placeholder="Record the demo video"
            autoComplete="off"
          />
        </Field>
        <Field label="Description" htmlFor="task-desc" span>
          <Textarea
            id="task-desc"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Anything you need to remember when you pick this up."
          />
        </Field>
        <Field label="Status" htmlFor="task-status">
          <Select
            id="task-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
          >
            {COLUMNS.map((column) => (
              <option key={column.status} value={column.status}>
                {column.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Priority" htmlFor="task-priority">
          <Select
            id="task-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
          >
            {PRIORITIES.map((value) => (
              <option key={value} value={value}>
                {PRIORITY_LABEL[value]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Due date" htmlFor="task-due" span>
          <Checkbox
            checked={hasDue}
            onChange={setHasDue}
            label="This task has a due date"
            id="task-hasdue"
          />
          {hasDue && (
            <Input
              id="task-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          )}
        </Field>
      </div>
    </Dialog>
  )
}
