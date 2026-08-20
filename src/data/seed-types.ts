/* Compact tuple shapes for authoring seed data by hand. Expanded into real
   entities with generated ids by `buildSeedData()`. */

import type {
  AssetType,
  HackathonStatus,
  LinkType,
  SubmissionFieldKind,
  TaskPriority,
  TaskStatus,
} from '@/types'

export type ReqSpec = [
  title: string,
  description: string,
  required: boolean,
  completed: boolean,
]

export type CritSpec = [title: string, description: string, weight?: number]

export type LinkSpec = [type: LinkType, title: string, url: string]

export type SubSpec = [
  kind: SubmissionFieldKind,
  title: string,
  description: string,
  required: boolean,
  value: string,
]

export type TaskSpec = [
  status: TaskStatus,
  priority: TaskPriority,
  title: string,
  description: string,
  dueInDays?: number,
]

export type AssetSpec = [
  type: AssetType,
  name: string,
  url: string,
  note: string,
  meta?: string,
]

export interface Spec {
  name: string
  platform: string
  prizePool: number
  currency?: string
  /** Days from today until the deadline; negative for past deadlines. */
  deadlineInDays: number
  /** Local hour of the deadline, 0-23. */
  deadlineHour: number
  deadlineMinute?: number
  /** Overrides the day/hour pair with an offset from the current moment, so a
   *  deliberately urgent sample cannot go stale between sessions. */
  deadlineHoursFromNow?: number
  registeredDaysAgo: number
  status: HackathonStatus
  projectName: string
  description: string
  tags: string[]
  result?: string
  requirements: ReqSpec[]
  criteria: CritSpec[]
  links: LinkSpec[]
  submission: SubSpec[]
  tasks: TaskSpec[]
  assets: AssetSpec[]
}
