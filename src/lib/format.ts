/** Money, percentages and other display formatting. */

const fmtCache = new Map<string, Intl.NumberFormat>()

function formatter(currency: string, notation: 'compact' | 'standard') {
  const key = currency + ':' + notation
  let fmt = fmtCache.get(key)
  if (!fmt) {
    fmt = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      notation,
      maximumFractionDigits: 0,
    })
    fmtCache.set(key, fmt)
  }
  return fmt
}

/** "$10,000" - the canonical prize rendering. */
export function money(amount: number, currency = 'USD'): string {
  if (!Number.isFinite(amount)) return '-'
  try {
    return formatter(currency, 'standard').format(amount)
  } catch {
    return currency + ' ' + Math.round(amount).toLocaleString('en-US')
  }
}

/** "$1.2M" - for totals that would otherwise dominate a stat card. */
export function moneyCompact(amount: number, currency = 'USD'): string {
  if (!Number.isFinite(amount)) return '-'
  if (Math.abs(amount) < 10000) return money(amount, currency)
  try {
    return formatter(currency, 'compact').format(amount)
  } catch {
    return money(amount, currency)
  }
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function percent(value: number): string {
  return Math.round(clamp(value, 0, 100)) + '%'
}

export function pluralize(count: number, word: string, plural?: string): string {
  if (count === 1) return count + ' ' + word
  return count + ' ' + (plural ?? word + 's')
}

/** Two-letter monogram for a platform chip: OpenAI -> OA, Devpost -> DP */
export function monogram(value: string): string {
  const words = value.trim().split(/[\s._/-]+/).filter(Boolean)
  if (words.length === 0) return '-'
  if (words.length === 1) {
    const w = words[0]
    const caps = w.replace(/[^A-Z]/g, '')
    if (caps.length >= 2) return caps.slice(0, 2)
    return w.slice(0, 2).toUpperCase()
  }
  return (words[0][0] + words[1][0]).toUpperCase()
}

/** Deterministic hue per platform so its chip colour is stable across renders. */
export function hueFor(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) % 360
  }
  return hash
}

/** "github.com/acme/repo" from a full URL, for compact link display. */
export function prettyUrl(url: string): string {
  try {
    const u = new URL(url)
    const path = u.pathname.replace(/\/$/, '')
    return u.host.replace(/^www\./, '') + path
  } catch {
    return url
  }
}

export function isValidUrl(value: string): boolean {
  if (!value.trim()) return false
  try {
    const u = new URL(value)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

/** "3 of 8" */
export function ratio(done: number, total: number): string {
  return done + ' of ' + total
}
