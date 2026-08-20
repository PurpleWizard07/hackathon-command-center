/* ============================================================================
   Seed data.

   Deadlines are expressed relative to "today" so countdowns, urgency colours
   and sort order stay meaningful whenever the app is first opened. The set
   deliberately covers every state the UI has to render: a critical sub-24h
   deadline, two healthy builds, an untouched registration, a completed
   submission and a finished hackathon with a published result.
   ========================================================================== */

import type {
  Asset,
  CommandCenterData,
  Hackathon,
  JudgingCriterion,
  Requirement,
  ResourceLink,
  SubmissionFieldKind,
  SubmissionItem,
  Task,
} from '@/types'
import { DATA_VERSION } from './repository'
import { GROUP_2 } from './seed-groups'
import { GROUP_3 } from './seed-groups-2'
import type { Spec } from './seed-types'
import { GROUP_1 } from './seed-flagship'

function startOfToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function dayOffset(days: number, hour = 12, minute = 0): string {
  const d = startOfToday()
  d.setDate(d.getDate() + days)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

/** A submission item counts as done only when it actually holds an answer. */
function isAnswered(kind: SubmissionFieldKind, value: string): boolean {
  if (kind === 'check') return value === 'true'
  return value.trim().length > 0
}

/** Stable, readable ids so seeded links survive a reload and stay debuggable. */
function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 28)
}

export function buildSeedData(): CommandCenterData {
  const specs: Spec[] = [...GROUP_1, ...GROUP_2, ...GROUP_3]

  const hackathons: Hackathon[] = []
  const requirements: Requirement[] = []
  const criteria: JudgingCriterion[] = []
  const links: ResourceLink[] = []
  const submissionItems: SubmissionItem[] = []
  const tasks: Task[] = []
  const assets: Asset[] = []

  specs.forEach((spec, specIndex) => {
    const id = `hk_${slug(spec.platform)}_${slug(spec.name)}`
    const createdAt = dayOffset(-spec.registeredDaysAgo, 9, 30)

    hackathons.push({
      id,
      name: spec.name,
      platform: spec.platform,
      prizePool: spec.prizePool,
      currency: spec.currency ?? 'USD',
      deadline:
        spec.deadlineHoursFromNow === undefined
          ? dayOffset(spec.deadlineInDays, spec.deadlineHour, spec.deadlineMinute ?? 0)
          : new Date(Date.now() + spec.deadlineHoursFromNow * 3_600_000).toISOString(),
      description: spec.description,
      status: spec.status,
      projectName: spec.projectName,
      registeredAt: createdAt,
      tags: spec.tags,
      result: spec.result,
      createdAt,
      updatedAt: dayOffset(-Math.max(0, specIndex % 3), 14, 0),
    })

    spec.requirements.forEach(([title, description, required, completed], i) => {
      requirements.push({
        id: `${id}_req_${i}`,
        hackathonId: id,
        title,
        description,
        required,
        completed,
      })
    })

    spec.criteria.forEach(([title, description, weight], i) => {
      criteria.push({ id: `${id}_crit_${i}`, hackathonId: id, title, description, weight })
    })

    spec.links.forEach(([type, title, url], i) => {
      links.push({ id: `${id}_link_${i}`, hackathonId: id, title, url, type })
    })

    spec.submission.forEach(([kind, title, description, required, value], i) => {
      submissionItems.push({
        id: `${id}_sub_${i}`,
        hackathonId: id,
        title,
        description,
        required,
        completed: isAnswered(kind, value),
        value,
        kind,
      })
    })

    const columnOrder: Record<string, number> = { todo: 0, in_progress: 0, done: 0 }
    spec.tasks.forEach(([status, priority, title, description, dueInDays], i) => {
      tasks.push({
        id: `${id}_task_${i}`,
        hackathonId: id,
        title,
        description,
        status,
        priority,
        dueDate: dueInDays === undefined ? undefined : dayOffset(dueInDays, 12, 0),
        order: columnOrder[status]++,
        createdAt: dayOffset(-spec.registeredDaysAgo + i, 10, 0),
      })
    })

    spec.assets.forEach(([type, name, url, note, meta], i) => {
      assets.push({
        id: `${id}_asset_${i}`,
        hackathonId: id,
        name,
        type,
        url,
        note,
        meta,
        createdAt: dayOffset(-spec.registeredDaysAgo + i, 11, 0),
      })
    })
  })

  return {
    version: DATA_VERSION,
    hackathons,
    requirements,
    criteria,
    links,
    submissionItems,
    tasks,
    assets,
  }
}
