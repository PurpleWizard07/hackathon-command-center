/* ============================================================================
   The single reducer over the whole document. Every mutation is expressed as
   an action so persistence, undo-ability and a future backend all have one
   place to hook into.
   ========================================================================== */

import type {
  Asset,
  CommandCenterData,
  Hackathon,
  JudgingCriterion,
  Requirement,
  ResourceLink,
  SubmissionItem,
  Task,
  TaskStatus,
} from '@/types'
import { createId } from '@/lib/id'

export type Action =
  | { type: 'hydrate'; data: CommandCenterData }
  | { type: 'hackathon/add'; payload: NewHackathon }
  | { type: 'hackathon/update'; id: string; patch: Partial<Hackathon> }
  | { type: 'hackathon/remove'; id: string }
  | { type: 'requirement/add'; hackathonId: string; patch: Partial<Requirement> }
  | { type: 'requirement/update'; id: string; patch: Partial<Requirement> }
  | { type: 'requirement/remove'; id: string }
  | { type: 'criterion/add'; hackathonId: string; patch: Partial<JudgingCriterion> }
  | { type: 'criterion/update'; id: string; patch: Partial<JudgingCriterion> }
  | { type: 'criterion/remove'; id: string }
  | { type: 'link/add'; hackathonId: string; patch: Partial<ResourceLink> }
  | { type: 'link/update'; id: string; patch: Partial<ResourceLink> }
  | { type: 'link/remove'; id: string }
  | { type: 'submission/add'; hackathonId: string; patch: Partial<SubmissionItem> }
  | { type: 'submission/update'; id: string; patch: Partial<SubmissionItem> }
  | { type: 'submission/remove'; id: string }
  | { type: 'task/add'; hackathonId: string; patch: Partial<Task> }
  | { type: 'task/update'; id: string; patch: Partial<Task> }
  | { type: 'task/remove'; id: string }
  | { type: 'task/move'; id: string; status: TaskStatus; index: number }
  | { type: 'asset/add'; hackathonId: string; patch: Partial<Asset> }
  | { type: 'asset/update'; id: string; patch: Partial<Asset> }
  | { type: 'asset/remove'; id: string }

/** Payload for the add-hackathon flow. Child collections are optional; the
 *  reducer fills in a sensible submission checklist when none is supplied. */
export interface NewHackathon {
  hackathon: Omit<Hackathon, 'id' | 'createdAt' | 'updatedAt'>
  requirements?: Pick<Requirement, 'title' | 'description' | 'required' | 'completed'>[]
  criteria?: Pick<JudgingCriterion, 'title' | 'description' | 'weight'>[]
  links?: Pick<ResourceLink, 'title' | 'url' | 'type'>[]
  submissionItems?: Pick<
    SubmissionItem,
    'title' | 'description' | 'required' | 'kind' | 'value'
  >[]
}

/** The checklist almost every online hackathon actually asks for. */
export const DEFAULT_SUBMISSION_TEMPLATE: Pick<
  SubmissionItem,
  'title' | 'description' | 'required' | 'kind' | 'value'
>[] = [
  {
    title: 'Project name',
    description: 'Shown as the title of your submission.',
    required: true,
    kind: 'text',
    value: '',
  },
  {
    title: 'Project description',
    description: 'What it does, who it is for, and why it matters.',
    required: true,
    kind: 'longtext',
    value: '',
  },
  {
    title: 'GitHub repository',
    description: 'Public repo with a README.',
    required: true,
    kind: 'url',
    value: '',
  },
  {
    title: 'Live demo',
    description: 'Deployed URL judges can open without setup.',
    required: true,
    kind: 'url',
    value: '',
  },
  {
    title: 'Demo video',
    description: 'Short walkthrough, usually three minutes or less.',
    required: true,
    kind: 'url',
    value: '',
  },
  {
    title: 'Screenshots uploaded',
    description: 'Enough for a judge to understand it without running it.',
    required: true,
    kind: 'check',
    value: '',
  },
]

const now = () => new Date().toISOString()

/** A submission item is complete when it holds a real answer. */
export function isSubmissionAnswered(item: Pick<SubmissionItem, 'kind' | 'value'>): boolean {
  if (item.kind === 'check') return item.value === 'true'
  return item.value.trim().length > 0
}

function touch(state: CommandCenterData, hackathonId: string): Hackathon[] {
  const stamp = now()
  return state.hackathons.map((h) => (h.id === hackathonId ? { ...h, updatedAt: stamp } : h))
}

