import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import type { HackathonBundle } from '@/types'
import { useStore } from '@/store/StoreProvider'
import {
  requirementCompletion,
  STATUS_LABEL,
  submissionReadiness,
  taskCompletion,
} from '@/lib/derive'
import { money, percent, ratio } from '@/lib/format'
import { formatDateYear, formatDeadline } from '@/lib/time'
import { Badge, Button, CheckButton, EmptyState, Input, ProgressBar } from '@/components/ui'
import { LinkRow, Metric } from '@/components/shared'
import { IconPlus, IconTrash } from '@/components/icons'

export function Overview() {
  const bundle = useOutletContext<HackathonBundle>()
  const { dispatch } = useStore()
  const { hackathon, requirements, criteria, links, submissionItems, tasks } = bundle
  const [newRequirement, setNewRequirement] = useState('')

  const reqDone = requirementCompletion(requirements)
  const readiness = submissionReadiness(submissionItems)
  const taskDone = taskCompletion(tasks)

  const addRequirement = () => {
    const title = newRequirement.trim()
    if (!title) return
    dispatch({
      type: 'requirement/add',
      hackathonId: hackathon.id,
      patch: { title, required: true },
    })
    setNewRequirement('')
  }

  return (
    <div className="split">
      <div className="stack">
        <section className="panel">
          <div className="panel__head">
            <h3 className="panel__title">Hackathon</h3>
            <span className="panel__meta">
              Updated {formatDateYear(hackathon.updatedAt)}
            </span>
          </div>
          <div className="panel__body stack">
            <div className="defs">
              <Metric label="Platform" value={hackathon.platform} />
              <Metric label="Prize pool" value={money(hackathon.prizePool, hackathon.currency)} />
              <Metric label="Deadline" value={formatDeadline(hackathon.deadline)} />
              <Metric label="Status" value={STATUS_LABEL[hackathon.status]} />
              <Metric
                label="Registered"
                value={hackathon.registeredAt ? formatDateYear(hackathon.registeredAt) : '—'}
              />
              <Metric label="Project" value={hackathon.projectName || 'Not named yet'} />
            </div>
            {hackathon.description && <p className="prose">{hackathon.description}</p>}
            {hackathon.tags.length > 0 && (
              <div className="tags">
                {hackathon.tags.map((tag) => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </div>
            )}
            {hackathon.result && (
              <div className="notice">
                <span>
                  <strong>Result.</strong> {hackathon.result}
                </span>
              </div>
            )}
          </div>
        </section>

        <section className="panel">
          <div className="panel__head">
            <h3 className="panel__title">Requirements</h3>
            <span className="panel__meta">
              {ratio(reqDone.done, reqDone.total)} · {percent(reqDone.pct)}
            </span>
          </div>
          <div className="panel__body panel__body--flush">
            {requirements.length === 0 ? (
              <div style={{ padding: 'var(--sp-6)' }}>
                <EmptyState
                  compact
                  title="No requirements captured."
                  body="Add what the organisers are asking for so nothing gets missed on submission day."
                />
              </div>
            ) : (
              <div className="row-list">
                {requirements.map((req) => (
                  <div className="crow" key={req.id}>
                    <CheckButton
                      checked={req.completed}
                      label={`Mark "${req.title}" ${req.completed ? 'incomplete' : 'complete'}`}
                      onToggle={() =>
                        dispatch({
                          type: 'requirement/update',
                          id: req.id,
                          patch: { completed: !req.completed },
                        })
                      }
                    />
                    <div className="crow__main">
                      <span
                        className={`crow__title${req.completed ? ' crow__title--done' : ''}`}
                      >
                        {req.title}
                      </span>
                      {req.description && <span className="crow__desc">{req.description}</span>}
                    </div>
                    <div className="crow__aside">
                      {!req.required && <span className="tag-optional">Optional</span>}
                      <button
                        type="button"
                        className="icon-btn icon-btn--danger"
                        aria-label={`Delete requirement ${req.title}`}
                        onClick={() => dispatch({ type: 'requirement/remove', id: req.id })}
                      >
                        <IconTrash />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div
              className="crow"
              style={{ borderTop: '1px solid var(--border-subtle)', gap: 'var(--sp-3)' }}
            >
              <Input
                value={newRequirement}
                onChange={(e) => setNewRequirement(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addRequirement()
                  }
                }}
                placeholder="Add a requirement"
                aria-label="New requirement"
              />
              <Button onClick={addRequirement} disabled={!newRequirement.trim()}>
                <IconPlus style={{ width: 13, height: 13 }} />
                Add
              </Button>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel__head">
            <h3 className="panel__title">Judging criteria</h3>
            <span className="panel__meta">
              {criteria.some((c) => c.weight !== undefined) ? 'Weighted' : 'Unweighted'}
            </span>
          </div>
          <div className="panel__body panel__body--flush">
            {criteria.length === 0 ? (
              <div style={{ padding: 'var(--sp-6)' }}>
                <EmptyState
                  compact
                  title="No criteria recorded."
                  body="Add the rubric the judges publish so you can aim at it while building."
                />
              </div>
            ) : (
              <div className="row-list">
                {criteria.map((criterion) => (
                  <div className="criterion" key={criterion.id}>
                    <div className="criterion__head">
                      <span className="criterion__title">{criterion.title}</span>
                      {criterion.weight !== undefined && (
                        <span className="criterion__weight">{criterion.weight}%</span>
                      )}
                    </div>
                    {criterion.description && (
                      <p className="crow__desc">{criterion.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="stack">
        <section className="panel">
          <div className="panel__head">
            <h3 className="panel__title">Where things stand</h3>
          </div>
          <div className="panel__body stack">
            <ProgressRow
              label="Submission readiness"
              done={readiness.done}
              total={readiness.total}
              pct={readiness.pct}
            />
            <ProgressRow
              label="Requirements"
              done={reqDone.done}
              total={reqDone.total}
              pct={reqDone.pct}
            />
            <ProgressRow
              label="Tasks"
              done={taskDone.done}
              total={taskDone.total}
              pct={taskDone.pct}
            />
          </div>
        </section>

        <section className="panel">
          <div className="panel__head">
            <h3 className="panel__title">Important links</h3>
            <span className="panel__meta">{links.length}</span>
          </div>
          <div className="panel__body panel__body--flush">
            {links.length === 0 ? (
              <div style={{ padding: 'var(--sp-6)' }}>
                <EmptyState
                  compact
                  title="No links yet."
                  body="Keep the rules page, Discord and submission form one click away. Add them in Settings."
                />
              </div>
            ) : (
              <div className="row-list">
                {links.map((link) => (
                  <LinkRow key={link.id} title={link.title} url={link.url} type={link.type} />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function ProgressRow({
  label,
  done,
  total,
  pct,
}: {
  label: string
  done: number
  total: number
  pct: number
}) {
  return (
    <div className="hcard__progress">
      <div className="hcard__progress-row">
        <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <span className="hcard__pct">
          {total === 0 ? '—' : `${ratio(done, total)} · ${percent(pct)}`}
        </span>
      </div>
      <ProgressBar
        value={total === 0 ? 0 : pct}
        tone={total === 0 ? 'neutral' : pct === 100 ? 'success' : 'accent'}
        label={label}
      />
    </div>
  )
}
