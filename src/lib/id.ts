const ALPHABET = '23456789abcdefghjkmnpqrstuvwxyz'

/**
 * Short, collision-resistant, URL-safe id. Uses crypto when available and
 * degrades gracefully in environments without it.
 */
export function createId(prefix = ''): string {
  const size = 12
  let out = ''
  const cryptoObj = globalThis.crypto
  if (cryptoObj?.getRandomValues) {
    const bytes = new Uint8Array(size)
    cryptoObj.getRandomValues(bytes)
    for (const byte of bytes) out += ALPHABET[byte % ALPHABET.length]
  } else {
    for (let i = 0; i < size; i += 1) {
      out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
    }
  }
  return prefix ? `${prefix}_${out}` : out
}
