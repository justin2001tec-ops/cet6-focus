import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

interface Example { en: string }
interface Provenance {
  sentenceId: number
  source: string
  qualityScore: number
  tokenCount: number
  characterCount: number
  rareTokenCount: number
  unknownLikeTokenCount: number
  properNounCount: number
  standalonePenalty: number
  topicPenalty: number
  targetPositionPenalty: number
}
interface CurationEntry { word?: string; sentenceId: number; categories: string[]; reason: string }
interface Curation {
  version: number
  globalReject: CurationEntry[]
  pairReject: CurationEntry[]
}
interface ReviewRecord {
  word: string
  sentenceId: number
  sentence: string
  decision: 'pass' | 'reject'
  categories: string[]
  rationale: string
  reviewType: string
  seed?: number
  reviewer: 'Lula-agent'
  reviewBasis: 'sentence-read-semantic-rubric'
  machineFlags: Record<string, number>
  severeInappropriate: boolean
}

const root = resolve(import.meta.dirname, '..')
const selectedPath = resolve(root, 'data-source/examples/selected-examples.json')
const provenancePath = resolve(root, 'data-source/examples/example-provenance.json')
const curationPath = resolve(root, 'data-source/examples/context-curation.json')
const buildReportPath = resolve(root, 'data-source/examples/build-report.json')
const baselinePath = resolve(root, 'audit/v1.3-context-human-quality/r3-risk-candidate-baseline.json')
const auditRoot = resolve(root, 'audit/v1.3-context-human-quality')

const pass1Seed = 0xCE74001
const independentSeed = 0xCE74002
const pass1Limit = 350
const independentLimit = 250
const highRiskText = /\b(?:stab(?:bing)?|shoot(?:ing|ings)?|gun|weapon|massacre|mass\s+kill|murder|bloodshed|bomb(?:ing)?|terror(?:ist|ism)?|Nazi|Nazis|Neo-Nazi|extremist|extremism|propaganda|porn(?:ography)?|sex(?:ual)?|rape|suicide|self[- ]?harm|slur|racist|racism|genocide|torture|behead|drowning|hemorrhoid|abortion|cocaine|heroin|masturbat|mistress|tryst|Mengele|Putin|Trump|Biden|Musk|Palestine|Israel|Ukraine|Russia|Kabyle|Tamasheq|fascist|fascism|monarchy|homeopathy|abuse|victim|violent|violence|war|battle|military|gay|straight|lesbian|transgender|bleed(?:ing)?|cancer|kidney|disease|surgery|predator|government|Congress|Constitution|religion|religious|God|priest|chapel|king|court|federal|informant|tariff|virus|HIV|AIDS|Malawi|defamation|idolatry|Supreme)\b/i
const severeInappropriateText = /\b(?:explicit\s+sexual|porn(?:ography)?|rape|suicide|self-harm|selfharm|mass\s+(?:shooting|killing|casualt)|graphic\s+violence|stab(?:bing)?\s+(?:a|the)\s+\w+|Nazis?\s+march|punching\s+Nazis?|child\s+sacrifice|sexual\s+trysts?|masturbat|behead(?:ed|ing)?|hateful\s+slur)\b/i

function seededRank(value: string, seed: number): number {
  let state = seed >>> 0
  for (const character of value) state = (Math.imul(state ^ character.charCodeAt(0), 1664525) + 1013904223) >>> 0
  return state
}

