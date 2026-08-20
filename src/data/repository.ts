/* ============================================================================
   Persistence boundary.

   The UI talks to `Repository` and nothing else. Today it is backed by
   localStorage; swapping in a REST or SQL backend means writing a second
   implementation of this interface - no component changes.
   ========================================================================== */

import type { CommandCenterData } from '@/types'
import { buildSeedData } from './seed'

export const DATA_VERSION = 1
const STORAGE_KEY = 'hcc:data:v1'

export interface Repository {
  load(): Promise<CommandCenterData>
  save(data: CommandCenterData): Promise<void>
  reset(): Promise<CommandCenterData>
  clear(): Promise<CommandCenterData>
}

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
function normalize(input: unknown): CommandCenterData | null {
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

class LocalStorageRepository implements Repository {
  private memory: CommandCenterData | null = null

  private get storage(): Storage | null {
    try {
      return globalThis.localStorage ?? null
    } catch {
      return null
    }
  }

  async load(): Promise<CommandCenterData> {
    const storage = this.storage
    if (!storage) {
      // Private browsing or a blocked storage partition: run in memory so the
      // product still works for the session instead of erroring out.
      this.memory ??= buildSeedData()
      return clone(this.memory)
    }
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) {
      const seeded = buildSeedData()
      await this.save(seeded)
      return seeded
    }
    try {
      const parsed = normalize(JSON.parse(raw))
      if (!parsed) throw new Error('Malformed payload')
      return parsed
    } catch {
      // Corrupt payload: keep a backup so nothing is silently destroyed.
      try {
        storage.setItem(STORAGE_KEY + ':corrupt', raw)
      } catch {
        /* quota - nothing more we can do */
      }
      const seeded = buildSeedData()
      await this.save(seeded)
      return seeded
    }
  }

  async save(data: CommandCenterData): Promise<void> {
    const storage = this.storage
    if (!storage) {
      this.memory = clone(data)
      return
    }
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      throw new Error(
        'Could not save changes - browser storage is full or unavailable.',
        { cause: error },
      )
    }
  }

  async reset(): Promise<CommandCenterData> {
    const seeded = buildSeedData()
    await this.save(seeded)
    return seeded
  }

  async clear(): Promise<CommandCenterData> {
    const blank = emptyData()
    await this.save(blank)
    return blank
  }
}

function clone<T>(value: T): T {
  return typeof structuredClone === 'function'
    ? structuredClone(value)
    : (JSON.parse(JSON.stringify(value)) as T)
}

export const repository: Repository = new LocalStorageRepository()
