/* ============================================================================
   Cloud persistence. Same `Repository` shape as the localStorage version -
   the whole `CommandCenterData` document is stored as one JSONB row per
   user, so the relational schema is a single table (see supabase/schema.sql)
   and no component ever needs to know which backend is active.
   ========================================================================== */

import type { CommandCenterData } from '@/types'
import { supabase } from '@/lib/supabaseClient'
import type { Repository } from './repository'
import { emptyData, normalize } from './model'
import { buildSeedData } from './seed'

const TABLE = 'hackathon_data'

async function currentUserId(): Promise<string> {
  if (!supabase) throw new Error('Supabase is not configured.')
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  if (!data.user) throw new Error('Not signed in.')
  return data.user.id
}

export class SupabaseRepository implements Repository {
  async load(): Promise<CommandCenterData> {
    if (!supabase) throw new Error('Supabase is not configured.')
    const userId = await currentUserId()
    const { data, error } = await supabase
      .from(TABLE)
      .select('data')
      .eq('user_id', userId)
      .maybeSingle()
    if (error) throw new Error('Could not load your data from Supabase.', { cause: error })

    if (!data) {
      const seeded = buildSeedData()
      await this.save(seeded)
      return seeded
    }
    return normalize(data.data) ?? buildSeedData()
  }

  async save(data: CommandCenterData): Promise<void> {
    if (!supabase) throw new Error('Supabase is not configured.')
    const userId = await currentUserId()
    const { error } = await supabase
      .from(TABLE)
      .upsert({ user_id: userId, data, updated_at: new Date().toISOString() })
    if (error) throw new Error('Could not save your changes to Supabase.', { cause: error })
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
