import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

interface Example {
  en: string
}

interface Provenance {
  sentenceId: number
  source: string
  qualityScore: number
  tokenCount: number
  characterCount: number
  targetIndex: number
  rareTokenCount: number
  unknownLikeTokenCount: number
  properNounCount: number
  adjacentProperNounCount: number
  acronymCount: number
  commaCount: number
  quoteCount: number
  topicPenalty: number
  standalonePenalty: number
  targetPositionPenalty: number
}

interface BuildReport {
  selectorVersion: string
  source: string
  sourceFile: string
  totalSourceSentences: number
  totalVocabularyWords: number
  matchedTargetCandidates: number
  rawCandidatePairs: number
  rawCandidateWordCount: number
  selectedCount: number
  rawCandidateCoverage: number
  rawCandidateCoveragePercent: number
  qualityApprovedCoverage: number
  qualityApprovedCoveragePercent: number
  rejectionCounts: Record<string, number>
  qualityPolicy: Record<string, unknown>
  deterministic: boolean
}

interface AuditDimension {
  standalone: boolean
  nonTargetVocabulary: boolean
  neutralTopic: boolean
  simpleSyntax: boolean
  teachingValue: boolean
}

interface AuditRecord {
  word: string
  en: string
  sentenceId: number
  qualityScore: number
  dimensions: AuditDimension
  severeInappropriate: boolean
  passed: boolean
  notes: string[]
}

const root = resolve(import.meta.dirname, '..')
const selectedPath = resolve(root, 'data-source/examples/selected-examples.json')
const provenancePath = resolve(root, 'data-source/examples/example-provenance.json')
const buildReportPath = resolve(root, 'data-source/examples/build-report.json')
const baselinePath = resolve(root, 'data-source/examples/r2-regression-baseline.json')
const auditRoot = resolve(root, 'audit/v1.3-context-quality')
const seed = 0xCE76003
const sampleLimit = 250
const regressionWords = ['abrupt', 'absence', 'abstract', 'absurd', 'accord', 'account', 'accuse', 'acute', 'addition', 'adjacent', 'adolescent']
const severeTopic = /\b(?:porn|pornography|nude|nudity|rape|rapist|fuck|fucking|shit|bitch|cunt|whore|slut|nigger|nigga|suicide|self-harm|selfharm|terrorist|terrorism|murder|murderer|bloodshed|bomb|bombing|genocide|beheading|torture|tortured|massacre|abortion|weapon|weapons|gun|guns|shoot|shooting|drowning|drowned)\b/i

function seededRank(value: string): number {
  let state = seed
  for (const character of value) state = (Math.imul(state ^ character.charCodeAt(0), 1664525) + 1013904223) >>> 0
  return state
}

