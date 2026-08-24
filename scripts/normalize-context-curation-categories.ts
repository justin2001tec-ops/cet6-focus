import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const path = resolve(root, 'data-source/examples/context-curation.json')
const curation = JSON.parse(await readFile(path, 'utf8')) as { globalReject: Array<{ categories: string[] }>; pairReject: Array<{ categories: string[] }> }
const aliases: Record<string, string> = {
  political: 'political-heavy',
  religious: 'religious-heavy',
  medical: 'medical-heavy',
  obscure: 'obscure-background',
  hard: 'context-too-hard',
  dependent: 'context-dependent',
  unnatural: 'unnatural-English',
  weak: 'weak-teaching-value',
}
const normalize = (categories: string[]) => [...new Set(categories.map((category) => aliases[category] ?? category))]
for (const entry of [...curation.globalReject, ...curation.pairReject]) entry.categories = normalize(entry.categories)
await writeFile(path, `${JSON.stringify(curation, null, 2)}\n`, 'utf8')
console.log('Normalized Round 4 curation categories to the handoff taxonomy.')
