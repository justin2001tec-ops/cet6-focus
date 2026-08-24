import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

type Reject = { word?: string; sentenceId: number; categories: string[]; reason: string }
type Curation = { version: number; globalReject: Reject[]; pairReject: Reject[] }

const root = resolve(import.meta.dirname, '..')
const curationPath = resolve(root, 'data-source/examples/context-curation.json')
const selectedPath = resolve(root, 'data-source/examples/selected-examples.json')
const curation = JSON.parse(await readFile(curationPath, 'utf8')) as Curation
const selected = JSON.parse(await readFile(selectedPath, 'utf8')) as Record<string, { en: string }>

const approved = [
  ['bump', 9794985],
  ['compact', 11867522],
  ['decay', 11742106],
  ['denote', 9951226],
  ['defy', 11580293],
  ['fraction', 10014210],
  ['inherent', 5251250],
  ['melody', 11305424],
  ['preclude', 11261835],
  ['prevail', 8120016],
  ['prominent', 11671162],
  ['pudding', 12372699],
  ['testify', 10031121],
] as const

for (const [word, sentenceId] of approved) {
  if (selected[word]) throw new Error(`${word} already has a selected example; refusing to alter an active selection.`)
  const index = curation.pairReject.findIndex((entry) => entry.word === word && entry.sentenceId === sentenceId)
  if (index < 0) throw new Error(`Expected curation reject is missing for ${word}|${sentenceId}.`)
  curation.pairReject.splice(index, 1)
}

curation.pairReject.sort((a, b) => String(a.word).localeCompare(String(b.word)) || a.sentenceId - b.sentenceId)
await writeFile(curationPath, `${JSON.stringify(curation, null, 2)}\n`, 'utf8')
console.log(`Restored ${approved.length} sentence-read acceptable, non-sensitive pairs for the documented coverage exception.`)
