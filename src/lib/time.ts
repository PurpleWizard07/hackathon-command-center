/* ============================================================================
   Time, countdowns and deadline urgency. Pure functions - the UI only renders
   what these return, so urgency logic lives in exactly one place.
   ========================================================================== */

export type Urgency = 'passed' | 'critical' | 'soon' | 'near' | 'calm'

export interface Countdown {
  /** Milliseconds remaining; negative once the deadline has passed. */
  ms: number
  days: number
  hours: number
  minutes: number
  seconds: number
  passed: boolean
  urgency: Urgency
  /** "5 days left", "18 hours left", "Deadline passed". */
  label: string
  /** Compact form for dense rows: "5d", "18h", "42m". */
  short: string
  /** Uppercase headline form for cards: "5 DAYS LEFT". */
  headline: string
}

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

export function urgencyOf(ms: number): Urgency {
  if (ms <= 0) return 'passed'
  if (ms < DAY) return 'critical'
  if (ms < 3 * DAY) return 'soon'
  if (ms < 8 * DAY) return 'near'
  return 'calm'
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function plural(n: number, word: string): string {
  return n === 1 ? word : word + 's'
}

export function countdown(deadline: string, now: number = Date.now()): Countdown {
  const target = new Date(deadline).getTime()
  const ms = Number.isNaN(target) ? 0 : target - now
  const abs = Math.abs(ms)
  const days = Math.floor(abs / DAY)
  const hours = Math.floor((abs % DAY) / HOUR)
  const minutes = Math.floor((abs % HOUR) / MINUTE)
  const seconds = Math.floor((abs % MINUTE) / 1000)
  const passed = ms <= 0

  let label: string
  let short: string
  if (passed) {
    label = 'Deadline passed'
    short = 'Passed'
  } else if (days >= 1) {
    label = days + ' ' + plural(days, 'day') + ' left'
    short = days + 'd'
  } else if (hours >= 1) {
    label = hours + ' ' + plural(hours, 'hour') + ' left'
    short = hours + 'h'
  } else if (minutes >= 1) {
    label = minutes + ' ' + plural(minutes, 'minute') + ' left'
    short = minutes + 'm'
  } else {
    label = seconds + ' ' + plural(seconds, 'second') + ' left'
    short = seconds + 's'
  }

  return {
    ms,
    days,
    hours,
    minutes,
    seconds,
    passed,
    urgency: urgencyOf(ms),
    label,
    short,
    headline: label.toUpperCase(),
  }
}

/** Segments for the workspace countdown readout. */
export function clockSegments(c: Countdown): { value: string; unit: string }[] {
  if (c.passed) {
    return [{ value: '00', unit: 'closed' }]
  }
  if (c.days >= 1) {
    return [
      { value: String(c.days), unit: c.days === 1 ? 'day' : 'days' },
      { value: pad(c.hours), unit: 'hrs' },
      { value: pad(c.minutes), unit: 'min' },
    ]
  }
  return [
    { value: pad(c.hours), unit: 'hrs' },
    { value: pad(c.minutes), unit: 'min' },
    { value: pad(c.seconds), unit: 'sec' },
  ]
}

/* ---- Formatting -------------------------------------------------------- */

const dateFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
const dateYearFmt = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})
const timeFmt = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' })
const longFmt = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
})
const clockFmt = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

function safe(iso: string): Date | null {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d
}

/** "Aug 26" */
export function formatDate(iso: string): string {
  const d = safe(iso)
  return d ? dateFmt.format(d) : '-'
}

/** "Aug 26, 2026" */
export function formatDateYear(iso: string): string {
  const d = safe(iso)
  return d ? dateYearFmt.format(d) : '-'
}

/** "11:59 PM" */
export function formatTime(iso: string): string {
  const d = safe(iso)
  return d ? timeFmt.format(d) : '-'
}

/** "Aug 26 - 11:59 PM" with a middot separator. */
export function formatDeadline(iso: string): string {
  const d = safe(iso)
  if (!d) return '-'
  return dateFmt.format(d) + ' · ' + timeFmt.format(d)
}

/** "Thursday, August 20" */
export function formatLongDate(date: Date): string {
  return longFmt.format(date)
}

/** "22:41" - the header's local clock. */
export function formatClock(date: Date): string {
  return clockFmt.format(date)
}

/** Local timezone abbreviation, e.g. "IST". */
export function timeZoneLabel(): string {
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' }).formatToParts(
      new Date(),
    )
    return parts.find((p) => p.type === 'timeZoneName')?.value ?? ''
  } catch {
    return ''
  }
}

/** Value for an <input type="datetime-local">. */
export function toDateTimeLocal(iso: string): string {
  const d = safe(iso)
  if (!d) return ''
  return new Date(d.getTime() - d.getTimezoneOffset() * MINUTE).toISOString().slice(0, 16)
}

/** Value for an <input type="date">. */
export function toDateInput(iso?: string): string {
  if (!iso) return ''
  const d = safe(iso)
  if (!d) return ''
  return new Date(d.getTime() - d.getTimezoneOffset() * MINUTE).toISOString().slice(0, 10)
}

/** Parse an <input type="datetime-local"> or date back into an ISO timestamp. */
export function fromDateInput(value: string): string {
  if (!value) return ''
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '' : d.toISOString()
}

/** Soft relative day for task due dates. */
export function relativeDay(iso: string, now: number = Date.now()): string {
  const d = safe(iso)
  if (!d) return '-'
  const startOfToday = new Date(now).setHours(0, 0, 0, 0)
  const startOfTarget = new Date(d.getTime()).setHours(0, 0, 0, 0)
  const diff = Math.round((startOfTarget - startOfToday) / DAY)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  if (diff < 0) return Math.abs(diff) + 'd overdue'
  if (diff < 7) return 'In ' + diff + 'd'
  return formatDate(iso)
}

export function isOverdue(iso: string | undefined, now: number = Date.now()): boolean {
  if (!iso) return false
  const d = safe(iso)
  if (!d) return false
  return new Date(d.getTime()).setHours(23, 59, 59, 999) < now
}

/** Days between now and an ISO date, floored. Used for pace/elapsed copy. */
export function daysBetween(fromIso: string, toIso: string): number {
  const a = safe(fromIso)
  const b = safe(toIso)
  if (!a || !b) return 0
  return Math.round((b.getTime() - a.getTime()) / DAY)
}
