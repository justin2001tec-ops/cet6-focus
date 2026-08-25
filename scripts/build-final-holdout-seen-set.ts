import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

interface SelectedExample { en: string }
interface Provenance { sentenceId: number }
interface HoldoutRow { word: string; sentenceId: number; sentence: string; holdoutIndex?: number; seed?: number }

const root = resolve(import.meta.dirname, '..')
const auditRoot = resolve(root, 'audit/v1.3-final-holdout')
const finalSemanticRoot = resolve(root, 'audit/v1.3-context-final-semantic')
const humanQualityRoot = resolve(root, 'audit/v1.3-context-human-quality')
const expectedHead = '0bf592ccd8888f60094d427da1784cc5d3bcd473'
const holdoutSeed = 216490001

const readJson = async <T>(path: string): Promise<T> => JSON.parse(await readFile(path, 'utf8')) as T
const hashFile = async (path: string): Promise<string> => createHash('sha256').update(await readFile(path)).digest('hex')
const addIds = (value: unknown, ids: Set<number>): number => {
  let rowCount = 0
  if (Array.isArray(value)) {
    for (const item of value) rowCount += addIds(item, ids)
    return rowCount
  }
  if (!value || typeof value !== 'object') return 0
  const record = value as Record<string, unknown>
  if (typeof record.sentenceId === 'number' && Number.isInteger(record.sentenceId)) {
    ids.add(record.sentenceId)
    rowCount += 1
  }
  for (const child of Object.values(record)) rowCount += addIds(child, ids)
  return rowCount
}

const currentHead = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
if (currentHead !== expectedHead) throw new Error(`Frozen head mismatch: expected ${expectedHead}, got ${currentHead}`)

const sourceFiles = {
  r4: [
    'risk-targeted-review.json',
    'random-semantic-review-pass1.json',
    'independent-validation.json',
    'r3-risk-candidate-baseline.json',
  ].map((name) => resolve(humanQualityRoot, name)),
  r5PhaseA: [
    'phase-a-candidates.json',
    'phase-a-random-review.json',
    'phase-a-final-semantic-review.json',
    'mandatory-recheck-candidates.json',
    'mandatory-recheck.json',
  ].map((name) => resolve(finalSemanticRoot, name)),
  r5PostCuration: (await readdir(finalSemanticRoot))
    .filter((name) => /^phase-a-post-curation-.*\.json$/i.test(name))
    .sort()
    .map((name) => resolve(finalSemanticRoot, name)),
  r5BlindAttempts: (await readdir(finalSemanticRoot))
    .filter((name) => /^blind-validation-attempt-.*\.json$/i.test(name))
    .concat(['blind-validation-candidates.json', 'blind-validation.json'])
    .filter((name, index, names) => names.indexOf(name) === index)
    .sort()
    .map((name) => resolve(finalSemanticRoot, name)),
}

const seenSentenceIds = new Set<number>()
const sourceReports: Record<string, { fileCount: number; rawSentenceIdCount: number; uniqueSentenceIdCount: number; files: string[] }> = {}
for (const [source, paths] of Object.entries(sourceFiles)) {
  const sourceIds = new Set<number>()
  let rawSentenceIdCount = 0
  for (const path of paths) {
    const document = await readJson<unknown>(path)
    rawSentenceIdCount += addIds(document, sourceIds)
  }
  for (const sentenceId of sourceIds) seenSentenceIds.add(sentenceId)
  sourceReports[source] = {
    fileCount: paths.length,
    rawSentenceIdCount,
    uniqueSentenceIdCount: sourceIds.size,
    files: paths.map((path) => path.slice(root.length + 1).replaceAll('\\', '/')),
  }
}

const selected = await readJson<Record<string, SelectedExample>>(resolve(root, 'data-source/examples/selected-examples.json'))
const provenance = await readJson<Record<string, Provenance>>(resolve(root, 'data-source/examples/example-provenance.json'))
const selectedRows: HoldoutRow[] = Object.entries(selected).map(([word, example]) => {
  const trace = provenance[word]
  if (!trace || typeof trace.sentenceId !== 'number') throw new Error(`Missing provenance for selected word: ${word}`)
  return { word, sentenceId: trace.sentenceId, sentence: example.en }
})
const selectedIds = new Set(selectedRows.map((row) => row.sentenceId))
const selectedSeenRows = selectedRows.filter((row) => seenSentenceIds.has(row.sentenceId))
const eligibleUnseenRows = selectedRows.filter((row) => !seenSentenceIds.has(row.sentenceId))
const selectedHashBefore = await hashFile(resolve(root, 'data-source/examples/selected-examples.json'))
const curationHashBefore = await hashFile(resolve(root, 'data-source/examples/context-curation.json'))

