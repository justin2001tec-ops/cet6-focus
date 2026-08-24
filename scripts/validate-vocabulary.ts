import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

interface WordExample { en: string; zh?: string }
interface WordRecord { id: string; word: string; meaningZh: string[]; phonetic?: string; pos?: string[]; definitionEn?: string[]; examples?: WordExample[] }
interface ExampleManifest { source: string; sourceUrl: string; sourceFile: string; license: string; licenseUrl: string; attribution: string; translationPolicy?: string }
interface ExampleProvenance { sentenceId: number; source: string; qualityScore: number; tokenCount: number; characterCount: number; targetIndex: number; rareTokenCount?: number; unknownLikeTokenCount?: number; properNounCount?: number; commaCount?: number; quoteCount?: number }
interface ExampleBuildReport { selectedCount: number; totalVocabularyWords: number; rawCandidateCoveragePercent: number; qualityApprovedCoverage: number; qualityApprovedCoveragePercent: number; rejectionCounts: Record<string, number>; qualityPolicy: { tokenRange: [number, number]; extendedTokenRange: [number, number]; minimumQualityScore: number }; deterministic: boolean }
interface HumanReviewRow { word: string; sentenceId: number; sentence: string; decision: 'pass' | 'reject'; categories: string[]; rationale: string; reviewBasis: string; severeInappropriate: boolean }
interface HumanReviewDocument { seed?: number; sampleSize?: number; reviewedCount?: number; rows: HumanReviewRow[] }
interface HumanQualityReport {
  machineMetricsAreNotSemanticDecisions: boolean
  targetedReview: { reviewedCount: number; passCount: number; rejectCount: number; reviewedPercent: number; r3BaselineCount: number }
  randomSemanticPass1: { seed: number; sampleSize: number; passCount: number; passRatePercent: number }
  independentValidation: { seed: number; sampleSize: number; passCount: number; passRatePercent: number; severeInappropriateCount: number; overlapsPass1: number }
  finalCoverage: { selectedCount: number; vocabularyCount: number; percent: number; targetPercent: number }
  provenanceCoverage: number
  curation: { version: number; globalRejectCount: number; pairRejectCount: number }
  gates: { riskTargetedReview100Percent: boolean; pass1AtLeast300: boolean; independentAtLeast200: boolean; independentSemanticPassAtLeast98: boolean; severeInappropriateZero: boolean; provenance100: boolean; deterministicBuild: boolean; nonOverlappingIndependentSample: boolean; qualityCoverageExceptionOrTarget: boolean }
}
interface CurationReject { word?: string; sentenceId: number; categories: string[]; reason: string }
interface CurationFile { version: number; globalReject: CurationReject[]; pairReject: CurationReject[] }

