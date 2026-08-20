import { NavLink, Outlet, useParams, Link } from 'react-router-dom'
import { useBundle, useStore } from '@/store/StoreProvider'
import { STATUS_LABEL, summarize } from '@/lib/derive'
import { money, percent } from '@/lib/format'
import { countdown, formatDeadline } from '@/lib/time'
import { Button, EmptyState, ProgressBar, Segmented, Skeleton } from '@/components/ui'
import {
  CountdownText,
  countdownTone,
  Divider,
  Metric,
  PlatformMark,
  StatusBadge,
} from '@/components/shared'
import {
  IconArrowLeft,
  IconAssets,
  IconOverview,
  IconSettings,
  IconSubmission,
  IconTasks,
} from '@/components/icons'
import { useNavigate, useLocation } from 'react-router-dom'

const NAV = [
  { to: '', label: 'Overview', Icon: IconOverview },
  { to: 'submission', label: 'Submission', Icon: IconSubmission },
  { to: 'tasks', label: 'Tasks', Icon: IconTasks },
  { to: 'assets', label: 'Assets', Icon: IconAssets },
] as const

export function Workspace() {
  const { id } = useParams<{ id: string }>()
  const { status, now } = useStore()
  const bundle = useBundle(id)
  const navigate = useNavigate()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <div className="page" aria-hidden="true">
        <Skeleton h={14} w={160} />
        <div style={{ height: 20 }} />
        <Skeleton h={28} w={280} />
        <div style={{ height: 28 }} />
        <Skeleton h={120} r={10} />
      </div>
    )
  }

  if (!bundle) {
    return (
      <main className="page">
        <EmptyState
          title="Hackathon not found."
          body="It may have been deleted. Head back to the command center to see everything you are still tracking."
          action={
            <Button variant="primary" onClick={() => navigate('/')}>
              Back to dashboard
            </Button>
          }
        />
      </main>
    )
  }

  const { hackathon, tasks, submissionItems } = bundle
  const summary = summarize(bundle, now)
  const openTasks = tasks.filter((t) => t.status !== 'done').length
  const missing = submissionItems.filter((i) => i.required && !i.completed).length

  const counts: Record<string, number | undefined> = {
    '': undefined,
    submission: missing || undefined,
    tasks: openTasks || undefined,
    assets: bundle.assets.length || undefined,
  }

  // Which nav entry the mobile selector should show as current.
  const segment = location.pathname.split(`/h/${hackathon.id}`)[1]?.replace(/^\//, '') ?? ''
  const current = segment === '' ? '' : segment.split('/')[0]

  return (
    <div className="ws">
      <aside className="rail">
        <Link to="/" className="rail__back">
          <IconArrowLeft />
          All hackathons
        </Link>

        <div className="rail__identity">
          <h1 className="rail__name">{hackathon.name}</h1>
          <span className="rail__platform">
            <PlatformMark platform={hackathon.platform} />
            {hackathon.platform}
          </span>
        </div>

        <nav className="rail__nav" aria-label="Workspace sections">
          {NAV.map(({ to, label, Icon }) => (
            <NavLink
              key={label}
              to={to ? `/h/${hackathon.id}/${to}` : `/h/${hackathon.id}`}
              end={to === ''}
              className={({ isActive }) => `navitem${isActive ? ' is-active' : ''}`}
            >
              <Icon />
              {label}
              {counts[to] !== undefined && (
                <span className="navitem__count">{counts[to]}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="rail__spacer" />

        <div className="rail__group">
          <NavLink
            to={`/h/${hackathon.id}/settings`}
            className={({ isActive }) => `navitem${isActive ? ' is-active' : ''}`}
          >
            <IconSettings />
            Settings
          </NavLink>
        </div>
      </aside>

      <div className="ws__main">
        <div className="rail-mobile">
          <Segmented
            label="Workspace sections"
            value={current}
            onChange={(next) =>
              navigate(next ? `/h/${hackathon.id}/${next}` : `/h/${hackathon.id}`)
            }
            options={[
              ...NAV.map((n) => ({ value: n.to as string, label: n.label })),
              { value: 'settings', label: 'Settings' },
            ]}
          />
        </div>

        <header className="wshead">
          <div className="wshead__top">
            <div style={{ minWidth: 0 }}>
              <div className="wshead__crumbs">
                <Link to="/">Command Center</Link>
                <span aria-hidden="true">/</span>
                <span>{hackathon.platform}</span>
              </div>
              <h2 className="wshead__title">{hackathon.name}</h2>
            </div>
            <div className="inline-actions">
              <StatusBadge status={hackathon.status} />
            </div>
          </div>

          <div className="wshead__context">
            <Metric label="Prize pool" value={money(hackathon.prizePool, hackathon.currency)} />
            <Divider />
            <Metric label="Deadline" value={formatDeadline(hackathon.deadline)} />
            <Divider />
            <Metric
              label="Time remaining"
              value={<CountdownText countdown={countdown(hackathon.deadline, now)} />}
            />
            <Divider />
            <Metric label="Status" value={STATUS_LABEL[hackathon.status]} />
            <Divider />
            <div className="ctx" style={{ minWidth: 148 }}>
              <span className="u-label">Progress · {percent(summary.progress.pct)}</span>
              <ProgressBar
                value={summary.progress.pct}
                tone={
                  summary.progress.pct === 100
                    ? 'success'
                    : countdownTone(summary.countdown) === 'danger'
                      ? 'danger'
                      : 'accent'
                }
                label="Overall progress"
              />
            </div>
          </div>
        </header>

        <div className="ws__body">
          <Outlet context={bundle} />
        </div>
      </div>
    </div>
  )
}
