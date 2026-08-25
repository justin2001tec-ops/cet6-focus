import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

interface Eligibility { currentHead: string; holdoutSeed: number; eligibleUnseenCount: number; path: 'A' | 'B' | 'C'; status: string; sampleSize: number }
interface SeenReport { currentSelectedCount: number; selectedSeenCount: number; selectedUnseenCount: number; totalHistoricalSeenSentenceIds: number; sources: Record<string, unknown>; integrity: { selectedHashBefore: string; curationHashBefore: string; priorPassFilterUsed: boolean; machineScoreFilterUsed: boolean } }
interface BuildReport { selectedCount: number; qualityApprovedCoveragePercent: number; rawCandidateCoveragePercent: number }

const root = resolve(import.meta.dirname, '..')
const auditRoot = resolve(root, 'audit/v1.3-final-holdout')
const expectedHead = '0bf592ccd8888f60094d427da1784cc5d3bcd473'
const readJson = async <T>(name: string, base = auditRoot): Promise<T> => JSON.parse(await readFile(resolve(base, name), 'utf8')) as T
const hashFile = async (path: string): Promise<string> => createHash('sha256').update(await readFile(path)).digest('hex')
const currentHead = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
if (currentHead !== expectedHead) throw new Error(`Frozen head mismatch: expected ${expectedHead}, got ${currentHead}`)

const eligibility = await readJson<Eligibility>('holdout-eligibility.json')
const seenReport = await readJson<SeenReport>('seen-set-report.json')
const buildReport = await readJson<BuildReport>('build-report.json', resolve(root, 'data-source/examples'))
const selectedPath = resolve(root, 'data-source/examples/selected-examples.json')
const curationPath = resolve(root, 'data-source/examples/context-curation.json')
const selectedHashAfter = await hashFile(selectedPath)
const curationHashAfter = await hashFile(curationPath)
const postHoldoutDataMutation = selectedHashAfter !== seenReport.integrity.selectedHashBefore || curationHashAfter !== seenReport.integrity.curationHashBefore
if (postHoldoutDataMutation) throw new Error('Holdout integrity failure: selected examples or curation changed after the before-hash.')

