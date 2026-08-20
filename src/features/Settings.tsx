import { useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import type { HackathonBundle, HackathonStatus, LinkType } from '@/types'
import { useStore } from '@/store/StoreProvider'
import { STATUS_LABEL, STATUS_ORDER } from '@/lib/derive'
import { isValidUrl } from '@/lib/format'
import { fromDateInput, toDateTimeLocal } from '@/lib/time'
import {
  Button,
  ConfirmDialog,
  Field,
  Input,
  Select,
  Textarea,
  useToast,
} from '@/components/ui'
import { LINK_TYPE_LABEL, LinkRow } from '@/components/shared'
import { IconPlus, IconTrash } from '@/components/icons'

export function Settings() {
  const bundle = useOutletContext<HackathonBundle>()
  const { hackathon, links } = bundle
  const { dispatch } = useStore()
  const navigate = useNavigate()
  const toast = useToast()

  const [name, setName] = useState(hackathon.name)
  const [platform, setPlatform] = useState(hackathon.platform)
  const [prizePool, setPrizePool] = useState(String(hackathon.prizePool))
  const [deadline, setDeadline] = useState(toDateTimeLocal(hackathon.deadline))
  const [status, setStatus] = useState<HackathonStatus>(hackathon.status)
  const [projectName, setProjectName] = useState(hackathon.projectName)
  const [description, setDescription] = useState(hackathon.description)
  const [result, setResult] = useState(hackathon.result ?? '')
  const [tags, setTags] = useState(hackathon.tags.join(', '))
  const [errors, setErrors] = useState<{ name?: string; deadline?: string }>({})
  const [confirming, setConfirming] = useState(false)

  const [linkTitle, setLinkTitle] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [linkType, setLinkType] = useState<LinkType>('website')
  const [linkError, setLinkError] = useState('')

  const dirty =
    name !== hackathon.name ||
    platform !== hackathon.platform ||
    prizePool !== String(hackathon.prizePool) ||
    deadline !== toDateTimeLocal(hackathon.deadline) ||
    status !== hackathon.status ||
    projectName !== hackathon.projectName ||
    description !== hackathon.description ||
    result !== (hackathon.result ?? '') ||
    tags !== hackathon.tags.join(', ')

  const save = () => {
    const next: typeof errors = {}
    if (!name.trim()) next.name = 'A name is required.'
    if (!deadline) next.deadline = 'A deadline is required.'
    if (Object.keys(next).length > 0) {
      setErrors(next)
      return
    }
    dispatch({
      type: 'hackathon/update',
      id: hackathon.id,
      patch: {
        name: name.trim(),
        platform: platform.trim(),
        prizePool: Number(prizePool.replace(/[^0-9.]/g, '')) || 0,
        deadline: fromDateInput(deadline),
        status,
        projectName: projectName.trim(),
        description: description.trim(),
        result: result.trim() || undefined,
        tags: tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      },
    })
    setErrors({})
    toast('Changes saved', 'success')
  }

  const addLink = () => {
    if (!isValidUrl(linkUrl)) {
      setLinkError('Enter a full URL starting with http:// or https://')
      return
    }
    dispatch({
      type: 'link/add',
      hackathonId: hackathon.id,
      patch: { title: linkTitle.trim() || LINK_TYPE_LABEL[linkType], url: linkUrl.trim(), type: linkType },
    })
    setLinkTitle('')
    setLinkUrl('')
    setLinkError('')
  }

  return (
    <div className="stack" style={{ maxWidth: 760 }}>
      <section className="panel">
        <div className="panel__head">
          <h3 className="panel__title">Hackathon details</h3>
          {dirty && <span className="panel__meta">Unsaved changes</span>}
        </div>
        <div className="panel__body">
          <div className="form-grid">
            <Field label="Name" htmlFor="s-name" error={errors.name}>
              <Input id="s-name" value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Platform" htmlFor="s-platform">
              <Input
                id="s-platform"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
              />
            </Field>
            <Field label="Prize pool" htmlFor="s-prize" hint="USD.">
              <Input
                id="s-prize"
                value={prizePool}
                inputMode="numeric"
                onChange={(e) => setPrizePool(e.target.value)}
              />
            </Field>
            <Field label="Submission deadline" htmlFor="s-deadline" error={errors.deadline}>
              <Input
                id="s-deadline"
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </Field>
            <Field label="Status" htmlFor="s-status">
              <Select
                id="s-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as HackathonStatus)}
              >
                {STATUS_ORDER.map((value) => (
                  <option key={value} value={value}>
                    {STATUS_LABEL[value]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Project name" htmlFor="s-project">
              <Input
                id="s-project"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Untitled"
              />
            </Field>
            <Field label="Tags" htmlFor="s-tags" hint="Comma separated." span>
              <Input id="s-tags" value={tags} onChange={(e) => setTags(e.target.value)} />
            </Field>
            <Field label="Description" htmlFor="s-desc" span>
              <Textarea
                id="s-desc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>
            {(status === 'results' || result) && (
              <Field
                label="Result"
                htmlFor="s-result"
                hint="Shown on the overview once results are in."
                span
              >
                <Input
                  id="s-result"
                  value={result}
                  onChange={(e) => setResult(e.target.value)}
                  placeholder="Second place - $2,500"
                />
              </Field>
            )}
          </div>
          <div className="inline-actions" style={{ marginTop: 'var(--sp-6)' }}>
            <Button variant="primary" onClick={save} disabled={!dirty}>
              Save changes
            </Button>
            {dirty && (
              <Button
                variant="ghost"
                onClick={() => {
                  setName(hackathon.name)
                  setPlatform(hackathon.platform)
                  setPrizePool(String(hackathon.prizePool))
                  setDeadline(toDateTimeLocal(hackathon.deadline))
                  setStatus(hackathon.status)
                  setProjectName(hackathon.projectName)
                  setDescription(hackathon.description)
                  setResult(hackathon.result ?? '')
                  setTags(hackathon.tags.join(', '))
                  setErrors({})
                }}
              >
                Discard
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel__head">
          <h3 className="panel__title">Important links</h3>
          <span className="panel__meta">{links.length}</span>
        </div>
        <div className="panel__body panel__body--flush">
          {links.length > 0 && (
            <div className="row-list">
              {links.map((link) => (
                <LinkRow
                  key={link.id}
                  title={link.title}
                  url={link.url}
                  type={link.type}
                  action={
                    <button
                      type="button"
                      className="icon-btn icon-btn--danger"
                      aria-label={`Delete link ${link.title}`}
                      onClick={() => dispatch({ type: 'link/remove', id: link.id })}
                    >
                      <IconTrash />
                    </button>
                  }
                />
              ))}
            </div>
          )}
          <div
            className="panel__body"
            style={{ borderTop: links.length ? '1px solid var(--border-subtle)' : undefined }}
          >
            <div className="form-grid">
              <Field label="Label" htmlFor="l-title">
                <Input
                  id="l-title"
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  placeholder="Official rules"
                />
              </Field>
              <Field label="Type" htmlFor="l-type">
                <Select
                  id="l-type"
                  value={linkType}
                  onChange={(e) => setLinkType(e.target.value as LinkType)}
                >
                  {(Object.keys(LINK_TYPE_LABEL) as LinkType[]).map((value) => (
                    <option key={value} value={value}>
                      {LINK_TYPE_LABEL[value]}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="URL" htmlFor="l-url" error={linkError} span>
                <Input
                  id="l-url"
                  value={linkUrl}
                  onChange={(e) => {
                    setLinkUrl(e.target.value)
                    setLinkError('')
                  }}
                  placeholder="https://"
                />
              </Field>
            </div>
            <Button
              onClick={addLink}
              disabled={!linkUrl.trim()}
              style={{ marginTop: 'var(--sp-5)' }}
            >
              <IconPlus style={{ width: 13, height: 13 }} />
              Add link
            </Button>
          </div>
        </div>
      </section>

      <section className="panel danger">
        <div className="panel__head">
          <h3 className="panel__title">Danger zone</h3>
        </div>
        <div className="panel__body">
          <div className="danger__row">
            <div>
              <p className="ctx__value">Delete this hackathon</p>
              <p className="crow__desc" style={{ marginTop: 'var(--sp-2)' }}>
                Removes the hackathon and every requirement, task and asset attached to it.
                This cannot be undone.
              </p>
            </div>
            <Button variant="danger" onClick={() => setConfirming(true)}>
              Delete hackathon
            </Button>
          </div>
        </div>
      </section>

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={() => {
          dispatch({ type: 'hackathon/remove', id: hackathon.id })
          toast(`${hackathon.name} deleted`)
          navigate('/')
        }}
        title={`Delete ${hackathon.name}?`}
        body="Every requirement, submission item, task and asset for this hackathon will be permanently removed."
        confirmLabel="Delete hackathon"
      />
    </div>
  )
}
