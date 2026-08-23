const APOSTROPHES = /[’‘`]/g
const DASHES = /[‐‑‒–—−]/g

export function normalizeWord(value: string): string {
  return value
    .normalize('NFKC')
    .trim()
    .toLocaleLowerCase()
    .replace(APOSTROPHES, "'")
    .replace(DASHES, '-')
    .replace(/\s+/g, ' ')
}

export function normalizeSpelling(value: string): string {
  return normalizeWord(value)
    .replace(/\s*([-'])\s*/g, '$1')
    .replace(/\s+/g, ' ')
}

export function spellingMatches(expected: string, actual: string): boolean {
  return normalizeSpelling(expected) === normalizeSpelling(actual)
}
