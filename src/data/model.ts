/* ============================================================================
   Shape helpers shared by every persistence backend (localStorage today,
   Supabase optionally). Kept separate from `repository.ts` so backends can
   depend on these without importing each other.
   ========================================================================== */

import type { CommandCenterData } from '@/types'

export const DATA_VERSION = 1

export function emptyData(): CommandCenterData {
  return {
    version: DATA_VERSION,
    hackathons: [],
    requirements: [],
    criteria: [],
    links: [],
    submissionItems: [],
    tasks: [],
    assets: [],
  }
}

/** Defensive normalisation: a hand-edited or partially-migrated payload must
 *  never be able to crash the app on boot. */
export function normalize(input: unknown): CommandCenterData | null {
  if (!input || typeof input !== 'object') return null
  const raw = input as Partial<CommandCenterData>
  if (!Array.isArray(raw.hackathons)) return null
  const base = emptyData()
  return {
    version: DATA_VERSION,
    hackathons: raw.hackathons ?? [],
    requirements: Array.isArray(raw.requirements) ? raw.requirements : base.requirements,
    criteria: Array.isArray(raw.criteria) ? raw.criteria : base.criteria,
    links: Array.isArray(raw.links) ? raw.links : base.links,
    submissionItems: Array.isArray(raw.submissionItems)
      ? raw.submissionItems
      : base.submissionItems,
    tasks: Array.isArray(raw.tasks) ? raw.tasks : base.tasks,
    assets: Array.isArray(raw.assets) ? raw.assets : base.assets,
  }
}
