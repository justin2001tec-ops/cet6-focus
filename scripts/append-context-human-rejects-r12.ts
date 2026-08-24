import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

type Reject = { word?: string; sentenceId: number; categories: string[]; reason: string }
type Curation = { version: number; globalReject: Reject[]; pairReject: Reject[] }

const root = resolve(import.meta.dirname, '..')
const curationPath = resolve(root, 'data-source/examples/context-curation.json')
const selectedPath = resolve(root, 'data-source/examples/selected-examples.json')
const provenancePath = resolve(root, 'data-source/examples/example-provenance.json')
const curation = JSON.parse(await readFile(curationPath, 'utf8')) as Curation
const selected = JSON.parse(await readFile(selectedPath, 'utf8')) as Record<string, { en: string }>
const provenance = JSON.parse(await readFile(provenancePath, 'utf8')) as Record<string, { sentenceId: number }>
const word = 'military'
const entry = selected[word]
const provenanceEntry = provenance[word]
if (!entry || !provenanceEntry) throw new Error(`Selected/provenance record missing for ${word}.`)
if (!curation.pairReject.some((candidate) => candidate.word === word && candidate.sentenceId === provenanceEntry.sentenceId)) {
  curation.pairReject.push({ word, sentenceId: provenanceEntry.sentenceId, categories: ['context-too-hard', 'proper-noun-heavy'], reason: 'The sentence is a specialist institutional comparison about military ranks and Commonwealth forces, not a clear default context.' })
}
curation.pairReject.sort((a, b) => String(a.word).localeCompare(String(b.word)) || a.sentenceId - b.sentenceId)
await writeFile(curationPath, `${JSON.stringify(curation, null, 2)}\n`, 'utf8')
console.log('Added the current military-ranks sentence-read reject (idempotent).')
