import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

interface WordExample { en: string; zh?: string }
interface WordRecord { id: string; word: string; meaningZh: string[]; phonetic?: string; pos?: string[]; definitionEn?: string[]; examples?: WordExample[] }
interface ExampleManifest { source: string; sourceUrl: string; sourceFile: string; license: string; licenseUrl: string; attribution: string; translationPolicy?: string }
interface ExampleProvenance { sentenceId: number; source: string; qualityScore: number; tokenCount: number; characterCount: number; targetIndex: number; rareTokenCount?: number; unknownLikeTokenCount?: number; properNounCount?: number; commaCount?: number; quoteCount?: number }
interface ExampleBuildReport { selectedCount: number; totalVocabularyWords: number; rawCandidateCoveragePercent: number; qualityApprovedCoverage: number; qualityApprovedCoveragePercent: number; rejectionCounts: Record<string, number>; qualityPolicy: { tokenRange: [number, number]; extendedTokenRange: [number, number]; minimumQualityScore: number }; deterministic: boolean }
interface AuditReport { audit: { sampleSize: number; sampleQualityPassRate: number; severeInappropriateSampleCount: number; provenanceCoverage: number } }

const root = resolve(import.meta.dirname, '..')
const vocabPath = resolve(root, 'public/data/cet6-vocab.v1.json')
const manifestPath = resolve(root, 'data-source/examples/manifest.json')
const selectedPath = resolve(root, 'data-source/examples/selected-examples.json')
const provenancePath = resolve(root, 'data-source/examples/example-provenance.json')
const buildReportPath = resolve(root, 'data-source/examples/build-report.json')
const auditReportPath = resolve(root, 'audit/v1.3-context-quality/context-quality-build-report.json')
const auditSamplePath = resolve(root, 'audit/v1.3-context-quality/context-quality-sample.json')
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
const auditReport = JSON.parse(await readFile(auditReportPath, 'utf8')) as AuditReport
const auditSample = JSON.parse(await readFile(auditSamplePath, 'utf8')) as { seed: number; sampleSize: number; records: unknown[] }
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
if (exampleCoverage / words.length < 0.6) problems.push(`example coverage below 60%: ${exampleCoverage}/${words.length}`)
if (buildReport.selectedCount !== exampleCoverage) problems.push(`build report selectedCount drift: ${buildReport.selectedCount} vs ${exampleCoverage}`)
if (buildReport.totalVocabularyWords !== words.length) problems.push('build report vocabulary count drift')
if (buildReport.qualityApprovedCoverage < 0.6) problems.push(`quality-approved coverage below 60%: ${buildReport.qualityApprovedCoveragePercent}%`)
if (!buildReport.deterministic) problems.push('build report does not certify deterministic selection')
for (const reason of ['length', 'structure', 'properNoun', 'rareContext', 'sensitiveTopic', 'contextDependence', 'selectedCount']) {
  if (reason !== 'selectedCount' && !(reason in buildReport.rejectionCounts)) problems.push(`build report missing rejection reason: ${reason}`)
}
if (provenanceCoverage !== exampleCoverage) problems.push(`provenance coverage below 100%: ${provenanceCoverage}/${exampleCoverage}`)
if (auditSample.sampleSize < 200 || auditSample.records.length !== auditSample.sampleSize) problems.push(`audit sample below 200: ${auditSample.sampleSize}`)
if (auditReport.audit.sampleQualityPassRate < 90) problems.push(`sample quality pass rate below 90%: ${auditReport.audit.sampleQualityPassRate}%`)
if (auditReport.audit.severeInappropriateSampleCount !== 0) problems.push(`severe inappropriate sample count is not zero: ${auditReport.audit.severeInappropriateSampleCount}`)
if (auditReport.audit.provenanceCoverage !== 1) problems.push(`audit provenance coverage is not 100%: ${auditReport.audit.provenanceCoverage}`)
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
console.log(`sampleQualityPassRate = ${auditReport.audit.sampleQualityPassRate}% (${auditSample.sampleSize} sampled)`)
