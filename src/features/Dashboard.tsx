import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore, useSummaries } from '@/store/StoreProvider'
import { isActive, isClosed, type HackathonSummary } from '@/lib/derive'
import { money, moneyCompact, percent, pluralize } from '@/lib/format'
import { formatDeadline, formatLongDate } from '@/lib/time'
import {
  Button,
  ConfirmDialog,
  EmptyState,
  ProgressBar,
  Segmented,
  Skeleton,
} from '@/components/ui'
import {
  CountdownText,
  countdownTone,
  PlatformMark,
  StatusBadge,
} from '@/components/shared'
import { IconPlus } from '@/components/icons'
import { HackathonFormDialog } from './HackathonForm'

type Filter = 'all' | 'active' | 'ready' | 'submitted'

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'ready', label: 'Ready to Submit' },
  { value: 'submitted', label: 'Submitted' },
]

function matches(filter: Filter, s: HackathonSummary): boolean {
  switch (filter) {
    case 'active':
      return isActive(s.hackathon.status)
    case 'ready':
      return s.hackathon.status === 'ready'
    case 'submitted':
      return isClosed(s.hackathon.status)
    default:
      return true
  }
}

export function Dashboard() {
  const { status, error, now, reset } = useStore()
  const summaries = useSummaries()
  const [filter, setFilter] = useState<Filter>('all')
  const [adding, setAdding] = useState(false)
  const [resetting, setResetting] = useState(false)

  const counts = useMemo(
    () => ({
      all: summaries.length,
      active: summaries.filter((s) => matches('active', s)).length,
      ready: summaries.filter((s) => matches('ready', s)).length,
      submitted: summaries.filter((s) => matches('submitted', s)).length,
    }),
    [summaries],
  )

  const visible = useMemo(
    () => summaries.filter((s) => matches(filter, s)),
    [summaries, filter],
  )

  const activeOnes = useMemo(
    () => summaries.filter((s) => isActive(s.hackathon.status)),
    [summaries],
  )

  const prizePool = activeOnes.reduce((sum, s) => sum + s.hackathon.prizePool, 0)
  const nextUp = activeOnes.find((s) => !s.countdown.passed) ?? activeOnes[0]
  const submittedCount = summaries.filter((s) => isClosed(s.hackathon.status)).length
  const totalBlockers = activeOnes.reduce((sum, s) => sum + s.blockerCount, 0)

  if (status === 'error') {
    return (
      <main className="page">
        <div className="error-state">
          <h1 className="hero__title">Something went wrong</h1>
          <p className="prose">{error ?? 'Your data could not be loaded.'}</p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Reload
          </Button>
        </div>
      </main>
    )
  }

  return (
    <main className="page">
      <header className="hero">
        <div>
          <span className="u-label hero__eyebrow">
            {formatLongDate(new Date(now))}
          </span>
          <h1 className="hero__title">Hackathon Command Center</h1>
          <p className="hero__sub">
            {status === 'loading'
              ? 'Loading your hackathons.'
              : summaries.length === 0
                ? 'Nothing tracked yet.'
                : `${pluralize(activeOnes.length, 'hackathon')} in flight` +
                  (totalBlockers > 0
                    ? ` · ${pluralize(totalBlockers, 'item')} still blocking a submission.`
                    : ' · nothing blocking a submission.')}
          </p>
        </div>
        <Button variant="primary" onClick={() => setAdding(true)}>
          <IconPlus style={{ width: 14, height: 14 }} />
          Add Hackathon
        </Button>
      </header>

      {status === 'loading' ? (
        <DashboardSkeleton />
      ) : (
        <>
          <section className="stats" aria-label="Summary">
            <div className="stat">
              <span className="u-label">Active hackathons</span>
              <span className="stat__value">{activeOnes.length}</span>
              <span className="stat__foot">
                {summaries.length > 0
                  ? `${summaries.length} tracked in total`
                  : 'Nothing tracked yet'}
              </span>
            </div>
            <div className="stat">
              <span className="u-label">Total prize pool</span>
              <span className="stat__value">
                {prizePool > 0 ? moneyCompact(prizePool) : '—'}
              </span>
              <span className="stat__foot">Across active hackathons</span>
            </div>
            <div className="stat">
              <span className="u-label">Next deadline</span>
              <span className="stat__value">
                {nextUp ? nextUp.countdown.short : '—'}
                {nextUp && <span className="stat__unit">remaining</span>}
              </span>
              <span
                className={
                  nextUp?.countdown.urgency === 'critical'
                    ? 'stat__foot stat__foot--danger'
                    : nextUp?.countdown.urgency === 'soon'
                      ? 'stat__foot stat__foot--warn'
                      : 'stat__foot'
                }
              >
                {nextUp ? nextUp.hackathon.name : 'No active deadlines'}
              </span>
            </div>
            <div className="stat">
              <span className="u-label">Submitted</span>
              <span className="stat__value">{submittedCount}</span>
              <span className="stat__foot">
                {counts.ready > 0
                  ? `${counts.ready} ready to send`
                  : 'Nothing waiting to send'}
              </span>
            </div>
          </section>

          <div className="toolbar">
            <Segmented
              label="Filter hackathons"
              value={filter}
              onChange={setFilter}
              options={FILTERS.map((f) => ({ ...f, count: counts[f.value] }))}
            />
            <div className="inline-actions">
              {visible.length > 0 && <span className="u-label">Sorted by deadline</span>}
              <Button size="sm" variant="ghost" onClick={() => setResetting(true)}>
                Reset sample data
              </Button>
            </div>
          </div>

          {summaries.length === 0 ? (
            <EmptyState
              title="No hackathons yet."
              body="Add your first registered hackathon and start building. Deadlines, requirements and submission items all live here."
              action={
                <Button variant="primary" onClick={() => setAdding(true)}>
                  Add Hackathon
                </Button>
              }
            />
          ) : visible.length === 0 ? (
            <EmptyState
              compact
              title="Nothing in this view."
              body="No hackathons match this filter right now. Switch back to All to see everything you are tracking."
              action={<Button onClick={() => setFilter('all')}>Show all</Button>}
            />
          ) : (
            <section className="card-grid">
              {visible.map((summary, index) => (
                <HackathonCard key={summary.hackathon.id} summary={summary} index={index} />
              ))}
            </section>
          )}
        </>
      )}

      <HackathonFormDialog open={adding} onClose={() => setAdding(false)} />

      <ConfirmDialog
        open={resetting}
        onClose={() => setResetting(false)}
        onConfirm={reset}
        title="Reset to sample data?"
        body="This replaces everything currently stored with the original sample hackathons. Anything you have added or edited will be lost."
        confirmLabel="Reset data"
      />
    </main>
  )
}

