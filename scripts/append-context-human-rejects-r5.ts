import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

type Reject = { word?: string; sentenceId: number; categories: string[]; reason: string }
const root = resolve(import.meta.dirname, '..')
const path = resolve(root, 'data-source/examples/context-curation.json')
const selectedPath = resolve(root, 'data-source/examples/selected-examples.json')
const provenancePath = resolve(root, 'data-source/examples/example-provenance.json')
const curation = JSON.parse(await readFile(path, 'utf8')) as { globalReject: Reject[]; pairReject: Reject[] }
const selected = JSON.parse(await readFile(selectedPath, 'utf8')) as Record<string, { en: string }>
const provenance = JSON.parse(await readFile(provenancePath, 'utf8')) as Record<string, { sentenceId: number }>
const rows: Array<[string, number, string[]]> = [
  ['cocaine', 10280164, ['medical-heavy']],
  ['occupation', 8610733, ['extremism', 'political-heavy']],
  ['propaganda', 10095186, ['political-heavy']],
  ['victim', 11996005, ['political-heavy', 'public-controversy']],
]
const reasons: Record<string, string> = {
  'medical-heavy': 'The sentence makes the learner process unnecessary drug or medical history instead of the target word.',
  extremism: 'The sentence requires extremist or Nazi-related context that is not necessary to teach the target word.',
  'political-heavy': 'The sentence depends on a politically charged dispute or institutional background that is unnecessary for the target word.',
  'public-controversy': 'The sentence depends on a public-figure or current geopolitical controversy that is unnecessary for the target word.',
}
const global = new Set(curation.globalReject.map((entry) => entry.sentenceId))
const pair = new Set(curation.pairReject.map((entry) => `${entry.word}::${entry.sentenceId}`))
for (const [word, sentenceId, categories] of rows) {
  if (!selected[word] || provenance[word]?.sentenceId !== sentenceId) throw new Error(`Current final pair changed: ${word}/${sentenceId}`)
  if (global.has(sentenceId) || pair.has(`${word}::${sentenceId}`)) continue
  curation.pairReject.push({ word, sentenceId, categories, reason: categories.map((category) => reasons[category]).join(' ') })
}
curation.pairReject.sort((a, b) => String(a.word).localeCompare(String(b.word)) || a.sentenceId - b.sentenceId)
await writeFile(path, `${JSON.stringify(curation, null, 2)}\n`, 'utf8')
console.log('Added four final high-risk semantic rejects.')