const root = resolve(import.meta.dirname, '..')
const vocabPath = resolve(root, 'public/data/cet6-vocab.v1.json')
const manifestPath = resolve(root, 'data-source/examples/manifest.json')
const selectedPath = resolve(root, 'data-source/examples/selected-examples.json')
const provenancePath = resolve(root, 'data-source/examples/example-provenance.json')
const buildReportPath = resolve(root, 'data-source/examples/build-report.json')
const humanQualityReportPath = resolve(root, 'audit/v1.3-context-human-quality/final-context-quality-report.json')
const humanRiskTargetedPath = resolve(root, 'audit/v1.3-context-human-quality/risk-targeted-review.json')
const humanPass1Path = resolve(root, 'audit/v1.3-context-human-quality/random-semantic-review-pass1.json')
const humanIndependentPath = resolve(root, 'audit/v1.3-context-human-quality/independent-validation.json')
const curationPath = resolve(root, 'data-source/examples/context-curation.json')
const runtimeDbPath = resolve(root, 'src/db/db.ts')
const tokenPattern = /[A-Za-z]+(?:['-][a-z]+)*/gi
const regressionQualityBlacklist = new Map<string, RegExp>([
  ['abrupt', /free markets|limited government|horrifying/i],
  ['abstract', /pollock|krasner|abstract expressionism/i],
  ['absurd', /conspirac|rights groups|amnesty/i],
  ['accuse', /government|immigrant|murderous|mafia|dissent|politically/i],
  ['acute', /hemorrhoid|ointment|lard/i],
  ['addition', /flag|mengele|disease|dataset|oscar|galileo/i],
  ['adolescent', /hiv|aids/i],
])

function normalizeSentence(value: string): string {
  return value.replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/[—–]/g, '-').replace(/\s+/g, ' ').trim()
}

function tokensFor(sentence: string): string[] {
  return [...normalizeSentence(sentence).matchAll(tokenPattern)].map((match) => match[0].toLocaleLowerCase())
}

const words = JSON.parse(await readFile(vocabPath, 'utf8')) as WordRecord[]
const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as ExampleManifest
const selected = JSON.parse(await readFile(selectedPath, 'utf8')) as Record<string, WordExample>
const provenance = JSON.parse(await readFile(provenancePath, 'utf8')) as Record<string, ExampleProvenance>
const buildReport = JSON.parse(await readFile(buildReportPath, 'utf8')) as ExampleBuildReport
const humanQualityReport = JSON.parse(await readFile(humanQualityReportPath, 'utf8')) as HumanQualityReport
const humanRiskTargeted = JSON.parse(await readFile(humanRiskTargetedPath, 'utf8')) as HumanReviewDocument
const humanPass1 = JSON.parse(await readFile(humanPass1Path, 'utf8')) as HumanReviewDocument
const humanIndependent = JSON.parse(await readFile(humanIndependentPath, 'utf8')) as HumanReviewDocument
const curation = JSON.parse(await readFile(curationPath, 'utf8')) as CurationFile
const runtimeDb = await readFile(runtimeDbPath, 'utf8')
const ids = new Set<string>()
const spellings = new Set<string>()
const problems: string[] = []
let missingMeaning = 0
let missingPhonetic = 0
let missingPos = 0
let missingDefinition = 0
let exampleCoverage = 0
let provenanceCoverage = 0

for (const word of words) {
  if (!word.id || ids.has(word.id)) problems.push(`duplicate/empty id: ${word.id}`)
  if (!word.word || spellings.has(word.word)) problems.push(`duplicate/empty word: ${word.word}`)
  const hasMeaning = Boolean(word.meaningZh?.length) && word.meaningZh.every((meaning) => meaning.trim()) && !word.meaningZh.some((meaning) => meaning.includes('暂无中文释义'))
  if (!hasMeaning) {
    missingMeaning += 1
    problems.push(`empty meaning: ${word.word}`)
  }
  if (!word.phonetic?.trim()) missingPhonetic += 1
  if (!word.pos?.length) missingPos += 1
  if (!word.definitionEn?.length) missingDefinition += 1
  if (word.examples?.length) {
    exampleCoverage += 1
    if (word.examples.length !== 1) problems.push(`expected one selected example: ${word.word}`)
    const example = word.examples[0]
    const sourceExample = selected[word.word]
    const trace = provenance[word.word]
    const normalized = normalizeSentence(example.en)
    const exampleTokens = tokensFor(example.en)
    if (!example.en?.trim()) problems.push(`empty example: ${word.word}`)
    if (/test fixture|不背单词/i.test(example.en)) problems.push(`fixture-like example: ${word.word}`)
    if (example.zh?.trim()) problems.push(`unlicensed example translation: ${word.word}`)
    if (!sourceExample || sourceExample.en !== example.en) problems.push(`selected example drift: ${word.word}`)
    if (!trace || trace.source !== 'tatoeba-cc0' || !Number.isFinite(trace.sentenceId) || trace.sentenceId <= 0) problems.push(`missing example provenance: ${word.word}`)
    else provenanceCoverage += 1
    if (exampleTokens.filter((token) => token === word.word.toLocaleLowerCase()).length !== 1) problems.push(`target must occur exactly once: ${word.word}`)
    if (exampleTokens.length < buildReport.qualityPolicy.tokenRange[0] || exampleTokens.length > buildReport.qualityPolicy.extendedTokenRange[1]) problems.push(`example token count out of bounds: ${word.word}`)
    if (exampleTokens.length > buildReport.qualityPolicy.tokenRange[1] && (normalized.length > 120 || (trace?.properNounCount ?? 0) > 0 || (trace?.rareTokenCount ?? 0) > 1 || (trace?.unknownLikeTokenCount ?? 0) > 1 || (trace?.commaCount ?? 0) > 1 || (trace?.quoteCount ?? 0) > 2)) problems.push(`extended example is not clear enough: ${word.word}`)
    if (normalized.length < 18 || normalized.length > 150) problems.push(`example character length out of bounds: ${word.word}`)
    if (/[\d<>]|https?:\/\/|www\.|@/.test(normalized) || /[^\x20-\x7E]/.test(normalized)) problems.push(`example contains URL, markup, digit, or non-ASCII text: ${word.word}`)
    if (/[;:()[\]{}\/]|--/.test(normalized) || (normalized.match(/,/g) ?? []).length > 1 || (normalized.match(/"/g) ?? []).length > 2) problems.push(`example structure gate failed: ${word.word}`)
    if (regressionQualityBlacklist.get(word.word.toLocaleLowerCase())?.test(normalized)) problems.push(`known regression example remains: ${word.word}`)
    if (trace && trace.qualityScore < buildReport.qualityPolicy.minimumQualityScore) problems.push(`quality score below selector floor: ${word.word}`)
  }
  if (word.meaningZh?.some((meaning) => /\\[nr]/.test(meaning)) || word.definitionEn?.some((definition) => /\\[nr]/.test(definition))) problems.push(`escaped line break: ${word.word}`)
  if (word.phonetic?.includes('<')) problems.push(`suspicious phonetic: ${word.word}`)
  ids.add(word.id)
  spellings.add(word.word)
}

for (const word of Object.keys(selected)) {
  if (!words.some((record) => record.word === word)) problems.push(`selected example word is outside vocabulary: ${word}`)
  if (!provenance[word]) problems.push(`selected example has no provenance: ${word}`)
}

if (words.length < 2000) problems.push(`word count below expected CET6 range: ${words.length}`)
if (words.length !== 2219) problems.push(`word count must remain 2219: ${words.length}`)
if (!manifest.source || !manifest.sourceUrl || !manifest.sourceFile || !manifest.license || !manifest.licenseUrl || !manifest.attribution) problems.push('example source manifest is incomplete')
if (!manifest.source.includes('Tatoeba') || !manifest.license.includes('CC0')) problems.push('example source must remain Tatoeba CC0')
if (!manifest.translationPolicy?.includes('English only')) problems.push('example translation policy is incomplete')

const coverage = exampleCoverage / words.length
if (coverage < 0.5) problems.push(`example coverage below the Round 4 minimum exception floor: ${exampleCoverage}/${words.length}`)
if (coverage < 0.55) console.warn(`QUALITY PASS / COVERAGE BELOW TARGET: ${(coverage * 100).toFixed(1)}% (target 55%)`)
if (buildReport.selectedCount !== exampleCoverage) problems.push(`build report selectedCount drift: ${buildReport.selectedCount} vs ${exampleCoverage}`)
if (buildReport.totalVocabularyWords !== words.length) problems.push('build report vocabulary count drift')
if (Math.abs(buildReport.qualityApprovedCoverage - coverage) > 0.000001) problems.push('build report qualityApprovedCoverage drift')
if (buildReport.qualityApprovedCoverage < 0.5) problems.push(`build report quality coverage below the Round 4 exception floor: ${buildReport.qualityApprovedCoveragePercent}%`)
if (!buildReport.deterministic) problems.push('build report does not certify deterministic selection')
for (const reason of ['length', 'structure', 'properNoun', 'rareContext', 'sensitiveTopic', 'contextDependence', 'selectedCount']) {
  if (reason !== 'selectedCount' && !(reason in buildReport.rejectionCounts)) problems.push(`build report missing rejection reason: ${reason}`)
}
if (provenanceCoverage !== exampleCoverage) problems.push(`provenance coverage below 100%: ${provenanceCoverage}/${exampleCoverage}`)

const regressionPairs: Array<[string, number]> = [
  ['stab', 13035646],
  ['appropriate', 11844548],
  ['execute', 11765250],
  ['formidable', 12807976],
  ['peak', 8908904],
  ['petition', 12045723],
  ['liable', 11129769],
]
for (const [word, sentenceId] of regressionPairs) {
  if (provenance[word]?.sentenceId === sentenceId) problems.push(`Round 4 regression sentence remains selected: ${word}|${sentenceId}`)
  const durablyRejected = curation.globalReject.some((entry) => entry.sentenceId === sentenceId) || curation.pairReject.some((entry) => entry.word === word && entry.sentenceId === sentenceId)
  if (!durablyRejected) problems.push(`Round 4 regression sentence is not durably rejected: ${word}|${sentenceId}`)
}
for (const entry of curation.globalReject) {
  if (Object.values(provenance).some((trace) => trace.sentenceId === entry.sentenceId)) problems.push(`curated globalReject sentence is selected: ${entry.sentenceId}`)
}
for (const entry of curation.pairReject) {
  if (entry.word && provenance[entry.word]?.sentenceId === entry.sentenceId) problems.push(`curated pairReject is selected: ${entry.word}|${entry.sentenceId}`)
}
if (curation.version !== 1 || !Array.isArray(curation.globalReject) || !Array.isArray(curation.pairReject)) problems.push('context curation file is incomplete')
if (humanQualityReport.machineMetricsAreNotSemanticDecisions !== true) problems.push('human audit does not explicitly decouple machine metrics from semantic decisions')
if (humanQualityReport.curation.version !== curation.version || humanQualityReport.curation.globalRejectCount !== curation.globalReject.length || humanQualityReport.curation.pairRejectCount !== curation.pairReject.length) problems.push('human audit curation counts drift')

function validateReviewRows(name: string, document: HumanReviewDocument, minimum: number): void {
  if (!Array.isArray(document.rows)) {
    problems.push(`${name} rows are missing`)
    return
  }
  if ((document.sampleSize ?? document.rows.length) < minimum) problems.push(`${name} sample below ${minimum}: ${document.sampleSize ?? document.rows.length}`)
  if (document.sampleSize !== undefined && document.rows.length !== document.sampleSize) problems.push(`${name} sampleSize does not match row count`)
  for (const row of document.rows) {
    if (!row.word || !Number.isFinite(row.sentenceId) || !row.sentence?.trim()) problems.push(`${name} contains an incomplete review row`)
    if (row.decision !== 'pass' && row.decision !== 'reject') problems.push(`${name} contains a non-semantic decision`)
    if (!row.rationale?.trim() || row.reviewBasis !== 'sentence-read-semantic-rubric') problems.push(`${name} contains a row without sentence-read rationale`)
    if (row.decision === 'reject' && (!Array.isArray(row.categories) || row.categories.length === 0)) problems.push(`${name} reject is missing a structured category: ${row.word}|${row.sentenceId}`)
  }
}

validateReviewRows('risk-targeted review', humanRiskTargeted, 885)
validateReviewRows('random semantic pass 1', humanPass1, 300)
validateReviewRows('independent validation', humanIndependent, 200)
if (humanRiskTargeted.rows.length !== humanQualityReport.targetedReview.reviewedCount || humanQualityReport.targetedReview.reviewedPercent < 100 || humanQualityReport.targetedReview.r3BaselineCount < 885) problems.push('risk-targeted semantic review is not complete')
if (humanPass1.seed !== humanQualityReport.randomSemanticPass1.seed || humanPass1.sampleSize !== humanQualityReport.randomSemanticPass1.sampleSize) problems.push('pass 1 seed/sample report drift')
if (humanIndependent.seed !== humanQualityReport.independentValidation.seed || humanIndependent.sampleSize !== humanQualityReport.independentValidation.sampleSize) problems.push('independent seed/sample report drift')
const independentPassCount = humanIndependent.rows.filter((row) => row.decision === 'pass').length
const independentPassRate = independentPassCount / Math.max(1, humanIndependent.rows.length)
const severeIndependentCount = humanIndependent.rows.filter((row) => row.severeInappropriate).length
const pass1Keys = new Set(humanPass1.rows.map((row) => `${row.word}|${row.sentenceId}`))
const independentOverlapCount = humanIndependent.rows.filter((row) => pass1Keys.has(`${row.word}|${row.sentenceId}`)).length
if (independentPassRate < 0.98) problems.push(`independent semantic pass rate below 98%: ${(independentPassRate * 100).toFixed(1)}%`)
if (severeIndependentCount !== 0) problems.push(`independent severe inappropriate count is not zero: ${severeIndependentCount}`)
if (independentOverlapCount !== 0) problems.push(`independent validation overlaps pass 1: ${independentOverlapCount}`)
if (humanQualityReport.independentValidation.passCount !== independentPassCount || humanQualityReport.independentValidation.severeInappropriateCount !== severeIndependentCount || humanQualityReport.independentValidation.overlapsPass1 !== independentOverlapCount) problems.push('independent semantic audit report drift')
if (humanQualityReport.independentValidation.passRatePercent < 98 || humanQualityReport.provenanceCoverage !== 1) problems.push('Round 4 final semantic/provenance gate failed')
if (!Object.values(humanQualityReport.gates).every(Boolean)) problems.push('Round 4 final report contains a failed gate')
if (/tatoeba\.org|downloads\.tatoeba/i.test(runtimeDb)) problems.push('runtime database code references Tatoeba')
if (!runtimeDb.includes('data/cet6-vocab.v1.json')) problems.push('runtime vocabulary path is missing')

if (problems.length) {
  console.error(`Vocabulary report: total=${words.length}; missingMeaning=${missingMeaning}; missingPhonetic=${missingPhonetic}; missingPos=${missingPos}; missingDefinition=${missingDefinition}`)
  console.error(`exampleCoverage = ${exampleCoverage} / ${words.length}`)
  console.error(`qualityApprovedCoverage = ${buildReport.selectedCount} / ${words.length}`)
  console.error(`rawCandidateCoveragePercent = ${buildReport.rawCandidateCoveragePercent}%`)
  console.error(`exampleSource = ${manifest.source}`)
  console.error(`license = ${manifest.license}`)
  console.error(problems.join('\n'))
  process.exit(1)
}

console.log(`Vocabulary OK: ${words.length} unique CET-6 entries; missingMeaning=${missingMeaning}; missingPhonetic=${missingPhonetic}; missingPos=${missingPos}; missingDefinition=${missingDefinition}`)
console.log(`qualityApprovedCoverage = ${exampleCoverage} / ${words.length}`)
console.log(`qualityApprovedCoveragePercent = ${((exampleCoverage / words.length) * 100).toFixed(1)}%`)
console.log(`rawCandidateCoveragePercent = ${buildReport.rawCandidateCoveragePercent}%`)
console.log(`exampleSource = ${manifest.source}`)
console.log(`license = ${manifest.license}`)
console.log(`provenanceCoverage = ${provenanceCoverage} / ${exampleCoverage}`)
console.log(`Round 4 targetedReview = ${humanRiskTargeted.rows.length} records (100% retained)`)
console.log(`Round 4 pass1 = ${humanPass1.rows.length} records; independent = ${humanIndependent.rows.length} records; independentSemanticPassRate = ${(independentPassRate * 100).toFixed(1)}%`)
console.log(`Round 4 severeInappropriate = ${severeIndependentCount}; machineMetricsAreNotSemanticDecisions = ${humanQualityReport.machineMetricsAreNotSemanticDecisions}`)