function HackathonCard({ summary, index }: { summary: HackathonSummary; index: number }) {
  const { hackathon, countdown, progress, blockerCount } = summary
  const critical = countdown.urgency === 'critical' && isActive(hackathon.status)

  return (
    <Link
      to={`/h/${hackathon.id}`}
      className={`hcard u-rise${critical ? ' hcard--critical' : ''}`}
      style={{ animationDelay: `${Math.min(index, 8) * 28}ms` }}
      aria-label={`${hackathon.name} on ${hackathon.platform}`}
    >
      <div className="hcard__top">
        <span className="hcard__platform">
          <PlatformMark platform={hackathon.platform} />
          <span className="u-label u-truncate">{hackathon.platform}</span>
        </span>
        <StatusBadge status={hackathon.status} />
      </div>

      <div>
        <h2 className="hcard__name">{hackathon.name}</h2>
        {hackathon.projectName ? (
          <p className="hcard__project">
            Project <b>{hackathon.projectName}</b>
          </p>
        ) : (
          <p className="hcard__project">No project named yet</p>
        )}
      </div>

      <div className="hcard__figures">
        <div className="figure">
          <span className="u-label">Prize pool</span>
          <span className="figure__value">{money(hackathon.prizePool, hackathon.currency)}</span>
        </div>
        <div className="figure figure--end">
          <span className="u-label">Deadline</span>
          <span className="figure__value figure__value--sm">
            {formatDeadline(hackathon.deadline)}
          </span>
        </div>
      </div>

      <div className="hcard__progress">
        <div className="hcard__progress-row">
          <span className="u-label">Progress</span>
          <span className="hcard__pct">{percent(progress.pct)}</span>
        </div>
        <ProgressBar
          value={progress.pct}
          tone={progress.pct === 100 ? 'success' : 'accent'}
          label={`${hackathon.name} progress`}
        />
      </div>

      <div className="hcard__foot">
        <CountdownText countdown={countdown} />
        <span className="hcard__blockers">
          {hackathon.status === 'results' && hackathon.result
            ? 'Result in'
            : blockerCount > 0
              ? `${blockerCount} blocking`
              : 'Clear to submit'}
        </span>
      </div>
    </Link>
  )
}

function DashboardSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="stats">
        {[0, 1, 2, 3].map((i) => (
          <div className="stat" key={i}>
            <Skeleton h={10} w={84} />
            <Skeleton h={26} w={110} />
            <Skeleton h={10} w={130} />
          </div>
        ))}
      </div>
      <div className="toolbar">
        <Skeleton h={34} w={320} r={8} />
      </div>
      <div className="card-grid">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div className="hcard" key={i} style={{ gap: 'var(--sp-6)' }}>
            <div className="hcard__top">
              <Skeleton h={20} w={110} />
              <Skeleton h={21} w={72} r={6} />
            </div>
            <Skeleton h={20} w="72%" />
            <div className="hcard__figures">
              <Skeleton h={24} w={104} />
              <Skeleton h={16} w={92} />
            </div>
            <Skeleton h={4} r={999} />
            <Skeleton h={12} w={120} />
          </div>
        ))}
      </div>
    </div>
  )
}

/** Convenience export used by the countdown tone helper in tests/readability. */
export { countdownTone }
