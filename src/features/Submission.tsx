import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import type { HackathonBundle, SubmissionItem } from '@/types'
import { useStore } from '@/store/StoreProvider'
import { blockers, submissionReadiness } from '@/lib/derive'
import { isValidUrl, percent, ratio } from '@/lib/format'
import {
  Badge,
  Button,
  CheckButton,
  EmptyState,
  Input,
  ProgressBar,
  Textarea,
  useToast,
} from '@/components/ui'
import { IconPencil, IconTrash } from '@/components/icons'

export function Submission() {
  const bundle = useOutletContext<HackathonBundle>()
  const { dispatch } = useStore()
  const toast = useToast()
  const { hackathon, submissionItems, requirements } = bundle

  const readiness = submissionReadiness(submissionItems)
  const outstanding = blockers({ requirements, submissionItems })
  const ready = readiness.pct === 100 && readiness.total > 0
  const optional = submissionItems.filter((i) => !i.required)
  const required = submissionItems.filter((i) => i.required)

  const markSubmitted = () => {
    dispatch({ type: 'hackathon/update', id: hackathon.id, patch: { status: 'submitted' } })
    toast('Marked as submitted', 'success')
  }

  return (
    <div className="stack">
      <section className={`readiness${ready ? ' readiness--ready' : ''}`}>
        <div className="readiness__top">
          <div>
            <span className="u-label">Submission readiness</span>
            <div className="readiness__value" style={{ marginTop: 'var(--sp-4)' }}>
              {readiness.total === 0 ? '—' : Math.round(readiness.pct)}
              {readiness.total > 0 && <span className="readiness__pct">%</span>}
            </div>
          </div>
          <div className="inline-actions">
            {ready ? <Badge tone="success">Ready to submit</Badge> : null}
            {hackathon.status !== 'submitted' && hackathon.status !== 'results' && (
              <Button variant={ready ? 'primary' : 'secondary'} onClick={markSubmitted}>
                Mark as submitted
              </Button>
            )}
          </div>
        </div>

        <ProgressBar
          value={readiness.pct}
          tone={ready ? 'success' : readiness.pct > 50 ? 'accent' : 'warn'}
          label="Submission readiness"
        />

        <p className="readiness__hint">
          {readiness.total === 0
            ? 'No submission items yet. Add what this hackathon asks for and track it here.'
            : ready
              ? 'Every required item is filled in. Send it, then mark it submitted.'
              : `${ratio(readiness.done, readiness.total)} required items complete. ${outstanding.length} thing${
                  outstanding.length === 1 ? '' : 's'
                } still blocking submission.`}
        </p>

        {!ready && outstanding.length > 0 && (
          <div className="tags">
            {outstanding.slice(0, 6).map((blocker) => (
              <Badge key={blocker.id} tone={blocker.area === 'submission' ? 'warn' : 'neutral'}>
                {blocker.title}
              </Badge>
            ))}
            {outstanding.length > 6 && <Badge>+{outstanding.length - 6} more</Badge>}
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel__head">
          <h3 className="panel__title">Required</h3>
          <span className="panel__meta">
            {ratio(readiness.done, readiness.total)} · {percent(readiness.pct)}
          </span>
        </div>
        <div className="panel__body panel__body--flush">
          {required.length === 0 ? (
            <div style={{ padding: 'var(--sp-6)' }}>
              <EmptyState
                compact
                title="Nothing required yet."
                body="Add the fields this hackathon asks for — project name, repo, demo video, and anything else."
              />
            </div>
          ) : (
            <div className="row-list">
              {required.map((item) => (
                <Item key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </section>

      {optional.length > 0 && (
        <section className="panel">
          <div className="panel__head">
            <h3 className="panel__title">Optional</h3>
            <span className="panel__meta">Does not block submission</span>
          </div>
          <div className="panel__body panel__body--flush">
            <div className="row-list">
              {optional.map((item) => (
                <Item key={item.id} item={item} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

function Item({ item }: { item: SubmissionItem }) {
  const { dispatch } = useStore()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(item.value)

  const isCheck = item.kind === 'check'
  const invalidUrl = item.kind === 'url' && draft.trim().length > 0 && !isValidUrl(draft)

  const save = () => {
    if (invalidUrl) return
    dispatch({ type: 'submission/update', id: item.id, patch: { value: draft.trim() } })
    setEditing(false)
  }

  const cancel = () => {
    setDraft(item.value)
    setEditing(false)
  }

  return (
    <div className="sitem">
      <div className="sitem__head">
        <CheckButton
          checked={item.completed}
          label={`Mark "${item.title}" ${item.completed ? 'incomplete' : 'complete'}`}
          onToggle={() =>
            dispatch({
              type: 'submission/update',
              id: item.id,
              patch: isCheck
                ? { value: item.completed ? '' : 'true', completed: !item.completed }
                : { completed: !item.completed },
            })
          }
        />
        <div className="crow__main">
          <span className={`crow__title${item.completed ? ' crow__title--done' : ''}`}>
            {item.title}
          </span>
          {item.description && <span className="crow__desc">{item.description}</span>}
        </div>
        <div className="crow__aside">
          {!item.required && <span className="tag-optional">Optional</span>}
          {!isCheck && !editing && (
            <button
              type="button"
              className="icon-btn"
              aria-label={`Edit ${item.title}`}
              onClick={() => {
                setDraft(item.value)
                setEditing(true)
              }}
            >
              <IconPencil />
            </button>
          )}
          <button
            type="button"
            className="icon-btn icon-btn--danger"
            aria-label={`Remove ${item.title}`}
            onClick={() => dispatch({ type: 'submission/remove', id: item.id })}
          >
            <IconTrash />
          </button>
        </div>
      </div>

      {!isCheck && editing && (
        <>
          <div className="sitem__editor">
            {item.kind === 'longtext' ? (
              <Textarea
                autoFocus
                rows={4}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                aria-label={item.title}
              />
            ) : (
              <Input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={item.kind === 'url' ? 'https://' : ''}
                aria-label={item.title}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') save()
                  if (e.key === 'Escape') cancel()
                }}
              />
            )}
            {invalidUrl && (
              <p className="field__error" role="alert" style={{ marginTop: 'var(--sp-3)' }}>
                Enter a full URL starting with http:// or https://
              </p>
            )}
          </div>
          <div className="sitem__actions">
            <Button size="sm" variant="primary" onClick={save} disabled={invalidUrl}>
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={cancel}>
              Cancel
            </Button>
          </div>
        </>
      )}

      {!isCheck && !editing && (
        <div className={item.value ? 'sitem__value' : 'sitem__empty'}>
          {item.value ? (
            item.kind === 'url' && isValidUrl(item.value) ? (
              <a href={item.value} target="_blank" rel="noreferrer noopener">
                {item.value}
              </a>
            ) : (
              item.value
            )
          ) : (
            'Not filled in yet'
          )}
        </div>
      )}
    </div>
  )
}
