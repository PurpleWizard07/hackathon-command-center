import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** True once both env vars are set. The app falls back to local-only
 *  storage when they are not, so it keeps working before Supabase is
 *  configured. */
export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        // The app routes with HashRouter (so hosting it needs zero server
        // config). The default "implicit" auth flow also returns the
        // session in a URL hash fragment, which would collide with the
        // router reading `location.hash` on the same navigation. PKCE
        // returns the code as a query param instead, so the two never
        // fight over the URL.
        flowType: 'pkce',
      },
    })
  : null