function seededRank(value: string, seed: number): number {
  let state = seed >>> 0
  for (const character of value) state = (Math.imul(state ^ character.charCodeAt(0), 1664525) + 1013904223) >>> 0
  return state
}

const path = eligibleUnseenRows.length >= 100 ? 'A' : eligibleUnseenRows.length >= 60 ? 'B' : 'C'
const status = path === 'A' ? 'HOLDOUT_READY' : path === 'B' ? 'LIMITED_HOLDOUT_READY' : 'HOLDOUT_EXHAUSTED'
const sampleRows = path === 'C'
  ? []
  : [...eligibleUnseenRows]
    .sort((a, b) => seededRank(`${a.word.toLocaleLowerCase()}::${a.sentenceId}`, holdoutSeed) - seededRank(`${b.word.toLocaleLowerCase()}::${b.sentenceId}`, holdoutSeed) || a.word.localeCompare(b.word) || a.sentenceId - b.sentenceId)
    .slice(0, path === 'A' ? 100 : eligibleUnseenRows.length)
    .map((row, index) => ({ ...row, holdoutIndex: index + 1, seed: holdoutSeed }))

await mkdir(auditRoot, { recursive: true })
await writeFile(resolve(auditRoot, 'seen-sentence-ids.json'), `${JSON.stringify({
  round: 'v1.3 Final Holdout Validation',
  currentHead,
  sentenceIds: [...seenSentenceIds].sort((a, b) => a - b),
}, null, 2)}\n`, 'utf8')
await writeFile(resolve(auditRoot, 'seen-set-report.json'), `${JSON.stringify({
  round: 'v1.3 Final Holdout Validation',
  currentHead,
  currentSelectedCount: selectedRows.length,
  totalHistoricalSeenSentenceIds: seenSentenceIds.size,
  selectedSeenCount: selectedSeenRows.length,
  selectedUnseenCount: eligibleUnseenRows.length,
  selectedSentenceIdCount: selectedIds.size,
  sources: sourceReports,
  integrity: {
    selectedHashBefore,
    curationHashBefore,
    priorPassFilterUsed: false,
    machineScoreFilterUsed: false,
  },
}, null, 2)}\n`, 'utf8')
await writeFile(resolve(auditRoot, 'holdout-eligibility.json'), `${JSON.stringify({
  round: 'v1.3 Final Holdout Validation',
  currentHead,
  holdoutSeed,
  eligibleUnseenCount: eligibleUnseenRows.length,
  path,
  status,
  sampleSize: sampleRows.length,
  selectionRule: 'Current selected sentenceId not present in any historical candidate/review artifact; no prior decision, rationale, machine score, or PASS pool was read for selection.',
}, null, 2)}\n`, 'utf8')
await writeFile(resolve(auditRoot, 'holdout-candidates.json'), `${JSON.stringify({
  round: 'v1.3 Final Holdout Validation',
  currentHead,
  holdoutSeed,
  path,
  status,
  sampleSize: sampleRows.length,
  rows: sampleRows,
}, null, 2)}\n`, 'utf8')
await writeFile(resolve(auditRoot, 'holdout-integrity.json'), `${JSON.stringify({
  round: 'v1.3 Final Holdout Validation',
  currentHead,
  selectedCountBefore: selectedRows.length,
  selectedHashBefore,
  curationHashBefore,
  eligibleUnseenCount: eligibleUnseenRows.length,
  sampleSize: sampleRows.length,
  seed: holdoutSeed,
  priorPassFilterUsed: false,
  machineScoreFilterUsed: false,
  postHoldoutDataMutation: false,
  selectedHashAfter: null,
  curationHashAfter: null,
}, null, 2)}\n`, 'utf8')
console.log(JSON.stringify({
  currentHead,
  currentSelectedCount: selectedRows.length,
  totalHistoricalSeenSentenceIds: seenSentenceIds.size,
  selectedSeenCount: selectedSeenRows.length,
  eligibleUnseenCount: eligibleUnseenRows.length,
  path,
  status,
  sampleSize: sampleRows.length,
  selectedHashBefore,
  curationHashBefore,
}, null, 2))
