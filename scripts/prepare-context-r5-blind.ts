import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

interface Example { en: string }
interface Provenance { sentenceId: number }
interface ReviewDocument { rows: Array<{ word: string; sentenceId: number }> }

const root = resolve(import.meta.dirname, '..')
const selectedPath = resolve(root, 'data-source/examples/selected-examples.json')
const provenancePath = resolve(root, 'data-source/examples/example-provenance.json')
const auditRoot = resolve(root, 'audit/v1.3-context-final-semantic')
const blindSeed = Number.parseInt(process.argv[2] ?? '0x0ce75006', 16)
const blindLimit = 100

function seededRank(value: string, seed: number): number {
  let state = seed >>> 0
  for (const character of value) state = (Math.imul(state ^ character.charCodeAt(0), 1664525) + 1013904223) >>> 0
  return state
}
function key(word: string, sentenceId: number): string { return `${word.toLocaleLowerCase()}::${sentenceId}` }

const selected = JSON.parse(await readFile(selectedPath, 'utf8')) as Record<string, Example>
const provenance = JSON.parse(await readFile(provenancePath, 'utf8')) as Record<string, Provenance>
const requiredReviews = ['phase-a-random-review.json', 'mandatory-recheck.json']
const priorDocuments = await Promise.all(requiredReviews.map(async (name) => JSON.parse(await readFile(resolve(auditRoot, name), 'utf8')) as ReviewDocument))
const independent = JSON.parse(await readFile(resolve(root, 'audit/v1.3-context-human-quality/independent-validation.json'), 'utf8')) as ReviewDocument
const postAttemptCandidates = await Promise.all(Array.from({ length: 8 }, async (_, offset) => {
  const name = `phase-a-post-curation-attempt-${offset + 1}-candidates.json`
  return JSON.parse(await readFile(resolve(auditRoot, name), 'utf8')) as ReviewDocument
}))
const excludedSentenceIds = new Set([
  ...priorDocuments.flatMap((document) => document.rows.map((row) => row.sentenceId)),
  ...independent.rows.map((row) => row.sentenceId),
  ...postAttemptCandidates.flatMap((document) => document.rows.map((row) => row.sentenceId)),
])
const rankedRows = Object.keys(selected)
  .sort((a, b) => a.localeCompare(b))
  .map((word) => ({ word, sentenceId: provenance[word].sentenceId, sentence: selected[word].en, rank: seededRank(key(word, provenance[word].sentenceId), blindSeed) }))
  .filter((row) => !excludedSentenceIds.has(row.sentenceId))
  .sort((a, b) => a.rank - b.rank || a.word.localeCompare(b.word) || a.sentenceId - b.sentenceId)
const seenSentenceIds = new Set<number>()
const rows = rankedRows
  .filter((row) => {
    if (seenSentenceIds.has(row.sentenceId)) return false
    seenSentenceIds.add(row.sentenceId)
    return true
  })
  .slice(0, blindLimit)
  .map(({ rank: _rank, ...row }) => ({ ...row, reviewType: 'blind-validation', semanticDecisionSource: 'sentence-read' }))
if (rows.length !== blindLimit) throw new Error(`Blind sample is too small: ${rows.length}`)
await writeFile(resolve(auditRoot, 'blind-validation-candidates.json'), `${JSON.stringify({
  round: 5,
  seed: blindSeed,
  sampleSize: rows.length,
  excludedSentenceIdCount: excludedSentenceIds.size,
  selectionPolicy: 'Rebuilt selected pool; new seed; no sentenceId overlap with initial Phase A, mandatory recheck, R4 independent validation, or any post-curation Phase A attempt; no duplicate sentenceIds within blind. A retest may encounter a prior blind pair only when it remains selected after curation. Machine metrics are omitted before sentence-read review.',
  rows,
}, null, 2)}\n`, 'utf8')
console.log(`Round 5 blind candidates prepared: ${rows.length}; excludedSentenceIds=${excludedSentenceIds.size}; uniqueSentenceIds=${new Set(rows.map((row) => row.sentenceId)).size}`)
