/* Domain-aware presentational pieces shared by the dashboard and workspace. */

import type { HackathonStatus, LinkType } from '@/types'
import { STATUS_LABEL, STATUS_TONE } from '@/lib/derive'
import { monogram, prettyUrl } from '@/lib/format'
import type { Countdown } from '@/lib/time'
import { cn } from '@/lib/cn'
import { Badge, type Tone } from './ui'
import {
  IconArrowUpRight,
  IconBook,
  IconChat,
  IconGlobe,
  IconRocket,
  IconScale,
  IconUpload,
} from './icons'

export function StatusBadge({ status }: { status: HackathonStatus }) {
  return (
    <Badge tone={STATUS_TONE[status]} dot={status === 'building'}>
      {STATUS_LABEL[status]}
    </Badge>
  )
}

export function PlatformMark({ platform }: { platform: string }) {
  return (
    <span className="platform-mark" aria-hidden="true">
      {monogram(platform)}
    </span>
  )
}

/** Countdown readout. Colour is applied only when the deadline is genuinely
 *  close, so urgency stays meaningful. */
export function CountdownText({
  countdown,
  className,
}: {
  countdown: Countdown
  className?: string
}) {
  const { urgency } = countdown
  const modifier =
    urgency === 'critical'
      ? 'countdown--critical'
      : urgency === 'soon'
        ? 'countdown--soon'
        : urgency === 'passed'
          ? 'countdown--passed'
          : undefined
  return (
    <span className={cn('countdown', modifier, className)}>
      {urgency !== 'passed' && urgency !== 'calm' && (
        <span className="countdown__dot" aria-hidden="true" />
      )}
      {countdown.headline}
    </span>
  )
}

export function countdownTone(countdown: Countdown): Tone {
  if (countdown.urgency === 'critical') return 'danger'
  if (countdown.urgency === 'soon') return 'warn'
  if (countdown.urgency === 'passed') return 'neutral'
  return 'accent'
}

const LINK_ICON: Record<LinkType, typeof IconGlobe> = {
  website: IconGlobe,
  rules: IconScale,
  discord: IconChat,
  submission: IconUpload,
  docs: IconBook,
  resource: IconRocket,
}

export const LINK_TYPE_LABEL: Record<LinkType, string> = {
  website: 'Website',
  rules: 'Rules',
  discord: 'Community',
  submission: 'Submission',
  docs: 'Docs',
  resource: 'Resource',
}

export function LinkRow({
  title,
  url,
  type,
  action,
}: {
  title: string
  url: string
  type: LinkType
  action?: React.ReactNode
}) {
  const Glyph = LINK_ICON[type] ?? IconGlobe
  return (
    <div className="linkrow">
      <span className="linkrow__icon">
        <Glyph />
      </span>
      <a
        className="linkrow__body"
        href={url}
        target="_blank"
        rel="noreferrer noopener"
        title={url}
      >
        <span className="linkrow__title">{title}</span>
        <span className="linkrow__url u-truncate" style={{ display: 'block' }}>
          {prettyUrl(url)}
        </span>
      </a>
      {action}
      <IconArrowUpRight className="linkrow__arrow" />
    </div>
  )
}

/** Small labelled figure used in headers and stat rows. */
export function Metric({
  label,
  value,
  tone,
}: {
  label: string
  value: React.ReactNode
  tone?: 'default' | 'accent' | 'warn' | 'danger' | 'success'
}) {
  const color =
    tone === 'accent'
      ? 'var(--accent-bright)'
      : tone === 'warn'
        ? 'var(--warn-bright)'
        : tone === 'danger'
          ? 'var(--danger-bright)'
          : tone === 'success'
            ? 'var(--success-bright)'
            : undefined
  return (
    <div className="ctx">
      <span className="u-label">{label}</span>
      <span className="ctx__value" style={color ? { color } : undefined}>
        {value}
      </span>
    </div>
  )
}

export function Divider() {
  return <span className="ctx__divider" aria-hidden="true" />
}
