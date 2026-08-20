import { Link, Navigate, Route, Routes } from 'react-router-dom'
import { StoreProvider, useStore } from '@/store/StoreProvider'
import { ToastProvider } from '@/components/ui'
import { formatClock, timeZoneLabel } from '@/lib/time'
import { Dashboard } from '@/features/Dashboard'
import { Workspace } from '@/features/Workspace'
import { Overview } from '@/features/Overview'
import { Submission } from '@/features/Submission'
import { Tasks } from '@/features/Tasks'
import { Assets } from '@/features/Assets'
import { Settings } from '@/features/Settings'

export default function App() {
  return (
    <StoreProvider>
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
      </span>
    </header>
  )
}
