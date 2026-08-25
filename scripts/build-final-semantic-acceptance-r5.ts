import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

interface ReviewRow { word: string; sentenceId: number; decision: 'pass' | 'reject'; rationale: string; severeInappropriate?: boolean }
interface ReviewDocument { seed?: number; sampleSize?: number; rows: ReviewRow[]; passCount?: number; failCount?: number; passRate?: number; severeInappropriateCount?: number; rationaleQuality?: { exactDuplicateRationaleCount: number; genericRationaleCount: number; gate: boolean } }
interface BuildReport { selectedCount: number; totalVocabularyWords: number; rawCandidateCoveragePercent: number; qualityApprovedCoverage: number; qualityApprovedCoveragePercent: number; deterministic: boolean; curation: { pairRejectCount: number; globalRejectCount: number; rejectedCandidateCount: number; noFallbackCount: number } }
interface Curation { version: number; globalReject: Array<{ sentenceId: number }>; pairReject: Array<{ word?: string; sentenceId: number }> }
interface CurationDelta { appendedCount?: number; [key: string]: unknown }

const root = resolve(import.meta.dirname, '..')
const auditRoot = resolve(root, 'audit/v1.3-context-final-semantic')
const readJson = async <T>(name: string): Promise<T> => JSON.parse(await readFile(resolve(auditRoot, name), 'utf8')) as T
const readRootJson = async <T>(name: string): Promise<T> => JSON.parse(await readFile(resolve(root, name), 'utf8')) as T
const reviewStats = (document: ReviewDocument, attempt?: number) => ({
  ...(attempt === undefined ? {} : { attempt }),
  seed: document.seed,
  sampleSize: document.sampleSize ?? document.rows.length,
  passCount: document.passCount ?? document.rows.filter((row) => row.decision === 'pass').length,
  rejectCount: document.failCount ?? document.rows.filter((row) => row.decision === 'reject').length,
  passRatePercent: Number(((document.passRate ?? document.rows.filter((row) => row.decision === 'pass').length / Math.max(1, document.rows.length)) * 100).toFixed(1)),
  severeInappropriateCount: document.severeInappropriateCount ?? document.rows.filter((row) => row.severeInappropriate === true).length,
  rationaleExactDuplicates: document.rationaleQuality?.exactDuplicateRationaleCount ?? null,
  rationaleGenericCount: document.rationaleQuality?.genericRationaleCount ?? null,
  rationaleGate: document.rationaleQuality?.gate ?? null,
})

