/* ============================================================================
   Derived state. Progress and readiness are never stored - they are computed
   from the underlying checklists so the numbers can never drift from reality.
   ========================================================================== */

import type {
  Asset,
  Hackathon,
  HackathonBundle,
  HackathonStatus,
  Requirement,
  SubmissionItem,
  Task,
} from '@/types'
import { countdown, type Countdown } from './time'

export interface Completion {
  done: number
  total: number
  /** 0-100. A checklist with no items counts as complete, not as zero. */
  pct: number
}

export function completion(done: number, total: number): Completion {
  return { done, total, pct: total === 0 ? 100 : Math.round((done / total) * 100) }
}

export function requirementCompletion(items: Requirement[]): Completion {
  const required = items.filter((r) => r.required)
  const pool = required.length > 0 ? required : items
  return completion(pool.filter((r) => r.completed).length, pool.length)
}

/** Readiness only counts *required* submission items - optional extras never
 *  block a submission, so they must not dilute the headline number. */
export function submissionReadiness(items: SubmissionItem[]): Completion {
  const required = items.filter((i) => i.required)
  return completion(required.filter((i) => i.completed).length, required.length)
}

export function taskCompletion(tasks: Task[]): Completion {
  return completion(tasks.filter((t) => t.status === 'done').length, tasks.length)
}

/**
 * Overall build progress: every required checkbox across requirements,
 * submission items and tasks counts once. Transparent and additive, so the
 * bar always moves when the user actually does something.
 */
export function overallProgress(bundle: {
  requirements: Requirement[]
  submissionItems: SubmissionItem[]
  tasks: Task[]
}): Completion {
  const req = requirementCompletion(bundle.requirements)
  const sub = submissionReadiness(bundle.submissionItems)
  const task = taskCompletion(bundle.tasks)
  const total = req.total + sub.total + task.total
  const done = req.done + sub.done + task.done
  if (total === 0) return completion(0, 0)
  return completion(done, total)
}

export interface Blocker {
  id: string
  title: string
  /** Where the user must go to clear it. */
  area: 'submission' | 'requirements'
}

/** Everything that stands between the user and a valid submission. */
export function blockers(bundle: {
  requirements: Requirement[]
  submissionItems: SubmissionItem[]
}): Blocker[] {
  const fromSubmission = bundle.submissionItems
    .filter((i) => i.required && !i.completed)
    .map((i) => ({ id: i.id, title: i.title, area: 'submission' as const }))
  const fromRequirements = bundle.requirements
    .filter((r) => r.required && !r.completed)
    .map((r) => ({ id: r.id, title: r.title, area: 'requirements' as const }))
  return [...fromSubmission, ...fromRequirements]
}

/* ---- Status ------------------------------------------------------------ */

export const STATUS_ORDER: HackathonStatus[] = [
  'registered',
  'building',
  'ready',
  'submitted',
  'results',
]

export const STATUS_LABEL: Record<HackathonStatus, string> = {
  registered: 'Registered',
  building: 'Building',
  ready: 'Ready to Submit',
  submitted: 'Submitted',
  results: 'Results',
}

export const STATUS_TONE: Record<HackathonStatus, 'neutral' | 'accent' | 'success' | 'warn'> = {
  registered: 'neutral',
  building: 'accent',
  ready: 'warn',
  submitted: 'success',
  results: 'success',
}

/** Statuses that still need work from the user. */
export function isActive(status: HackathonStatus): boolean {
  return status === 'registered' || status === 'building' || status === 'ready'
}

export function isClosed(status: HackathonStatus): boolean {
  return status === 'submitted' || status === 'results'
}

/**
 * A hackathon whose required submission items are all complete should be
 * surfaced as ready even if the user has not flipped the status themselves.
 */
export function suggestedStatus(
  hackathon: Hackathon,
  items: SubmissionItem[],
): HackathonStatus | null {
  if (isClosed(hackathon.status)) return null
  const readiness = submissionReadiness(items)
  if (readiness.total === 0) return null
  if (readiness.pct === 100 && hackathon.status !== 'ready') return 'ready'
  if (readiness.pct > 0 && readiness.pct < 100 && hackathon.status === 'registered') {
    return 'building'
  }
  return null
}

/* ---- Roll-ups ---------------------------------------------------------- */

export interface HackathonSummary {
  hackathon: Hackathon
  countdown: Countdown
  progress: Completion
  readiness: Completion
  requirements: Completion
  tasks: Completion
  openTasks: number
  blockerCount: number
  assetCount: number
}

export function summarize(bundle: HackathonBundle, now: number): HackathonSummary {
  return {
    hackathon: bundle.hackathon,
    countdown: countdown(bundle.hackathon.deadline, now),
    progress: overallProgress(bundle),
    readiness: submissionReadiness(bundle.submissionItems),
    requirements: requirementCompletion(bundle.requirements),
    tasks: taskCompletion(bundle.tasks),
    openTasks: bundle.tasks.filter((t) => t.status !== 'done').length,
    blockerCount: blockers(bundle).length,
    assetCount: bundle.assets.length,
  }
}

/** Active first, then soonest deadline. Closed ones sink, newest first. */
export function compareForBoard(a: HackathonSummary, b: HackathonSummary): number {
  const aActive = isActive(a.hackathon.status)
  const bActive = isActive(b.hackathon.status)
  if (aActive !== bActive) return aActive ? -1 : 1
  if (aActive) return a.countdown.ms - b.countdown.ms
  return new Date(b.hackathon.deadline).getTime() - new Date(a.hackathon.deadline).getTime()
}

export function assetGroup(type: Asset['type']): 'links' | 'media' | 'docs' | 'files' {
  switch (type) {
    case 'link':
    case 'repo':
    case 'demo':
      return 'links'
    case 'image':
    case 'video':
      return 'media'
    case 'document':
    case 'diagram':
      return 'docs'
    default:
      return 'files'
  }
}
