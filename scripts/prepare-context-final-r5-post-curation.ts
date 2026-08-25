import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

interface Example { en: string }
interface Provenance { sentenceId: number }
interface ReviewDocument { rows: Array<{ word: string; sentenceId: number }> }

const root = resolve(import.meta.dirname, '..')
const selectedPath = resolve(root, 'data-source/examples/selected-examples.json')
const provenancePath = resolve(root, 'data-source/examples/example-provenance.json')
const auditRoot = resolve(root, 'audit/v1.3-context-final-semantic')
const phaseASeed = 0x0ce75003
const phaseALimit = 300

function seededRank(value: string, seed: number): number {
  let state = seed >>> 0
  for (const character of value) state = (Math.imul(state ^ character.charCodeAt(0), 1664525) + 1013904223) >>> 0
  return state
}

function key(word: string, sentenceId: number): string {
  return `${word.toLocaleLowerCase()}::${sentenceId}`
}

const selected = JSON.parse(await readFile(selectedPath, 'utf8')) as Record<string, Example>
const provenance = JSON.parse(await readFile(provenancePath, 'utf8')) as Record<string, Provenance>
const priorDocuments = await Promise.all([
  'phase-a-random-review.json',
  'mandatory-recheck.json',
].map(async (name) => JSON.parse(await readFile(resolve(auditRoot, name), 'utf8')) as ReviewDocument))
const independent = JSON.parse(await readFile(resolve(root, 'audit/v1.3-context-human-quality/independent-validation.json'), 'utf8')) as ReviewDocument
const excludedKeys = new Set([
  ...priorDocuments.flatMap((document) => document.rows.map((row) => key(row.word, row.sentenceId))),
  ...independent.rows.map((row) => key(row.word, row.sentenceId)),
])

const rows = Object.keys(selected)
  .sort((a, b) => a.localeCompare(b))
  .map((word) => ({
    word,
    sentenceId: provenance[word].sentenceId,
    sentence: selected[word].en,
    rank: seededRank(key(word, provenance[word].sentenceId), phaseASeed),
  }))
  .filter((row) => !excludedKeys.has(key(row.word, row.sentenceId)))
  .sort((a, b) => a.rank - b.rank || a.word.localeCompare(b.word) || a.sentenceId - b.sentenceId)
  .slice(0, phaseALimit)
  .map(({ rank: _rank, ...row }) => ({ ...row, reviewType: 'phase-a-post-curation-review', semanticDecisionSource: 'sentence-read' }))

if (rows.length !== phaseALimit) throw new Error(`Post-curation Phase A sample is too small: ${rows.length}`)
await mkdir(auditRoot, { recursive: true })
await writeFile(resolve(auditRoot, 'phase-a-post-curation-candidates.json'), `${JSON.stringify({
  round: 'Context Final Semantic Acceptance - Round 5',
  seed: phaseASeed,
  sampleSize: rows.length,
  excludedInitialR5AndMandatoryRows: excludedKeys.size,
  selectionPolicy: 'Rebuilt selected pool only; new seed; no overlap with the initial R5 Phase A review, mandatory rows, or R4 independent validation. Machine metrics are omitted before sentence-read review.',
  rows,
}, null, 2)}\n`, 'utf8')
console.log(`Round 5 post-curation Phase A candidates prepared: ${rows.length}; excluded=${excludedKeys.size}`)