function patchIn<T extends { id: string }>(items: T[], id: string, patch: Partial<T>): T[] {
  return items.map((item) => (item.id === id ? { ...item, ...patch } : item))
}

function ownerOf<T extends { id: string; hackathonId: string }>(
  items: T[],
  id: string,
): string | undefined {
  return items.find((item) => item.id === id)?.hackathonId
}

function nextOrder(tasks: Task[], hackathonId: string, status: TaskStatus): number {
  const column = tasks.filter((t) => t.hackathonId === hackathonId && t.status === status)
  return column.reduce((max, t) => Math.max(max, t.order + 1), 0)
}

/** Rewrite `order` as a dense 0..n-1 sequence for one column. */
function reindex(tasks: Task[], hackathonId: string, status: TaskStatus): Task[] {
  const column = tasks
    .filter((t) => t.hackathonId === hackathonId && t.status === status)
    .sort((a, b) => a.order - b.order)
  const positions = new Map(column.map((t, i) => [t.id, i]))
  return tasks.map((t) => (positions.has(t.id) ? { ...t, order: positions.get(t.id)! } : t))
}

export function reducer(state: CommandCenterData, action: Action): CommandCenterData {
  switch (action.type) {
    case 'hydrate':
      return action.data

    case 'hackathon/add': {
      const id = createId('hk')
      const stamp = now()
      const { hackathon, requirements, criteria, links, submissionItems } = action.payload
      const template = submissionItems?.length ? submissionItems : DEFAULT_SUBMISSION_TEMPLATE
      return {
        ...state,
        hackathons: [...state.hackathons, { ...hackathon, id, createdAt: stamp, updatedAt: stamp }],
        requirements: [
          ...state.requirements,
          ...(requirements ?? []).map((r) => ({ ...r, id: createId('req'), hackathonId: id })),
        ],
        criteria: [
          ...state.criteria,
          ...(criteria ?? []).map((c) => ({ ...c, id: createId('crit'), hackathonId: id })),
        ],
        links: [
          ...state.links,
          ...(links ?? []).map((l) => ({ ...l, id: createId('link'), hackathonId: id })),
        ],
        submissionItems: [
          ...state.submissionItems,
          ...template.map((item) => ({
            ...item,
            id: createId('sub'),
            hackathonId: id,
            completed: isSubmissionAnswered(item),
          })),
        ],
      }
    }

    case 'hackathon/update':
      return {
        ...state,
        hackathons: patchIn(state.hackathons, action.id, {
          ...action.patch,
          updatedAt: now(),
        }),
      }

    case 'hackathon/remove': {
      const keep = <T extends { hackathonId: string }>(items: T[]) =>
        items.filter((item) => item.hackathonId !== action.id)
      return {
        ...state,
        hackathons: state.hackathons.filter((h) => h.id !== action.id),
        requirements: keep(state.requirements),
        criteria: keep(state.criteria),
        links: keep(state.links),
        submissionItems: keep(state.submissionItems),
        tasks: keep(state.tasks),
        assets: keep(state.assets),
      }
    }

    case 'requirement/add':
      return {
        ...state,
        hackathons: touch(state, action.hackathonId),
        requirements: [
          ...state.requirements,
          {
            id: createId('req'),
            hackathonId: action.hackathonId,
            title: '',
            description: '',
            required: true,
            completed: false,
            ...action.patch,
          },
        ],
      }

    case 'requirement/update': {
      const owner = ownerOf(state.requirements, action.id)
      return {
        ...state,
        hackathons: owner ? touch(state, owner) : state.hackathons,
        requirements: patchIn(state.requirements, action.id, action.patch),
      }
    }

    case 'requirement/remove':
      return {
        ...state,
        requirements: state.requirements.filter((r) => r.id !== action.id),
      }

    case 'criterion/add':
      return {
        ...state,
        hackathons: touch(state, action.hackathonId),
        criteria: [
          ...state.criteria,
          {
            id: createId('crit'),
            hackathonId: action.hackathonId,
            title: '',
            description: '',
            ...action.patch,
          },
        ],
      }

    case 'criterion/update':
      return { ...state, criteria: patchIn(state.criteria, action.id, action.patch) }

    case 'criterion/remove':
      return { ...state, criteria: state.criteria.filter((c) => c.id !== action.id) }

    case 'link/add':
      return {
        ...state,
        hackathons: touch(state, action.hackathonId),
        links: [
          ...state.links,
          {
            id: createId('link'),
            hackathonId: action.hackathonId,
            title: '',
            url: '',
            type: 'resource',
            ...action.patch,
          },
        ],
      }

    case 'link/update':
      return { ...state, links: patchIn(state.links, action.id, action.patch) }

    case 'link/remove':
      return { ...state, links: state.links.filter((l) => l.id !== action.id) }

    case 'submission/add':
      return {
        ...state,
        hackathons: touch(state, action.hackathonId),
        submissionItems: [
          ...state.submissionItems,
          {
            id: createId('sub'),
            hackathonId: action.hackathonId,
            title: '',
            description: '',
            required: true,
            completed: false,
            value: '',
            kind: 'text',
            ...action.patch,
          },
        ],
      }

    case 'submission/update': {
      const owner = ownerOf(state.submissionItems, action.id)
      const items = state.submissionItems.map((item) => {
        if (item.id !== action.id) return item
        const merged = { ...item, ...action.patch }
        // Completion is derived from the answer unless explicitly overridden,
        // so a value and its checkbox can never disagree.
        const completed =
          action.patch.completed !== undefined
            ? action.patch.completed
            : isSubmissionAnswered(merged)
        return { ...merged, completed }
      })
      return {
        ...state,
        hackathons: owner ? touch(state, owner) : state.hackathons,
        submissionItems: items,
      }
    }

    case 'submission/remove':
      return {
        ...state,
        submissionItems: state.submissionItems.filter((i) => i.id !== action.id),
      }

    case 'task/add':
      return {
        ...state,
        hackathons: touch(state, action.hackathonId),
        tasks: [
          ...state.tasks,
          {
            id: createId('task'),
            hackathonId: action.hackathonId,
            title: '',
            description: '',
            status: 'todo',
            priority: 'medium',
            order: nextOrder(state.tasks, action.hackathonId, action.patch.status ?? 'todo'),
            createdAt: now(),
            ...action.patch,
          },
        ],
      }

    case 'task/update': {
      const task = state.tasks.find((t) => t.id === action.id)
      if (!task) return state
      // Changing status through the editor must land the task at the end of
      // its new column rather than keeping a stale order index.
      const movedColumn = action.patch.status && action.patch.status !== task.status
      const patch = movedColumn
        ? { ...action.patch, order: nextOrder(state.tasks, task.hackathonId, action.patch.status!) }
        : action.patch
      return {
        ...state,
        hackathons: touch(state, task.hackathonId),
        tasks: patchIn(state.tasks, action.id, patch),
      }
    }

    case 'task/remove': {
      const task = state.tasks.find((t) => t.id === action.id)
      const remaining = state.tasks.filter((t) => t.id !== action.id)
      return {
        ...state,
        tasks: task ? reindex(remaining, task.hackathonId, task.status) : remaining,
      }
    }

    case 'task/move': {
      const task = state.tasks.find((t) => t.id === action.id)
      if (!task) return state
      const { hackathonId } = task
      const target = state.tasks
        .filter((t) => t.hackathonId === hackathonId && t.status === action.status && t.id !== action.id)
        .sort((a, b) => a.order - b.order)
      const index = Math.max(0, Math.min(action.index, target.length))
      target.splice(index, 0, { ...task, status: action.status })
      const positions = new Map(target.map((t, i) => [t.id, i]))
      const next = state.tasks.map((t) => {
        if (t.id === action.id) return { ...t, status: action.status, order: index }
        return positions.has(t.id) ? { ...t, order: positions.get(t.id)! } : t
      })
      return {
        ...state,
        hackathons: touch(state, hackathonId),
        tasks: task.status === action.status ? next : reindex(next, hackathonId, task.status),
      }
    }

    case 'asset/add':
      return {
        ...state,
        hackathons: touch(state, action.hackathonId),
        assets: [
          ...state.assets,
          {
            id: createId('asset'),
            hackathonId: action.hackathonId,
            name: '',
            type: 'link',
            url: '',
            note: '',
            createdAt: now(),
            ...action.patch,
          },
        ],
      }

    case 'asset/update':
      return { ...state, assets: patchIn(state.assets, action.id, action.patch) }

    case 'asset/remove':
      return { ...state, assets: state.assets.filter((a) => a.id !== action.id) }

    default:
      return state
  }
}
