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
  { word: 'abuse', categories: ['violence', 'public-controversy'], reason: 'The sentence centers child abuse and is not suitable as a default learning context.' },
  { word: 'congress', categories: ['political-heavy', 'public-controversy'], reason: 'The sentence is a political insult involving Congress rather than a neutral default use of the target.' },
  { word: 'constitution', categories: ['obscure-background', 'political-heavy'], reason: 'The sentence requires an obscure geopolitical reference to the Kabyle state and an institutional political context.' },
  { word: 'disease', categories: ['medical-heavy', 'context-too-hard'], reason: 'The example lists epilepsy, infection, stroke, and Alzheimer\'s disease, creating unnecessary medical background for the target.' },
  { word: 'existence', categories: ['public-controversy', 'context-too-hard'], reason: 'The sentence depends on a contemporary gender-identity terminology dispute rather than a neutral standalone use.' },
  { word: 'federal', categories: ['context-too-hard', 'public-controversy'], reason: 'The target is embedded in unexplained criminal-procedure language and is not a clean default learning example.' },
  { word: 'hatred', categories: ['hate', 'violence'], reason: 'The sentence combines hatred with callous violence, adding unnecessary harmful content to the default context.' },
  { word: 'military', categories: ['political-heavy', 'violence'], reason: 'The sentence is a U.S. military-spending prescription and carries unnecessary political and military framing.' },
  { word: 'propaganda', categories: ['political-heavy', 'public-controversy'], reason: 'The sentence makes a partisan global-left/global-right accusation and is not a neutral default context.' },
  { word: 'religion', categories: ['religious-heavy', 'public-controversy'], reason: 'The sentence is a confrontational statement about imposing religion on children rather than a neutral use of religion.' },
  { word: 'surgery', categories: ['medical-heavy', 'public-controversy'], reason: 'The sentence combines gender identity, dysphoria, and bottom surgery in a sensitive medical and social-policy context.' },
  { word: 'violent', categories: ['violence', 'public-controversy'], reason: 'The sentence makes a stigmatizing claim about mental illness and violence, which is inappropriate as a default context.' },
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
