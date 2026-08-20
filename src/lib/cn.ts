type ClassValue = string | number | false | null | undefined

/** Minimal class name joiner. No dependency, no variant DSL. */
export function cn(...values: ClassValue[]): string {
  let out = ''
  for (const value of values) {
    if (!value) continue
    out = out ? `${out} ${value}` : String(value)
  }
  return out
}
