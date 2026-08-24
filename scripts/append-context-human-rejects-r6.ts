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
const word = 'propaganda'
const sentenceId = 10095178
if (!selected[word] || provenance[word]?.sentenceId !== sentenceId) throw new Error('The current propaganda fallback changed before the final high-risk review.')
if (!curation.pairReject.some((entry) => entry.word === word && entry.sentenceId === sentenceId)) {
  curation.pairReject.push({ word, sentenceId, categories: ['political-heavy'], reason: 'The sentence makes a broad geopolitical propaganda claim and is not a neutral default learning context.' })
}
curation.pairReject.sort((a, b) => String(a.word).localeCompare(String(b.word)) || a.sentenceId - b.sentenceId)
await writeFile(path, `${JSON.stringify(curation, null, 2)}\n`, 'utf8')
console.log('Rejected the remaining Soviet-propaganda fallback.')
