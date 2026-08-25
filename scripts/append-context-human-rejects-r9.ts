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

const rejects: Array<{ word: string; categories: string[]; reason: string }> = [
  { word: 'abuse', categories: ['public-controversy', 'weak-teaching-value'], reason: 'The sentence still centers abuse as a sensitive social issue and does not provide a sufficiently neutral default context.' },
  { word: 'disease', categories: ['political-heavy', 'medical-heavy'], reason: 'The metaphor equates nationalism with a disease of the brain, adding a contentious political judgment rather than a neutral target-word context.' },
  { word: 'existence', categories: ['public-controversy', 'context-dependent'], reason: 'The sentence depends on a contemporary sexual-identity controversy and is not a neutral standalone default example.' },
  { word: 'federal', categories: ['political-heavy', 'obscure-background', 'context-too-hard'], reason: 'The sentence requires colonial history, tribal politics, and an unexplained sign-language background beyond the target word.' },
  { word: 'military', categories: ['proper-noun-heavy', 'weak-teaching-value'], reason: 'The target is an incidental modifier in a geographically specific sentence about Alaska installations.' },
  { word: 'religion', categories: ['religious-heavy', 'public-controversy'], reason: 'The sentence makes a dismissive philosophical judgment about religion rather than giving a neutral default use.' },
  { word: 'violent', categories: ['violence', 'public-controversy'], reason: 'The sentence frames the target through a crime-rate news context that is unnecessary for a default learning example.' },
]

for (const item of rejects) {
  const entry = selected[item.word]
  const provenanceEntry = provenance[item.word]
  if (!entry || !provenanceEntry) throw new Error(`Selected/provenance record missing for ${item.word}.`)
  if (!curation.pairReject.some((candidate) => candidate.word === item.word && candidate.sentenceId === provenanceEntry.sentenceId)) {
    curation.pairReject.push({ word: item.word, sentenceId: provenanceEntry.sentenceId, categories: item.categories, reason: item.reason })
  }
}

curation.pairReject.sort((a, b) => String(a.word).localeCompare(String(b.word)) || a.sentenceId - b.sentenceId)
await writeFile(curationPath, `${JSON.stringify(curation, null, 2)}\n`, 'utf8')
console.log(`Added ${rejects.length} sentence-read Round 4 rejects (idempotent).`)
