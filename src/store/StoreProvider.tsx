import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { CommandCenterData, HackathonBundle } from '@/types'
import { emptyData, repository } from '@/data/repository'
import { reducer, type Action } from './reducer'
import { compareForBoard, summarize, type HackathonSummary } from '@/lib/derive'

type Status = 'loading' | 'ready' | 'error'

interface StoreValue {
  status: Status
  error: string | null
  data: CommandCenterData
  dispatch: (action: Action) => void
  reset: () => void
  clearAll: () => void
  /** Ticks every second so countdowns stay live without per-card timers. */
  now: number
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, dispatch] = useReducer(reducer, emptyData())
  const [status, setStatus] = useState<Status>('loading')
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const hydrated = useRef(false)

  useEffect(() => {
    let cancelled = false
    repository
      .load()
      .then((loaded) => {
        if (cancelled) return
        dispatch({ type: 'hydrate', data: loaded })
        hydrated.current = true
        setStatus('ready')
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Could not load your data.')
        setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Persist after every committed change. Hydration itself must not write.
  useEffect(() => {
    if (!hydrated.current) return
    const handle = window.setTimeout(() => {
      repository.save(data).catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Could not save your changes.')
      })
    }, 150)
    return () => window.clearTimeout(handle)
  }, [data])

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const reset = useCallback(() => {
    repository.reset().then((seeded) => dispatch({ type: 'hydrate', data: seeded }))
  }, [])

  const clearAll = useCallback(() => {
    repository.clear().then((blank) => dispatch({ type: 'hydrate', data: blank }))
  }, [])

  const value = useMemo<StoreValue>(
    () => ({ status, error, data, dispatch, reset, clearAll, now }),
    [status, error, data, reset, clearAll, now],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>')
  return ctx
}

/** Everything for one hackathon, or null when the id does not exist. */
export function useBundle(id: string | undefined): HackathonBundle | null {
  const { data } = useStore()
  return useMemo(() => {
    const hackathon = data.hackathons.find((h) => h.id === id)
    if (!hackathon) return null
    const mine = <T extends { hackathonId: string }>(items: T[]) =>
      items.filter((item) => item.hackathonId === hackathon.id)
    return {
      hackathon,
      requirements: mine(data.requirements),
      criteria: mine(data.criteria),
      links: mine(data.links),
      submissionItems: mine(data.submissionItems),
      tasks: mine(data.tasks),
      assets: mine(data.assets),
    }
  }, [data, id])
}

/** Board-ordered summaries for the dashboard. */
export function useSummaries(): HackathonSummary[] {
  const { data, now } = useStore()
  // Bucket to the minute: countdown labels only change that often, so cards
  // do not need to re-sort every second.
  const minute = Math.floor(now / 60_000)
  return useMemo(() => {
    const bundles: HackathonBundle[] = data.hackathons.map((hackathon) => {
      const mine = <T extends { hackathonId: string }>(items: T[]) =>
        items.filter((item) => item.hackathonId === hackathon.id)
      return {
        hackathon,
        requirements: mine(data.requirements),
        criteria: mine(data.criteria),
        links: mine(data.links),
        submissionItems: mine(data.submissionItems),
        tasks: mine(data.tasks),
        assets: mine(data.assets),
      }
    })
    return bundles.map((b) => summarize(b, minute * 60_000)).sort(compareForBoard)
  }, [data, minute])
}
