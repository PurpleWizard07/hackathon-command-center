/* ============================================================================
   Domain model. Every entity is flat and id-addressed so a real relational
   backend can replace the persistence layer without touching the UI.
   ========================================================================== */

/** Lifecycle of a hackathon the user has already registered for. */
export type HackathonStatus =
  | 'registered'
  | 'building'
  | 'ready'
  | 'submitted'
  | 'results'

export type LinkType =
  | 'website'
  | 'rules'
  | 'discord'
  | 'submission'
  | 'docs'
  | 'resource'

export type SubmissionFieldKind = 'text' | 'longtext' | 'url' | 'check'

export type TaskStatus = 'todo' | 'in_progress' | 'done'

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export type AssetType =
  | 'link'
  | 'repo'
  | 'demo'
  | 'image'
  | 'video'
  | 'document'
  | 'diagram'
  | 'file'

export interface Hackathon {
  id: string
  name: string
  platform: string
  /** Whole units of `currency`. Kept as a number so it can be summed. */
  prizePool: number
  currency: string
  /** ISO 8601 timestamp of the submission deadline. */
  deadline: string
  description: string
  status: HackathonStatus
  projectName: string
  /** ISO date the user registered. Optional — older records may lack it. */
  registeredAt?: string
  /** Freeform tags: theme, track, tech constraints. */
  tags: string[]
  /** Outcome copy, only meaningful once status is `results`. */
  result?: string
  createdAt: string
  updatedAt: string
}

export interface Requirement {
  id: string
  hackathonId: string
  title: string
  description: string
  required: boolean
  completed: boolean
}

export interface JudgingCriterion {
  id: string
  hackathonId: string
  title: string
  description: string
  /** Percentage weight, only when the organiser actually published one. */
  weight?: number
}

export interface ResourceLink {
  id: string
  hackathonId: string
  title: string
  url: string
  type: LinkType
}

export interface SubmissionItem {
  id: string
  hackathonId: string
  title: string
  description: string
  required: boolean
  completed: boolean
  /** The captured answer: a URL, a paragraph, or '' when unanswered. */
  value: string
  kind: SubmissionFieldKind
}

export interface Task {
  id: string
  hackathonId: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  /** ISO date (no time component needed for hackathon-scale planning). */
  dueDate?: string
  /** Manual sort position within its column. */
  order: number
  createdAt: string
}

export interface Asset {
  id: string
  hackathonId: string
  name: string
  type: AssetType
  /** URL for links, or a human-readable path/filename for local files. */
  url: string
  note: string
  /** Display-only size hint for file-like assets, e.g. "2.4 MB". */
  meta?: string
  createdAt: string
}

/** The entire persisted document. One object, versioned for migrations. */
export interface CommandCenterData {
  version: number
  hackathons: Hackathon[]
  requirements: Requirement[]
  criteria: JudgingCriterion[]
  links: ResourceLink[]
  submissionItems: SubmissionItem[]
  tasks: Task[]
  assets: Asset[]
}

/** Everything needed to render one hackathon's workspace. */
export interface HackathonBundle {
  hackathon: Hackathon
  requirements: Requirement[]
  criteria: JudgingCriterion[]
  links: ResourceLink[]
  submissionItems: SubmissionItem[]
  tasks: Task[]
  assets: Asset[]
}
