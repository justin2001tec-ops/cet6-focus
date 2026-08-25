import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

interface Example { en: string }
interface Provenance { sentenceId: number }
interface ReviewDocument { rows: Array<{ word: string; sentenceId: number }> }

const root = resolve(import.meta.dirname, '..')
const selectedPath = resolve(root, 'data-source/examples/selected-examples.json')
const provenancePath = resolve(root, 'data-source/examples/example-provenance.json')
const priorAuditRoot = resolve(root, 'audit/v1.3-context-human-quality')
const outputRoot = resolve(root, 'audit/v1.3-context-final-semantic')

const phaseASeed = 0x0ce75001
const phaseALimit = 300
const mandatoryWords = ['access', 'famine', 'dodge', 'permanent', 'approach', 'burial', 'deport', 'condemn', 'irritate', 'industrial', 'detect']

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
  'risk-targeted-review.json',
  'random-semantic-review-pass1.json',
  'independent-validation.json',
].map(async (name) => JSON.parse(await readFile(resolve(priorAuditRoot, name), 'utf8')) as ReviewDocument))

const targetedKeys = new Set(priorDocuments[0].rows.map((row) => key(row.word, row.sentenceId)))
const pass1Keys = new Set(priorDocuments[1].rows.map((row) => key(row.word, row.sentenceId)))
const independentKeys = new Set(priorDocuments[2].rows.map((row) => key(row.word, row.sentenceId)))
const priorKeys = new Set([...targetedKeys, ...pass1Keys, ...independentKeys])
const mandatoryRows = mandatoryWords.map((word) => {
  const example = selected[word]
  const trace = provenance[word]
  if (!example || !trace) throw new Error(`Mandatory Round 5 word is not selected: ${word}`)
  return {
    word,
    sentenceId: trace.sentenceId,
    sentence: example.en,
    reviewType: 'mandatory-recheck',
    semanticDecisionSource: 'sentence-read',
  }
})
const mandatoryKeys = new Set(mandatoryRows.map((row) => key(row.word, row.sentenceId)))
const allSelectedRows = Object.keys(selected)
  .sort((a, b) => a.localeCompare(b))
  .map((word) => ({
    word,
    sentenceId: provenance[word].sentenceId,
    sentence: selected[word].en,
    source: undefined as string | undefined,
    rank: seededRank(key(word, provenance[word].sentenceId), phaseASeed),
  }))
const newRows = allSelectedRows
  .filter((row) => !priorKeys.has(key(row.word, row.sentenceId)) && !mandatoryKeys.has(key(row.word, row.sentenceId)))
  .sort((a, b) => a.rank - b.rank || a.word.localeCompare(b.word) || a.sentenceId - b.sentenceId)
const fallbackRows = allSelectedRows
  .filter((row) => !independentKeys.has(key(row.word, row.sentenceId)) && !mandatoryKeys.has(key(row.word, row.sentenceId)) && priorKeys.has(key(row.word, row.sentenceId)))
  .map((row) => ({
    ...row,
    source: targetedKeys.has(key(row.word, row.sentenceId)) ? 'r4-targeted' : pass1Keys.has(key(row.word, row.sentenceId)) ? 'r4-pass1' : 'prior-audit',
    rank: seededRank(`${key(row.word, row.sentenceId)}::fallback`, phaseASeed),
  }))
  .sort((a, b) => (a.source === b.source ? a.rank - b.rank : a.source === 'r4-targeted' ? -1 : b.source === 'r4-targeted' ? 1 : 0) || a.word.localeCompare(b.word) || a.sentenceId - b.sentenceId)

const fallbackNeeded = phaseALimit - newRows.length
if (newRows.length >= phaseALimit) throw new Error(`Round 5 selection unexpectedly has ${newRows.length} entirely new rows; review the selection policy.`)
if (fallbackRows.length < fallbackNeeded) throw new Error(`Round 5 Phase A pool is too small even with transparent fallback rows: new=${newRows.length}, fallback=${fallbackRows.length}, needed=${fallbackNeeded}`)
const phaseARows = [...newRows, ...fallbackRows.slice(0, fallbackNeeded)].map(({ rank: _rank, source: selectionSource, ...row }) => ({
  ...row,
  reviewType: 'phase-a-random-review',
  semanticDecisionSource: 'sentence-read',
  ...(selectionSource ? { selectionSource } : {}),
}))

await mkdir(outputRoot, { recursive: true })
await writeFile(resolve(outputRoot, 'phase-a-candidates.json'), `${JSON.stringify({
  round: 'Context Final Semantic Acceptance - Round 5',
  seed: phaseASeed,
  sampleSize: phaseARows.length,
  newPoolCount: newRows.length,
  fallbackPoolCount: fallbackRows.length,
  fallbackUsedCount: fallbackNeeded,
  fallbackSources: {
    r4Targeted: phaseARows.filter((row) => row.selectionSource === 'r4-targeted').length,
    r4Pass1: phaseARows.filter((row) => row.selectionSource === 'r4-pass1').length,
  },
  excludedPriorAuditRows: priorKeys.size,
  excludedMandatoryRows: mandatoryKeys.size,
  selectionPolicy: 'Selected pool only; new seed; all available exact-new rows are included first. The minimum fallback from R4 targeted/pass1 is used only because prior audits cover most of the 1110-row selected pool; R4 independent and mandatory rows are excluded. Machine metrics are intentionally omitted before sentence-read review.',
  rows: phaseARows,
}, null, 2)}\n`, 'utf8')
await writeFile(resolve(outputRoot, 'mandatory-recheck-candidates.json'), `${JSON.stringify({
  round: 'Context Final Semantic Acceptance - Round 5',
  sampleSize: mandatoryRows.length,
  selectionPolicy: 'Mandatory known-problem rows from the current selected pool; sentence-read review required before rebuild.',
  rows: mandatoryRows,
}, null, 2)}\n`, 'utf8')

console.log(`Round 5 candidates prepared: phaseA=${phaseARows.length}, mandatory=${mandatoryRows.length}, newPool=${newRows.length}, fallbackUsed=${fallbackNeeded}, priorExcluded=${priorKeys.size}`)
