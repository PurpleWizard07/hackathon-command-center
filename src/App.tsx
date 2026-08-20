import { Link, Navigate, Route, Routes } from 'react-router-dom'
import { StoreProvider, useStore } from '@/store/StoreProvider'
import { AuthProvider, useAuth } from '@/store/AuthProvider'
import { ToastProvider } from '@/components/ui'
import { formatClock, timeZoneLabel } from '@/lib/time'
import { Dashboard } from '@/features/Dashboard'
import { Workspace } from '@/features/Workspace'
import { Overview } from '@/features/Overview'
import { Submission } from '@/features/Submission'
import { Tasks } from '@/features/Tasks'
import { Assets } from '@/features/Assets'
import { Settings } from '@/features/Settings'
import { SignIn } from '@/features/SignIn'

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  )
}

/** Local-only mode skips this entirely and always renders the app. In cloud
 *  mode, keying StoreProvider by email forces a clean remount - and a fresh
 *  `repository.load()` - whenever the signed-in user changes. */
function AuthGate() {
  const { cloud, status, email } = useAuth()

  if (cloud && status === 'checking') return null
  if (cloud && status === 'signed-out') return <SignIn />

  return (
    <StoreProvider key={email ?? 'local'}>
      <ToastProvider>
        <div className="shell">
          <TopBar />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/h/:id" element={<Workspace />}>
              <Route index element={<Overview />} />
              <Route path="submission" element={<Submission />} />
              <Route path="tasks" element={<Tasks />} />
              <Route path="assets" element={<Assets />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </ToastProvider>
    </StoreProvider>
  )
}

function TopBar() {
  const { now, data } = useStore()
  const { cloud, email, signOut } = useAuth()
  const zone = timeZoneLabel()
  return (
    <header className="topbar">
      <Link to="/" className="topbar__brand">
        <span className="topbar__mark" aria-hidden="true">
          HC
        </span>
        Command Center
      </Link>
      <span className="topbar__spacer" />
      <span className="topbar__clock">
        <span>{data.hackathons.length} tracked</span>
        <span aria-hidden="true" style={{ color: 'var(--text-quaternary)' }}>
          ·
        </span>
        <span>
          {formatClock(new Date(now))} {zone}
        </span>
        {cloud && (
          <>
            <span aria-hidden="true" style={{ color: 'var(--text-quaternary)' }}>
              ·
            </span>
            <span>{email}</span>
            <button type="button" className="topbar__signout" onClick={() => void signOut()}>
              Sign out
            </button>
          </>
        )}
      </span>
    </header>
  )
}