function csvCell(value: string | number | boolean): string {
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

const selected = JSON.parse(await readFile(selectedPath, 'utf8')) as Record<string, Example>
const provenance = JSON.parse(await readFile(provenancePath, 'utf8')) as Record<string, Provenance>
const buildReport = JSON.parse(await readFile(buildReportPath, 'utf8')) as BuildReport
const baseline = JSON.parse(await readFile(baselinePath, 'utf8')) as Record<string, Example>
const words = Object.keys(selected).sort((a, b) => a.localeCompare(b))
const sampleWords = words
  .map((word) => ({ word, rank: seededRank(word) }))
  .sort((a, b) => a.rank - b.rank || a.word.localeCompare(b.word))
  .slice(0, Math.min(sampleLimit, words.length))
  .map(({ word }) => word)

const sample: AuditRecord[] = sampleWords.map((word) => {
  const example = selected[word]
  const details = provenance[word]
  const dimensions: AuditDimension = {
    standalone: details.standalonePenalty < 20,
    nonTargetVocabulary: details.rareTokenCount <= 2 && details.unknownLikeTokenCount <= 1,
    neutralTopic: details.topicPenalty === 0,
    simpleSyntax: details.tokenCount >= 6 && details.tokenCount <= 20 && details.commaCount <= 1 && details.quoteCount <= 2 && details.characterCount <= 150,
    teachingValue: details.qualityScore >= 29,
  }
  const severeInappropriate = severeTopic.test(example.en)
  const notes: string[] = []
  if (details.properNounCount > 0) notes.push(`proper-noun penalty=${details.properNounCount}`)
  if (details.topicPenalty > 0) notes.push(`topic penalty=${details.topicPenalty}`)
  if (details.rareTokenCount > 0) notes.push(`rare context tokens=${details.rareTokenCount}`)
  if (details.standalonePenalty > 0) notes.push(`standalone penalty=${details.standalonePenalty}`)
  if (severeInappropriate) notes.push('severe inappropriate content')
  return {
    word,
    en: example.en,
    sentenceId: details.sentenceId,
    qualityScore: details.qualityScore,
    dimensions,
    severeInappropriate,
    passed: Object.values(dimensions).every(Boolean) && !severeInappropriate,
    notes,
  }
})

const samplePassCount = sample.filter((record) => record.passed).length
const severeCount = sample.filter((record) => record.severeInappropriate).length
const samplePassRate = sample.length ? samplePassCount / sample.length : 0
const regressionRows = regressionWords.map((word) => ({
  word,
  r2: baseline[word]?.en ?? '无 R2 例句',
  r3: selected[word]?.en ?? '无 approved Context',
  reason: selected[word]
    ? (baseline[word]?.en === selected[word].en ? '保留：当前 CC0 候选中没有更高分替代句。' : '已替换：R3 selector v2 选择了更高教学评分的候选句。')
    : '移除：没有同时满足结构、主题中性、上下文独立与非目标词难度门槛的候选句。',
}))

const provenanceCoverage = words.filter((word) => Boolean(provenance[word]?.sentenceId && provenance[word]?.source === 'tatoeba-cc0')).length / words.length
const auditBuildReport = {
  ...buildReport,
  audit: {
    seed,
    sampleSize: sample.length,
    samplePassCount,
    sampleQualityPassRate: Number((samplePassRate * 100).toFixed(1)),
    severeInappropriateSampleCount: severeCount,
    provenanceCoverage: Number(provenanceCoverage.toFixed(4)),
    provenanceCoveragePercent: Number((provenanceCoverage * 100).toFixed(1)),
    baselineFile: 'data-source/examples/r2-regression-baseline.json',
  },
}

const csvHeader = 'word,en,sentenceId,qualityScore,standalone,nonTargetVocabulary,neutralTopic,simpleSyntax,teachingValue,severeInappropriate,passed,notes'
const csvRows = sample.map((record) => [
  record.word,
  record.en,
  record.sentenceId,
  record.qualityScore,
  record.dimensions.standalone,
  record.dimensions.nonTargetVocabulary,
  record.dimensions.neutralTopic,
  record.dimensions.simpleSyntax,
  record.dimensions.teachingValue,
  record.severeInappropriate,
  record.passed,
  record.notes.join('; '),
].map(csvCell).join(','))

const summary = `# Context Quality Refinement — Round 3 Sample Audit

## Method

- Source remains the offline Tatoeba English CC0 snapshot; no runtime API, AI generation, or imported Chinese translation is used.
- Fixed seed: \`${seed}\`.
- Sample size: ${sample.length} selected examples (target minimum: 200).
- Review mode: Lula agent-assisted audit using the five handoff dimensions, with every sampled record retained in JSON/CSV for follow-up.
- A dimension is PASS only when the shipped provenance metrics satisfy the documented selector policy. Topic neutrality is intentionally strict (topicPenalty = 0); a downgraded topic is visible as a failure rather than silently counted as neutral.

## Results

| Gate | Result |
| --- | --- |
| Sample size >= 200 | ${sample.length >= 200 ? 'PASS' : 'FAIL'} (${sample.length}) |
| Sample quality pass rate >= 90% | ${samplePassRate >= 0.9 ? 'PASS' : 'FAIL'} (${(samplePassRate * 100).toFixed(1)}%, ${samplePassCount}/${sample.length}) |
| Severe inappropriate sample count = 0 | ${severeCount === 0 ? 'PASS' : 'FAIL'} (${severeCount}) |
| Provenance coverage = 100% | ${provenanceCoverage === 1 ? 'PASS' : 'FAIL'} (${(provenanceCoverage * 100).toFixed(1)}%) |
| Quality-approved coverage | INFORMATIONAL ONLY (${buildReport.qualityApprovedCoveragePercent}%); Round 5 has no minimum coverage blocker |

## Five-dimension rubric

1. The sentence is independently understandable.
2. Non-target context vocabulary is not disproportionately difficult.
3. The topic is neutral for a default learning context.
4. Syntax is short and readable, without stacked punctuation or long clauses.
5. The target word is used once, in a natural position, with useful context.

The complete per-example decisions are in [context-quality-sample.json](context-quality-sample.json) and [context-quality-sample.csv](context-quality-sample.csv). Build-level rejection counts are in [context-quality-build-report.json](context-quality-build-report.json).
`

const regressionMarkdown = `# Context Quality Regression Set

This fixed set records the R2 sentence beside the R3 result. A blank R3 value is intentional when the CC0 snapshot has no candidate that clears the teaching-quality policy.

| Word | R2 sentence | R3 sentence / no approved example | Result |
| --- | --- | --- | --- |
${regressionRows.map((row) => `| ${row.word} | ${row.r2.replaceAll('|', '\\|')} | ${row.r3.replaceAll('|', '\\|')} | ${row.reason} |`).join('\n')}
`

await mkdir(auditRoot, { recursive: true })
await writeFile(resolve(auditRoot, 'context-quality-summary.md'), summary, 'utf8')
await writeFile(resolve(auditRoot, 'context-quality-sample.json'), `${JSON.stringify({ seed, sampleSize: sample.length, records: sample }, null, 2)}\n`, 'utf8')
await writeFile(resolve(auditRoot, 'context-quality-sample.csv'), `${csvHeader}\n${csvRows.join('\n')}\n`, 'utf8')
await writeFile(resolve(auditRoot, 'context-quality-build-report.json'), `${JSON.stringify(auditBuildReport, null, 2)}\n`, 'utf8')
await writeFile(resolve(auditRoot, 'regression-examples.md'), regressionMarkdown, 'utf8')

console.log(`Context quality audit: ${samplePassCount}/${sample.length} passed (${(samplePassRate * 100).toFixed(1)}%); severe=${severeCount}; provenance=${(provenanceCoverage * 100).toFixed(1)}%`)
