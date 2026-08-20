import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/cn'
import { clamp } from '@/lib/format'

/* ---- Button ------------------------------------------------------------ */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: 'sm' | 'md'
}

export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn('btn', `btn--${variant}`, size === 'sm' && 'btn--sm', className)}
      {...rest}
    />
  )
}

/* ---- Badge ------------------------------------------------------------- */

export type Tone = 'neutral' | 'accent' | 'success' | 'warn' | 'danger'

export function Badge({
  tone = 'neutral',
  children,
  className,
  dot,
}: {
  tone?: Tone
  children: ReactNode
  className?: string
  dot?: boolean
}) {
  return (
    <span className={cn('badge', `tone-${tone}`, className)}>
      {dot && <span className="badge__dot" aria-hidden="true" />}
      {children}
    </span>
  )
}

/* ---- Progress ---------------------------------------------------------- */

export function ProgressBar({
  value,
  tone = 'accent',
  label,
}: {
  value: number
  tone?: Tone
  label?: string
}) {
  const pct = clamp(value, 0, 100)
  return (
    <div
      className={cn('progress', `tone-${tone}`)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <span className="progress__fill" style={{ width: `${pct}%` }} />
    </div>
  )
}

/* ---- Empty state ------------------------------------------------------- */

export function EmptyState({
  title,
  body,
  action,
  compact,
}: {
  title: string
  body: string
  action?: ReactNode
  compact?: boolean
}) {
  return (
    <div className={cn('empty', compact && 'empty--compact')}>
      <p className="empty__title">{title}</p>
      <p className="empty__body">{body}</p>
      {action && <div className="empty__action">{action}</div>}
    </div>
  )
}

/* ---- Skeleton ---------------------------------------------------------- */

export function Skeleton({ h = 16, w = '100%', r = 6 }: { h?: number; w?: number | string; r?: number }) {
  return <span className="skeleton" style={{ height: h, width: w, borderRadius: r }} />
}

/* ---- Form controls ----------------------------------------------------- */

export function Field({
  label,
  hint,
  error,
  children,
  htmlFor,
  span,
}: {
  label: string
  hint?: string
  error?: string
  children: ReactNode
  htmlFor?: string
  span?: boolean
}) {
  return (
    <div className={cn('field', span && 'field--span')}>
      <label className="field__label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error ? (
        <p className="field__error" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="field__hint">{hint}</p>
      )}
    </div>
  )
}

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn('control', className)} {...rest} />
}

export function Textarea({ className, rows = 4, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn('control control--area', className)} rows={rows} {...rest} />
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="select">
      <select className={cn('control', className)} {...rest}>
        {children}
      </select>
      <svg className="select__chevron" viewBox="0 0 12 12" aria-hidden="true">
        <path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    </div>
  )
}

export function Checkbox({
  checked,
  onChange,
  label,
  id,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  id?: string
}) {
  const generated = useId()
  const inputId = id ?? generated
  return (
    <div className="checkbox">
      <input
        id={inputId}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <label htmlFor={inputId}>{label}</label>
    </div>
  )
}

/* ---- Check button (used by every checklist row) ------------------------ */

export function CheckButton({
  checked,
  onToggle,
  label,
}: {
  checked: boolean
  onToggle: () => void
  label: string
}) {
  return (
    <button
      type="button"
      className={cn('check', checked && 'check--on')}
      onClick={onToggle}
      aria-pressed={checked}
      aria-label={label}
    >
      <svg viewBox="0 0 14 14" aria-hidden="true">
        <path d="M3 7.4 5.6 10 11 4.4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

/* ---- Dialog ------------------------------------------------------------ */

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  wide,
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  // Callers pass inline arrows, so `onClose` gets a new identity on every
  // parent render. Reading it through a ref keeps the effect below keyed on
  // `open` alone - otherwise it tears down and re-runs on every re-render,
  // stealing focus out of whatever field the user is typing in.
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onCloseRef.current()
      }
      if (e.key === 'Tab') trapFocus(e, panelRef.current)
    }
    document.addEventListener('keydown', onKey)
    const previous = document.activeElement as HTMLElement | null
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    // Land on the first real field so the user can start typing immediately,
    // falling back to whatever is focusable when the dialog has no inputs.
    const timer = window.setTimeout(() => {
      const panel = panelRef.current
      if (!panel) return
      const field = panel.querySelector<HTMLElement>(FIRST_FIELD)
      ;(field ?? panel.querySelector<HTMLElement>(FOCUSABLE))?.focus()
    }, 20)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      window.clearTimeout(timer)
      previous?.focus?.()
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div className="scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className={cn('dialog', wide && 'dialog--wide')}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={panelRef}
      >
        <header className="dialog__head">
          <div>
            <h2 id={titleId} className="dialog__title">
              {title}
            </h2>
            {description && <p className="dialog__desc">{description}</p>}
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close dialog">
            <svg viewBox="0 0 14 14" aria-hidden="true">
              <path d="M3.5 3.5l7 7M10.5 3.5l-7 7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </header>
        <div className="dialog__body">{children}</div>
        {footer && <footer className="dialog__foot">{footer}</footer>}
      </div>
    </div>,
    document.body,
  )
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** The first editable control, so opening a form dialog does not park focus on
 *  the close button. */
const FIRST_FIELD =
  'input:not([disabled]):not([type="checkbox"]), select:not([disabled]), textarea:not([disabled])'

function trapFocus(event: KeyboardEvent, container: HTMLElement | null) {
  if (!container) return
  const nodes = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.offsetParent !== null,
  )
  if (nodes.length === 0) return
  const first = nodes[0]
  const last = nodes[nodes.length - 1]
  const active = document.activeElement
  if (event.shiftKey && active === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && active === last) {
    event.preventDefault()
    first.focus()
  }
}

/* ---- Confirm ----------------------------------------------------------- */

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel = 'Delete',
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  body: string
  confirmLabel?: string
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="danger"
            onClick={() => {
              onConfirm()
              onClose()
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="prose">{body}</p>
    </Dialog>
  )
}

/* ---- Toasts ------------------------------------------------------------ */

interface Toast {
  id: number
  message: string
  tone: Tone
}

const ToastContext = createContext<(message: string, tone?: Tone) => void>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const counter = useRef(0)

  const push = useCallback((message: string, tone: Tone = 'neutral') => {
    const id = ++counter.current
    setToasts((list) => [...list.slice(-2), { id, message, tone }])
    window.setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 3200)
  }, [])

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={cn('toast', `tone-${toast.tone}`)}>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}

/* ---- Segmented control ------------------------------------------------- */

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T
  onChange: (next: T) => void
  options: { value: T; label: string; count?: number }[]
  label: string
}) {
  return (
    <div className="segmented" role="tablist" aria-label={label}>
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            className={cn('segmented__item', active && 'is-active')}
            onClick={() => onChange(option.value)}
          >
            {option.label}
            {option.count !== undefined && <span className="segmented__count">{option.count}</span>}
          </button>
        )
      })}
    </div>
  )
}
