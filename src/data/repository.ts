/* ============================================================================
   Persistence boundary.

   The UI talks to `Repository` and nothing else. Today it is backed by
   localStorage, or by Supabase when `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`
   are set (see supabaseRepository.ts) - no component changes either way.
   ========================================================================== */

import type { CommandCenterData } from '@/types'
import { buildSeedData } from './seed'
import { isSupabaseConfigured } from '@/lib/supabaseClient'
import { DATA_VERSION, emptyData, normalize } from './model'
import { SupabaseRepository } from './supabaseRepository'

export { DATA_VERSION, emptyData } from './model'

const STORAGE_KEY = `hcc:data:v${DATA_VERSION}`

export interface Repository {
  load(): Promise<CommandCenterData>
  save(data: CommandCenterData): Promise<void>
  reset(): Promise<CommandCenterData>
  clear(): Promise<CommandCenterData>
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

export const repository: Repository = isSupabaseConfigured
  ? new SupabaseRepository()
  : new LocalStorageRepository()