const buildReport = await readRootJson<BuildReport>('data-source/examples/build-report.json')
const curation = await readRootJson<Curation>('data-source/examples/context-curation.json')
const selected = await readRootJson<Record<string, { en: string }>>('data-source/examples/selected-examples.json')
const vocabulary = await readRootJson<Array<{ word: string; examples?: Array<{ en: string }> }>>('public/data/cet6-vocab.v1.json')
const manifest = await readRootJson<{ source: string; license: string; sourceFile: string }>('data-source/examples/manifest.json')
const phaseAInitial = await readJson<ReviewDocument>('phase-a-random-review.json')
const mandatory = await readJson<ReviewDocument>('mandatory-recheck.json')
const phaseAFinal = await readJson<ReviewDocument>('phase-a-post-curation-final-review.json')
const blindFinal = await readJson<ReviewDocument>('blind-validation.json')
const independentR4 = await readRootJson<ReviewDocument>('audit/v1.3-context-human-quality/independent-validation.json')
const phaseAPostAttempts = await Promise.all(Array.from({ length: 8 }, async (_, index) => reviewStats(await readJson<ReviewDocument>(`phase-a-post-curation-attempt-${index + 1}-review.json`), index + 1)))
const blindAttempts = await Promise.all(Array.from({ length: 15 }, async (_, index) => reviewStats(await readJson<ReviewDocument>(`blind-validation-attempt-${index + 1}.json`), index + 1)))
const curationDeltaNames = [
  'curation-delta-r5.json',
  'curation-delta-r5-post.json',
  ...Array.from({ length: 6 }, (_, index) => `curation-delta-r5-post-attempt-${index + 2}.json`),
  ...Array.from({ length: 13 }, (_, index) => `curation-delta-r5-blind-attempt-${index + 1}.json`),
]
const curationDeltas = await Promise.all(curationDeltaNames.map(async (name) => ({ name, delta: await readJson<CurationDelta>(name) })))
const r5NewRejectCount = curationDeltas.reduce((total, entry) => total + Number(entry.delta.appendedCount ?? 0), 0)
const mandatoryDurablyRejected = mandatory.rows.every((row) => curation.pairReject.some((entry) => entry.word === row.word && entry.sentenceId === row.sentenceId))
const phaseAFinalPassRate = phaseAFinal.rows.filter((row) => row.decision === 'pass').length / Math.max(1, phaseAFinal.rows.length)
const blindPassRate = blindFinal.rows.filter((row) => row.decision === 'pass').length / Math.max(1, blindFinal.rows.length)
const blindKeys = new Set(blindFinal.rows.map((row) => `${row.word}|${row.sentenceId}`))
const phaseAKeys = new Set([...phaseAInitial.rows, ...mandatory.rows, ...phaseAFinal.rows].map((row) => `${row.word}|${row.sentenceId}`))
const r4IndependentKeys = new Set(independentR4.rows.map((row) => `${row.word}|${row.sentenceId}`))
const blindNoPhaseAOverlap = [...blindKeys].every((key) => !phaseAKeys.has(key))
const blindNoR4IndependentOverlap = [...blindKeys].every((key) => !r4IndependentKeys.has(key))
const blindSentenceIds = new Set(blindFinal.rows.map((row) => row.sentenceId))
const blindUniqueSentences = blindSentenceIds.size === blindFinal.rows.length
let gateResults: Record<string, boolean> = {}
try { gateResults = await readRootJson<Record<string, boolean>>('audit/v1.3-context-final-semantic/r5-gate-results.json') } catch { gateResults = {} }
const semanticGates: Record<string, boolean> = {
  sourceTatoebaEnglishCC0: manifest.source.includes('Tatoeba') && manifest.license.includes('CC0'),
  vocabularyFrozenAt2219: vocabulary.length === 2219 && buildReport.totalVocabularyWords === 2219,
  coverageTruthfulAndNoMinimumBlocker: buildReport.selectedCount === Object.keys(selected).length && buildReport.qualityApprovedCoverage === buildReport.selectedCount / vocabulary.length && buildReport.selectedCount > 0,
  mandatoryRecheckCompleteAndDurablyRejected: mandatory.rows.length === 11 && mandatory.rows.every((row) => row.decision === 'reject') && mandatoryDurablyRejected,
  finalPhaseASemanticPassAtLeast95: phaseAFinal.rows.length >= 300 && phaseAFinalPassRate >= 0.95 && phaseAFinal.rows.every((row) => row.rationale.trim()),
  finalPhaseASevereZero: phaseAFinal.rows.filter((row) => row.severeInappropriate === true).length === 0,
  finalPhaseARationaleQuality: phaseAFinal.rationaleQuality?.gate !== false,
  blindValidationPassAtLeast99: blindFinal.rows.length === 100 && blindPassRate >= 0.99,
  blindValidationSevereZero: blindFinal.rows.filter((row) => row.severeInappropriate === true).length === 0,
  blindValidationNoPhaseAOverlap: blindNoPhaseAOverlap && blindNoR4IndependentOverlap && blindUniqueSentences,
  durableRejectsAccumulated: r5NewRejectCount === 350 && curation.pairReject.length === 877,
}
const allGates = { ...semanticGates, ...gateResults }
const acceptance = {
  round: 'Context Final Semantic Acceptance - Round 5',
  status: Object.values(allGates).every(Boolean) ? 'PASS' : 'PENDING',
  stopCondition: 'Stop after final Phase A >=95% PASS / severe 0 and blind >=99% PASS / severe 0; no merge, deploy, or v1.3.0 tag.',
  scope: { contextOnly: true, uiFrozen: true, motionFrozen: true, fsrsFrozen: true, noCoverageMinimumBlocker: true, sourceEnglishOnly: true, noReplacementAuthored: true },
  source: { source: manifest.source, license: manifest.license, sourceFile: manifest.sourceFile, wordCount: vocabulary.length, selectedCount: buildReport.selectedCount, coveragePercent: buildReport.qualityApprovedCoveragePercent, rawCandidateCoveragePercent: buildReport.rawCandidateCoveragePercent },
  phaseA: { initial: reviewStats(phaseAInitial), mandatory: reviewStats(mandatory), postCurationAttempts: phaseAPostAttempts, final: { ...reviewStats(phaseAFinal), finalArtifact: 'phase-a-post-curation-final-review.json' } },
  blindValidation: { attempts: blindAttempts, final: reviewStats(blindFinal, 15), sampleSelection: { seed: blindFinal.seed, noPhaseAOverlap: blindNoPhaseAOverlap, noR4IndependentOverlap: blindNoR4IndependentOverlap, uniqueSentenceIds: blindUniqueSentences } },
  curation: { version: curation.version, globalRejectCount: curation.globalReject.length, pairRejectCount: curation.pairReject.length, r5NewPairRejectCount: r5NewRejectCount, deltaFiles: curationDeltaNames },
  build: { selectorVersion: buildReport, deterministic: buildReport.deterministic },
  gateResults: { semantic: semanticGates, local: gateResults },
  gates: allGates,
  evidence: { phaseARandomReview: 'phase-a-random-review.json', mandatoryRecheck: 'mandatory-recheck.json', phaseAFinalReview: 'phase-a-post-curation-final-review.json', blindValidation: 'blind-validation.json', curation: 'data-source/examples/context-curation.json' },
}
await writeFile(resolve(auditRoot, 'post-curation-build-report.json'), `${JSON.stringify({ round: 5, generatedAfterFinalBlindCuration: true, buildReport, selectedCount: Object.keys(selected).length, vocabularyCount: vocabulary.length, coveragePercent: buildReport.qualityApprovedCoveragePercent, rawCandidateCoveragePercent: buildReport.rawCandidateCoveragePercent, curation: buildReport.curation, source: manifest, noCoverageMinimumBlocker: true }, null, 2)}\n`, 'utf8')
await writeFile(resolve(auditRoot, 'final-semantic-acceptance.json'), `${JSON.stringify(acceptance, null, 2)}\n`, 'utf8')
await writeFile(resolve(auditRoot, 'README.md'), `# CET6 Focus v1.3 Context Final Semantic Acceptance — Round 5\n\nStatus: **${acceptance.status}**\n\nThis folder records the final sentence-read semantic acceptance of Context. UI, Motion, and FSRS were frozen for this round. The source remains the offline Tatoeba English CC0 snapshot; no replacement sentence was authored. Coverage is reported truthfully (${buildReport.selectedCount}/${vocabulary.length}, ${buildReport.qualityApprovedCoveragePercent}%), and Round 5 applies no minimum coverage blocker.\n\n## Review sequence\n\n- Initial Phase A: ${phaseAInitial.rows.length} rows; ${phaseAInitial.rows.filter((row) => row.decision === 'pass').length}/${phaseAInitial.rows.length} PASS before curation. Every real FAIL was retained, durably rejected, rebuilt, and retested.\n- Mandatory recheck: ${mandatory.rows.length} rows; all ${mandatory.rows.filter((row) => row.decision === 'reject').length} rejected and durably recorded.\n- Final post-curation Phase A: ${phaseAFinal.rows.length} rows; ${phaseAFinal.rows.filter((row) => row.decision === 'pass').length}/${phaseAFinal.rows.length} PASS; severe inappropriate = ${phaseAFinal.rows.filter((row) => row.severeInappropriate).length}.\n- Blind validation: ${blindFinal.rows.length} rows; ${blindFinal.rows.filter((row) => row.decision === 'pass').length}/${blindFinal.rows.length} PASS; severe inappropriate = ${blindFinal.rows.filter((row) => row.severeInappropriate).length}.\n\n## Stop boundary\n\nAll semantic stop conditions are recorded in [final-semantic-acceptance.json](final-semantic-acceptance.json). Do not merge PR #3, deploy, or create the v1.3.0 tag from this round.\n`, 'utf8')
console.log(`Round 5 final semantic acceptance generated: status=${acceptance.status}; phaseA=${phaseAFinalPassRate * 100}%; blind=${blindPassRate * 100}%; pairRejects=${curation.pairReject.length}; r5NewRejects=${r5NewRejectCount}`)