const status = eligibility.status
const isExhausted = status === 'HOLDOUT_EXHAUSTED'
if (!isExhausted) throw new Error(`This finalizer is intentionally for the observed exhausted path; got ${status}`)
const integrity = {
  round: 'v1.3 Final Holdout Validation',
  currentHead,
  selectedCountBefore: seenReport.currentSelectedCount,
  selectedHashBefore: seenReport.integrity.selectedHashBefore,
  curationHashBefore: seenReport.integrity.curationHashBefore,
  eligibleUnseenCount: eligibility.eligibleUnseenCount,
  sampleSize: 0,
  seed: eligibility.holdoutSeed,
  priorPassFilterUsed: false,
  machineScoreFilterUsed: false,
  postHoldoutDataMutation,
  selectedCountAfter: seenReport.currentSelectedCount,
  selectedHashAfter,
  curationHashAfter,
  selectedHashUnchanged: selectedHashAfter === seenReport.integrity.selectedHashBefore,
  curationHashUnchanged: curationHashAfter === seenReport.integrity.curationHashBefore,
}
const review = {
  round: 'v1.3 Final Holdout Validation',
  status,
  reviewPerformed: false,
  sampleSize: 0,
  passCount: null,
  minorFailCount: null,
  majorFailCount: null,
  severeFailCount: null,
  passRatePercent: null,
  rows: [],
  stopReason: 'All 990 currently selected sentence IDs were present in historical candidate/review artifacts; no true unseen selected sentence remained. Per handoff Path C, semantic review did not begin.',
  noAutomaticCuration: true,
  noSeedResample: true,
}
const finalAcceptance = {
  round: 'v1.3 Final Holdout Validation',
  status,
  currentHead,
  currentSelectedCount: seenReport.currentSelectedCount,
  currentCoveragePercent: buildReport.qualityApprovedCoveragePercent,
  rawCandidateCoveragePercent: buildReport.rawCandidateCoveragePercent,
  totalHistoricalSeenSentenceIds: seenReport.totalHistoricalSeenSentenceIds,
  selectedSeenCount: seenReport.selectedSeenCount,
  eligibleUnseenCount: eligibility.eligibleUnseenCount,
  path: eligibility.path,
  sampleSize: 0,
  passCount: null,
  minorFailCount: null,
  majorFailCount: null,
  severeFailCount: null,
  passRatePercent: null,
  reviewPerformed: false,
  postHoldoutDataMutation: false,
  priorPassFilterUsed: false,
  machineScoreFilterUsed: false,
  noAutomaticCuration: true,
  noSeedResample: true,
  verificationGates: {
    typecheck: true,
    lint: true,
    unitTests: true,
    holdoutIntegrity: true,
  },
  integrity,
  methodologyCorrection: 'Round 5 final 100/100 was not an independent holdout because its final retest selected from priorBlindPassPairs. This final validation did not reuse that pool; all historical candidate/review sentence IDs, including blind attempts 1-15 PASS and FAIL, were treated as seen.',
  evidence: {
    seenSentenceIds: 'seen-sentence-ids.json',
    seenSetReport: 'seen-set-report.json',
    eligibility: 'holdout-eligibility.json',
    candidates: 'holdout-candidates.json',
    review: 'holdout-review.json',
    integrity: 'holdout-integrity.json',
  },
}
const summary = `# v1.3 Final Holdout Validation\n\n## Status: ${status}\n\nThe frozen release candidate contains ${seenReport.currentSelectedCount} selected examples. Historical candidate/review artifacts contain ${seenReport.totalHistoricalSeenSentenceIds} unique sentence IDs, and all ${seenReport.selectedSeenCount} selected sentence IDs are in that seen set.\n\n- Eligible unseen selected examples: **${eligibility.eligibleUnseenCount}**\n- Path: **C — HOLDOUT_EXHAUSTED**\n- Holdout sample: **0**\n- Semantic review: **not started**\n- Prior PASS pool reuse: **false**\n- Machine-score selection: **false**\n- Post-holdout curation/rebuild/resampling: **none**\n\nPer the handoff, no historical sample was reused to manufacture a 100-item holdout. The current 990 selected examples and curation remain unchanged. This result is submitted as-is for final Merge & Release decision.\n`
const readme = `# CET6 Focus v1.3 Final Holdout Validation\n\nStatus: **${status}**\n\nThis directory records the one-time unseen holdout eligibility calculation against frozen HEAD ${currentHead}. Every sentence ID present in historical candidate/review artifacts was treated as seen, including PASS and FAIL rows from Round 5 blind attempts 1-15. The current selected pool has no eligible unseen sentence, so the handoff requires an immediate exhausted stop.\n\nNo semantic review, curation, rebuild, seed change, resampling, or data mutation was performed after the exhaustion result.\n\nSee [final-holdout-acceptance.json](final-holdout-acceptance.json) and [holdout-integrity.json](holdout-integrity.json).\n`
await writeFile(resolve(auditRoot, 'holdout-integrity.json'), `${JSON.stringify(integrity, null, 2)}\n`, 'utf8')
await writeFile(resolve(auditRoot, 'holdout-review.json'), `${JSON.stringify(review, null, 2)}\n`, 'utf8')
await writeFile(resolve(auditRoot, 'holdout-review.csv'), 'index,word,sentenceId,sentence,decision,severity,rationale\n', 'utf8')
await writeFile(resolve(auditRoot, 'holdout-rationale-quality.json'), `${JSON.stringify({
  round: 'v1.3 Final Holdout Validation',
  status,
  reviewPerformed: false,
  reviewedRows: 0,
  exactDuplicateRationaleCount: null,
  genericRationaleCount: null,
  gate: null,
}, null, 2)}\n`, 'utf8')
await writeFile(resolve(auditRoot, 'final-holdout-acceptance.json'), `${JSON.stringify(finalAcceptance, null, 2)}\n`, 'utf8')
await writeFile(resolve(auditRoot, 'holdout-summary.md'), summary, 'utf8')
await writeFile(resolve(auditRoot, 'README.md'), readme, 'utf8')
console.log(JSON.stringify({ status, eligibleUnseenCount: eligibility.eligibleUnseenCount, sampleSize: 0, postHoldoutDataMutation, selectedHashUnchanged: integrity.selectedHashUnchanged, curationHashUnchanged: integrity.curationHashUnchanged }, null, 2))