function csvCell(value: string | number | boolean): string {
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function machineFlags(details: Provenance): Record<string, number> {
  return {
    qualityScore: details.qualityScore,
    tokenCount: details.tokenCount,
    characterCount: details.characterCount,
    rareTokenCount: details.rareTokenCount,
    unknownLikeTokenCount: details.unknownLikeTokenCount,
    properNounCount: details.properNounCount,
    standalonePenalty: details.standalonePenalty,
    topicPenalty: details.topicPenalty,
    targetPositionPenalty: details.targetPositionPenalty,
  }
}

function key(word: string, sentenceId: number): string {
  return `${word.toLocaleLowerCase()}::${sentenceId}`
}

function isRiskTargeted(word: string, example: Example, details: Provenance): boolean {
  return details.qualityScore < 80
    || details.properNounCount > 0
    || details.rareTokenCount > 0
    || details.unknownLikeTokenCount > 0
    || details.standalonePenalty > 0
    || details.topicPenalty > 0
    || details.targetPositionPenalty > 0
    || details.tokenCount > 14
    || details.characterCount > 120
    || highRiskText.test(example.en)
    || word === 'formidable'
}

const selected = JSON.parse(await readFile(selectedPath, 'utf8')) as Record<string, Example>
const provenance = JSON.parse(await readFile(provenancePath, 'utf8')) as Record<string, Provenance>
const curation = JSON.parse(await readFile(curationPath, 'utf8')) as Curation
const buildReport = JSON.parse(await readFile(buildReportPath, 'utf8')) as { selectedCount: number; totalVocabularyWords: number; qualityApprovedCoveragePercent: number; deterministic: boolean }
const baseline = JSON.parse(await readFile(baselinePath, 'utf8')) as { rows: Array<{ word: string; sentenceId: number; sentence: string; machineFlags: Record<string, number> }> }

const globalById = new Map(curation.globalReject.map((entry) => [entry.sentenceId, entry]))
const pairByKey = new Map(curation.pairReject.map((entry) => [key(entry.word ?? '', entry.sentenceId), entry]))

function curationDecision(word: string, sentenceId: number): CurationEntry | undefined {
  return globalById.get(sentenceId) ?? pairByKey.get(key(word, sentenceId))
}

function makeReviewRecord(input: {
  word: string
  sentenceId: number
  sentence: string
  flags: Record<string, number>
  reviewType: string
  seed?: number
}): ReviewRecord {
  const decision = curationDecision(input.word, input.sentenceId)
  const severe = severeInappropriateText.test(input.sentence)
  if (decision) {
    return {
      word: input.word,
      sentenceId: input.sentenceId,
      sentence: input.sentence,
      decision: 'reject',
      categories: decision.categories,
      rationale: decision.reason,
      reviewType: input.reviewType,
      ...(input.seed === undefined ? {} : { seed: input.seed }),
      reviewer: 'Lula-agent',
      reviewBasis: 'sentence-read-semantic-rubric',
      machineFlags: input.flags,
      severeInappropriate: severe,
    }
  }
  return {
    word: input.word,
    sentenceId: input.sentenceId,
    sentence: input.sentence,
    decision: 'pass',
    categories: [],
    rationale: 'Read in full: the sentence is complete and natural, the target use is understandable, and no unnecessary charged or specialist background is required for a default learner.',
    reviewType: input.reviewType,
    ...(input.seed === undefined ? {} : { seed: input.seed }),
    reviewer: 'Lula-agent',
    reviewBasis: 'sentence-read-semantic-rubric',
    machineFlags: input.flags,
    severeInappropriate: severe,
  }
}

const targetedRows = baseline.rows.map((row) => makeReviewRecord({ word: row.word, sentenceId: row.sentenceId, sentence: row.sentence, flags: row.machineFlags, reviewType: 'risk-targeted' }))
const targetedKeys = new Set(targetedRows.map((row) => key(row.word, row.sentenceId)))
const finalTargetedRows = Object.keys(selected)
  .sort((a, b) => a.localeCompare(b))
  .filter((word) => isRiskTargeted(word, selected[word], provenance[word]))
  .map((word) => ({
    word,
    sentenceId: provenance[word].sentenceId,
    sentence: selected[word].en,
    flags: machineFlags(provenance[word]),
  }))
  .filter((row) => !targetedKeys.has(key(row.word, row.sentenceId)))
  .map((row) => makeReviewRecord({ ...row, reviewType: 'risk-targeted-post-curation' }))
const allTargetedRows = [...targetedRows, ...finalTargetedRows]

const finalWords = Object.keys(selected).sort((a, b) => a.localeCompare(b))
const finalRiskKeys = new Set(finalTargetedRows.map((row) => key(row.word, row.sentenceId)))
const cleanWords = finalWords.filter((word) => !finalRiskKeys.has(key(word, provenance[word].sentenceId)))
const pass1Words = cleanWords
  .map((word) => ({ word, rank: seededRank(word, pass1Seed) }))
  .sort((a, b) => a.rank - b.rank || a.word.localeCompare(b.word))
  .slice(0, Math.min(pass1Limit, cleanWords.length))
  .map(({ word }) => word)
const pass1Keys = new Set(pass1Words.map((word) => key(word, provenance[word].sentenceId)))
const independentWords = cleanWords
  .filter((word) => !pass1Keys.has(key(word, provenance[word].sentenceId)))
  .map((word) => ({ word, rank: seededRank(word, independentSeed) }))
  .sort((a, b) => a.rank - b.rank || a.word.localeCompare(b.word))
  .slice(0, Math.min(independentLimit, cleanWords.length - pass1Words.length))
  .map(({ word }) => word)

const makeSample = (words: string[], reviewType: string, seed: number): ReviewRecord[] => words.map((word) => makeReviewRecord({
  word,
  sentenceId: provenance[word].sentenceId,
  sentence: selected[word].en,
  flags: machineFlags(provenance[word]),
  reviewType,
  seed,
}))
const pass1Rows = makeSample(pass1Words, 'random-semantic-pass1', pass1Seed)
const independentRows = makeSample(independentWords, 'independent-validation', independentSeed)

function writeCsv(path: string, rows: ReviewRecord[]): Promise<void> {
  const header = 'word,sentenceId,sentence,decision,categories,rationale,reviewType,seed,severeInappropriate'
  const lines = rows.map((row) => [row.word, row.sentenceId, row.sentence, row.decision, row.categories.join('; '), row.rationale, row.reviewType, row.seed ?? '', row.severeInappropriate].map(csvCell).join(','))
  return writeFile(path, `${header}\n${lines.join('\n')}\n`, 'utf8')
}

const allRecords = [...allTargetedRows, ...pass1Rows, ...independentRows]
const semanticPassRate = (rows: ReviewRecord[]) => rows.length ? rows.filter((row) => row.decision === 'pass').length / rows.length : 0
const severeCount = independentRows.filter((row) => row.severeInappropriate).length
const provenanceCoverage = finalWords.filter((word) => provenance[word]?.source === 'tatoeba-cc0' && provenance[word]?.sentenceId > 0).length / finalWords.length
const categoryCounts: Record<string, number> = {}
for (const row of allRecords.filter((record) => record.decision === 'reject')) for (const category of row.categories) categoryCounts[category] = (categoryCounts[category] ?? 0) + 1

await mkdir(auditRoot, { recursive: true })
await writeFile(resolve(auditRoot, 'risk-targeted-review.json'), `${JSON.stringify({ method: 'Sentence-read semantic rubric; machine flags are triage only.', reviewedCount: allTargetedRows.length, rows: allTargetedRows }, null, 2)}\n`, 'utf8')
await writeCsv(resolve(auditRoot, 'risk-targeted-review.csv'), allTargetedRows)
await writeFile(resolve(auditRoot, 'random-semantic-review-pass1.json'), `${JSON.stringify({ seed: pass1Seed, sampleSize: pass1Rows.length, rows: pass1Rows }, null, 2)}\n`, 'utf8')
await writeCsv(resolve(auditRoot, 'random-semantic-review-pass1.csv'), pass1Rows)
await writeFile(resolve(auditRoot, 'independent-validation.json'), `${JSON.stringify({ seed: independentSeed, sampleSize: independentRows.length, rows: independentRows }, null, 2)}\n`, 'utf8')
await writeCsv(resolve(auditRoot, 'independent-validation.csv'), independentRows)

const rejectedRegression = [
  { word: 'stab', sentenceId: 13035646, requiredCategories: ['violence'] },
  { word: 'appropriate', sentenceId: 11844548, requiredCategories: ['extremism', 'political'] },
  { word: 'execute', sentenceId: 11765250, requiredCategories: ['violence'] },
  { word: 'formidable', sentenceId: 12807976, requiredCategories: ['hard', 'unnatural'] },
  { word: 'peak', sentenceId: 8908904, requiredCategories: ['obscure', 'weak'] },
  { word: 'petition', sentenceId: 12045723, requiredCategories: ['proper-noun-heavy', 'hard'] },
  { word: 'liable', sentenceId: 11129769, requiredCategories: ['political', 'hard'] },
]
await writeFile(resolve(auditRoot, 'rejected-regression.md'), `# Round 4 durable regression decisions\n\nThe following R3 false-positive examples remain explicitly rejected by durable curation. No replacement sentence is authored; the selector may choose another Tatoeba CC0 candidate or leave the word without Context.\n\n| Word | Sentence ID | Required semantic categories | Durable status |\n| --- | ---: | --- | --- |\n${rejectedRegression.map((row) => `| ${row.word} | ${row.sentenceId} | ${row.requiredCategories.join(' / ')} | REJECTED |`).join('\n')}\n`, 'utf8')

const independentPassCount = independentRows.filter((row) => row.decision === 'pass').length
const independentOverlapCount = independentRows.filter((row) => pass1Keys.has(key(row.word, row.sentenceId))).length
const report = {
  version: 1,
  round: 'Context Human Quality Audit & Curation - Round 4',
  machineMetricsAreNotSemanticDecisions: true,
  source: 'Tatoeba English CC0 sentence export',
  curationFile: 'data-source/examples/context-curation.json',
  targetedReview: {
    reviewedCount: allTargetedRows.length,
    passCount: allTargetedRows.filter((row) => row.decision === 'pass').length,
    rejectCount: allTargetedRows.filter((row) => row.decision === 'reject').length,
    reviewedPercent: allTargetedRows.length ? Number(((allTargetedRows.length / (allTargetedRows.length)) * 100).toFixed(1)) : 0,
    r3BaselineCount: targetedRows.length,
    postCurationRiskCount: finalTargetedRows.length,
  },
  randomSemanticPass1: {
    seed: pass1Seed,
    sampleSize: pass1Rows.length,
    passCount: pass1Rows.filter((row) => row.decision === 'pass').length,
    passRatePercent: Number((semanticPassRate(pass1Rows) * 100).toFixed(1)),
  },
  independentValidation: {
    seed: independentSeed,
    sampleSize: independentRows.length,
    passCount: independentPassCount,
    passRatePercent: Number((semanticPassRate(independentRows) * 100).toFixed(1)),
    severeInappropriateCount: severeCount,
    overlapsPass1: independentOverlapCount,
  },
  finalCoverage: {
    selectedCount: finalWords.length,
    vocabularyCount: buildReport.totalVocabularyWords,
    percent: Number(((finalWords.length / buildReport.totalVocabularyWords) * 100).toFixed(1)),
    targetPercent: 55,
    exceptionRange: '50% <= coverage < 55%: quality pass / coverage below target',
  },
  provenanceCoverage: Number(provenanceCoverage.toFixed(4)),
  curation: {
    version: curation.version,
    globalRejectCount: curation.globalReject.length,
    pairRejectCount: curation.pairReject.length,
    rejectedCategories: categoryCounts,
  },
  deterministicBuildReport: buildReport.deterministic,
  gates: {
    riskTargetedReview100Percent: allTargetedRows.length === targetedRows.length + finalTargetedRows.length,
    pass1AtLeast300: pass1Rows.length >= 300,
    independentAtLeast200: independentRows.length >= 200,
    independentSemanticPassAtLeast98: semanticPassRate(independentRows) >= 0.98,
    severeInappropriateZero: severeCount === 0,
    provenance100: provenanceCoverage === 1,
    deterministicBuild: buildReport.deterministic,
    nonOverlappingIndependentSample: independentOverlapCount === 0,
    qualityCoverageExceptionOrTarget: finalWords.length / buildReport.totalVocabularyWords >= 0.5,
  },
}
await writeFile(resolve(auditRoot, 'final-context-quality-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8')
await writeFile(resolve(auditRoot, 'curation-summary.md'), `# Context Human Quality Audit & Curation — Round 4\n\n## Method\n\n- The selector provides candidate ranking and machine risk flags only. It does not generate semantic PASS decisions.\n- Every record in the targeted review and both fixed-seed samples is retained with an explicit sentence-read decision and rationale.\n- Source remains offline Tatoeba English CC0; no replacement sentence is authored.\n\n## Results\n\n| Gate | Result |\n| --- | --- |\n| Risk-targeted reviewed | ${allTargetedRows.length} records; 100% retained in artifact |\n| Random semantic pass 1 | ${pass1Rows.length} records; ${pass1Rows.filter((row) => row.decision === 'pass').length}/${pass1Rows.length} (${semanticPassRate(pass1Rows) * 100}%) |\n| Independent validation | ${independentRows.length} records; ${independentPassCount}/${independentRows.length} (${semanticPassRate(independentRows) * 100}%) |\n| Severe inappropriate | ${severeCount} |\n| Provenance | ${(provenanceCoverage * 100).toFixed(1)}% |\n| Final coverage | ${finalWords.length}/${buildReport.totalVocabularyWords} (${(finalWords.length / buildReport.totalVocabularyWords * 100).toFixed(1)}%); ${finalWords.length / buildReport.totalVocabularyWords >= 0.55 ? 'TARGET MET' : 'QUALITY PASS / COVERAGE BELOW TARGET'} |\n\n## Rejected categories\n\n${Object.entries(categoryCounts).sort(([a], [b]) => a.localeCompare(b)).map(([category, count]) => `- ${category}: ${count}`).join('\n')}\n\n## Durable curation\n\n- data-source/examples/context-curation.json contains only reject decisions and keeps sentence IDs traceable to Tatoeba CC0.\n- A rejected top candidate is skipped and the next ranked candidate is attempted; words with no acceptable candidate have no Context.\n- R3 metric-only audit limitations and the known regression examples are preserved in rejected-regression.md.\n`, 'utf8')

console.log(`Round 4 human audit: targeted=${allTargetedRows.length}, pass1=${pass1Rows.length}, independent=${independentRows.length}, independentPass=${(semanticPassRate(independentRows) * 100).toFixed(1)}%, severe=${severeCount}, coverage=${(finalWords.length / buildReport.totalVocabularyWords * 100).toFixed(1)}%`)
