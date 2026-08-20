import { useState } from 'react'
import { useStore } from '@/store/StoreProvider'
import { Button, Dialog, Field, Input, Select, Textarea, useToast } from '@/components/ui'
import { STATUS_LABEL, STATUS_ORDER } from '@/lib/derive'
import { fromDateInput, toDateTimeLocal } from '@/lib/time'
import type { HackathonStatus, LinkType } from '@/types'

interface FormState {
  name: string
  platform: string
  prizePool: string
  deadline: string
  status: HackathonStatus
  projectName: string
  description: string
  requirements: string
  criteria: string
  links: string
}

function defaults(): FormState {
  const soon = new Date()
  soon.setDate(soon.getDate() + 14)
  soon.setHours(23, 59, 0, 0)
  return {
    name: '',
    platform: '',
    prizePool: '',
    deadline: toDateTimeLocal(soon.toISOString()),
    status: 'registered',
    projectName: '',
    description: '',
    requirements: 'Public GitHub repository\nLive deployment\nDemo video',
    criteria: 'Innovation\nTechnical execution\nImpact\nUX and design',
    links: '',
  }
}

/** "Title | https://url" per line, tolerant of a bare URL. */
function parseLinks(raw: string) {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [first, second] = line.split('|').map((part) => part.trim())
      const url = second ?? first
      const title = second ? first : 'Link'
      const type: LinkType = /discord|slack/i.test(url)
        ? 'discord'
        : /docs?\./i.test(url)
          ? 'docs'
          : /rules|terms/i.test(url)
            ? 'rules'
            : 'website'
      return { title, url, type }
    })
    .filter((link) => link.url.length > 0)
}

function parseLines(raw: string) {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

export function HackathonFormDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { dispatch } = useStore()
  const toast = useToast()
  const [form, setForm] = useState<FormState>(defaults)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const close = () => {
    setForm(defaults())
    setErrors({})
    onClose()
  }

  const submit = () => {
    const next: Partial<Record<keyof FormState, string>> = {}
    if (!form.name.trim()) next.name = 'A name is required.'
    if (!form.platform.trim()) next.platform = 'Which platform is this on?'
    if (!form.deadline) next.deadline = 'A submission deadline is required.'
    const prize = Number(form.prizePool.replace(/[^0-9.]/g, ''))
    if (form.prizePool.trim() && !Number.isFinite(prize)) {
      next.prizePool = 'Enter a number.'
    }
    if (Object.keys(next).length > 0) {
      setErrors(next)
      return
    }

    dispatch({
      type: 'hackathon/add',
      payload: {
        hackathon: {
          name: form.name.trim(),
          platform: form.platform.trim(),
          prizePool: Number.isFinite(prize) ? prize : 0,
          currency: 'USD',
          deadline: fromDateInput(form.deadline),
          description: form.description.trim(),
          status: form.status,
          projectName: form.projectName.trim(),
          registeredAt: new Date().toISOString(),
          tags: [],
        },
        requirements: parseLines(form.requirements).map((title) => ({
          title,
          description: '',
          required: true,
          completed: false,
        })),
        criteria: parseLines(form.criteria).map((title) => ({
          title,
          description: '',
          weight: undefined,
        })),
        links: parseLinks(form.links),
      },
    })
    toast(`${form.name.trim()} added`, 'success')
    close()
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      wide
      title="Add hackathon"
      description="Only the essentials — you can fill in the rest inside the workspace."
      footer={
        <>
          <Button onClick={close}>Cancel</Button>
          <Button variant="primary" onClick={submit}>
            Add hackathon
          </Button>
        </>
      }
    >
      <div className="form-section">
        <p className="form-section__title">The basics</p>
        <div className="form-grid">
          <Field label="Name" htmlFor="hk-name" error={errors.name}>
            <Input
              id="hk-name"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="AI Agents Challenge"
              autoComplete="off"
            />
          </Field>
          <Field label="Platform" htmlFor="hk-platform" error={errors.platform}>
            <Input
              id="hk-platform"
              value={form.platform}
              onChange={(e) => set('platform', e.target.value)}
              placeholder="Devpost"
              autoComplete="off"
            />
          </Field>
          <Field
            label="Prize pool"
            htmlFor="hk-prize"
            hint="Total pool in USD."
            error={errors.prizePool}
          >
            <Input
              id="hk-prize"
              value={form.prizePool}
              onChange={(e) => set('prizePool', e.target.value)}
              placeholder="10000"
              inputMode="numeric"
            />
          </Field>
          <Field label="Submission deadline" htmlFor="hk-deadline" error={errors.deadline}>
            <Input
              id="hk-deadline"
              type="datetime-local"
              value={form.deadline}
              onChange={(e) => set('deadline', e.target.value)}
            />
          </Field>
          <Field label="Status" htmlFor="hk-status">
            <Select
              id="hk-status"
              value={form.status}
              onChange={(e) => set('status', e.target.value as HackathonStatus)}
            >
              {STATUS_ORDER.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABEL[status]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Project name" htmlFor="hk-project" hint="Optional — add it later.">
            <Input
              id="hk-project"
              value={form.projectName}
              onChange={(e) => set('projectName', e.target.value)}
              placeholder="Untitled"
              autoComplete="off"
            />
          </Field>
          <Field label="Description" htmlFor="hk-desc" span>
            <Textarea
              id="hk-desc"
              rows={3}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="What the organisers are asking for, and anything you want to remember."
            />
          </Field>
        </div>
      </div>

      <div className="form-section">
        <p className="form-section__title">Checklists</p>
        <div className="form-grid">
          <Field label="Requirements" htmlFor="hk-reqs" hint="One per line." span>
            <Textarea
              id="hk-reqs"
              rows={3}
              value={form.requirements}
              onChange={(e) => set('requirements', e.target.value)}
            />
          </Field>
          <Field label="Judging criteria" htmlFor="hk-crit" hint="One per line." span>
            <Textarea
              id="hk-crit"
              rows={3}
              value={form.criteria}
              onChange={(e) => set('criteria', e.target.value)}
            />
          </Field>
          <Field
            label="Important links"
            htmlFor="hk-links"
            hint="One per line, as Title | https://url"
            span
          >
            <Textarea
              id="hk-links"
              rows={3}
              value={form.links}
              onChange={(e) => set('links', e.target.value)}
              placeholder={'Official site | https://example.com\nDiscord | https://discord.gg/x'}
            />
          </Field>
        </div>
      </div>
    </Dialog>
  )
}
