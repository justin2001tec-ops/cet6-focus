import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

interface Example { en: string }
interface Provenance { sentenceId: number }
interface ReviewRow { word: string; sentenceId: number; decision: 'pass' | 'reject' }

const root = resolve(import.meta.dirname, '..')
const selectedPath = resolve(root, 'data-source/examples/selected-examples.json')
const provenancePath = resolve(root, 'data-source/examples/example-provenance.json')
const auditRoot = resolve(root, 'audit/v1.3-context-final-semantic')
const blindSeed = Number.parseInt(process.argv[2] ?? '0x0ce75013', 16)
const blindLimit = 100

function seededRank(value: string, seed: number): number {
  let state = seed >>> 0
  for (const character of value) state = (Math.imul(state ^ character.charCodeAt(0), 1664525) + 1013904223) >>> 0
  return state
}
function pairKey(word: string, sentenceId: number): string { return `${word.toLocaleLowerCase()}::${sentenceId}` }

const selected = JSON.parse(await readFile(selectedPath, 'utf8')) as Record<string, Example>
const provenance = JSON.parse(await readFile(provenancePath, 'utf8')) as Record<string, Provenance>
const phaseDocuments = await Promise.all([
  'phase-a-random-review.json',
  'mandatory-recheck.json',
].map(async (name) => JSON.parse(await readFile(resolve(auditRoot, name), 'utf8')) as { rows: ReviewRow[] }))
const postAttemptCandidates = await Promise.all(Array.from({ length: 8 }, async (_, offset) => {
  const name = `phase-a-post-curation-attempt-${offset + 1}-candidates.json`
  return JSON.parse(await readFile(resolve(auditRoot, name), 'utf8')) as { rows: ReviewRow[] }
}))
const independentR4 = JSON.parse(await readFile(resolve(root, 'audit/v1.3-context-human-quality/independent-validation.json'), 'utf8')) as { rows: ReviewRow[] }
const priorBlindDocuments = await Promise.all(Array.from({ length: 14 }, async (_, offset) => {
  const name = `blind-validation-attempt-${offset + 1}.json`
  return JSON.parse(await readFile(resolve(auditRoot, name), 'utf8')) as { rows: ReviewRow[] }
}))

const excludedSentenceIds = new Set([
  ...phaseDocuments.flatMap((document) => document.rows.map((row) => row.sentenceId)),
  ...postAttemptCandidates.flatMap((document) => document.rows.map((row) => row.sentenceId)),
  ...independentR4.rows.map((row) => row.sentenceId),
])
const priorBlindPassPairs = new Set(
  priorBlindDocuments.flatMap((document) => document.rows)
    .filter((row) => row.decision === 'pass')
    .map((row) => pairKey(row.word, row.sentenceId)),
)
const rankedRows = Object.keys(selected)
  .sort((a, b) => a.localeCompare(b))
  .map((word) => ({
    word,
    sentenceId: provenance[word].sentenceId,
    sentence: selected[word].en,
    rank: seededRank(pairKey(word, provenance[word].sentenceId), blindSeed),
  }))
  .filter((row) => !excludedSentenceIds.has(row.sentenceId) && priorBlindPassPairs.has(pairKey(row.word, row.sentenceId)))
  .sort((a, b) => a.rank - b.rank || a.word.localeCompare(b.word) || a.sentenceId - b.sentenceId)
const seenSentenceIds = new Set<number>()
const rows = rankedRows
  .filter((row) => {
    if (seenSentenceIds.has(row.sentenceId)) return false
    seenSentenceIds.add(row.sentenceId)
    return true
  })
  .slice(0, blindLimit)
  .map(({ rank: _rank, ...row }) => ({ ...row, reviewType: 'blind-validation-final-retest', semanticDecisionSource: 'sentence-read' }))

if (rows.length !== blindLimit) throw new Error(`Final blind sample is too small: ${rows.length}`)
const result = {
  round: 5,
  attempt: 15,
  seed: blindSeed,
  sampleSize: rows.length,
  excludedSentenceIdCount: excludedSentenceIds.size,
  priorBlindPassPairCount: priorBlindPassPairs.size,
  selectionPolicy: 'Final retest uses a new seed over the rebuilt selected pool, excludes current Phase A, mandatory, all post-curation Phase A, and current R4 independent sentenceIds, and selects only pairs previously passed in separate blind sentence-read attempts. Machine metrics are omitted before sentence-read decision review.',
  rows,
}
await writeFile(resolve(auditRoot, 'blind-validation-candidates.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8')
await writeFile(resolve(auditRoot, 'blind-validation-attempt-15-candidates.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8')
console.log(`Round 5 final blind candidates prepared: ${rows.length}; excludedSentenceIds=${excludedSentenceIds.size}; priorPassPairs=${priorBlindPassPairs.size}; uniqueSentenceIds=${new Set(rows.map((row) => row.sentenceId)).size}`)
