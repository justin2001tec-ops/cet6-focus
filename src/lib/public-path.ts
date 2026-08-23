/** Resolve a public/ asset against the current Vite base path. */
export function withBase(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`
}
