import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient'

type AuthStatus = 'checking' | 'signed-out' | 'signed-in'

interface AuthValue {
  /** False when the app is running local-only (no Supabase env vars) - the
   *  whole app renders unauthenticated in that mode, exactly as before. */
  cloud: boolean
  status: AuthStatus
  email: string | null
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(isSupabaseConfigured ? 'checking' : 'signed-in')
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => {
      setStatus(data.session ? 'signed-in' : 'signed-out')
      setEmail(data.session?.user.email ?? null)
    })
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setStatus(session ? 'signed-in' : 'signed-out')
      setEmail(session?.user.email ?? null)
    })
    return () => subscription.subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ cloud: isSupabaseConfigured, status, email, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
