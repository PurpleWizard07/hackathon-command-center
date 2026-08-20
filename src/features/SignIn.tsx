import { useState, type FormEvent } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button, Field, Input } from '@/components/ui'

export function SignIn() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!supabase || sending) return
    setSending(true)
    setError('')
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin + window.location.pathname },
    })
    setSending(false)
    if (authError) {
      setError(authError.message)
      return
    }
    setSent(true)
  }

  return (
    <main className="auth-screen">
      <div className="panel auth-card">
        <div className="panel__body auth-card__body">
          <div>
            <h1 className="auth-card__title">Command Center</h1>
            <p className="prose">
              Sign in with your email to sync your hackathons across every device.
            </p>
          </div>

          {sent ? (
            <p className="prose">
              Check <strong>{email.trim()}</strong> for a sign-in link, then open it on this
              device.
            </p>
          ) : (
            <form onSubmit={submit} className="auth-card__form">
              <Field label="Email" htmlFor="auth-email" error={error || undefined}>
                <Input
                  id="auth-email"
                  type="email"
                  autoFocus
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError('')
                  }}
                />
              </Field>
              <Button type="submit" variant="primary" disabled={sending || !email.trim()}>
                {sending ? 'Sending link…' : 'Send sign-in link'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
