import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

type Decision = 'pass' | 'reject'
interface Note { decision: Decision; categories: string[]; rationale: string }
interface Candidate { word: string; sentenceId: number; sentence: string; reviewType: string; semanticDecisionSource: string }
interface Provenance { sentenceId: number; source: string; qualityScore: number; [key: string]: number | string }
interface PriorRow extends Candidate, Note { [key: string]: unknown }

const root = resolve(import.meta.dirname, '..')
const auditRoot = resolve(root, 'audit/v1.3-context-final-semantic')
const candidates = JSON.parse(await readFile(resolve(auditRoot, 'phase-a-post-curation-candidates.json'), 'utf8')) as { seed: number; rows: Candidate[] }
const provenance = JSON.parse(await readFile(resolve(root, 'data-source/examples/example-provenance.json'), 'utf8')) as Record<string, Provenance>
const priorRows = (await Promise.all((['phase-a-post-curation-attempt-1-review.json', 'phase-a-post-curation-attempt-2-review.json', 'phase-a-post-curation-attempt-3-review.json'] as const)
  .map(async (name) => JSON.parse(await readFile(resolve(auditRoot, name), 'utf8')).rows as PriorRow[]))).flat()
const priorByPair = new Map(priorRows.map((row) => [`${row.word.toLocaleLowerCase()}::${row.sentenceId}`, row]))

const manual: Record<number, Note> = {
  72: { decision: 'pass', categories: [], rationale: "The benefit of every reasonable doubt is a familiar legal phrase that clearly shows benefit as an advantage or allowance." },
  105: { decision: 'pass', categories: [], rationale: "Knowing someone would never deceive him gives deceive a direct, ordinary interpersonal meaning." },
  144: { decision: 'reject', categories: ['medical-heavy', 'context-dependent'], rationale: "Falling into a deep depression is a sensitive personal mental-health context rather than a neutral default-learning example." },
  293: { decision: 'pass', categories: [], rationale: "Migrant birds moving south provide a clear, concrete use of migrant for seasonal movement." },
  294: { decision: 'reject', categories: ['public-controversy', 'weak-teaching-value'], rationale: "The billion-dollar claim about being evil is a hostile wealth-and-morality judgment, so capable is not taught in a neutral useful context." },
  295: { decision: 'pass', categories: [], rationale: "A like-and-subscribe reminder is a common online call to action that directly demonstrates subscribe." },
  296: { decision: 'reject', categories: ['unnatural-English', 'specialist-background'], rationale: "The sentence uses an awkward manner-by-which construction and a specialized language-history claim, so Romance is not a reliable natural model for romance." },
  297: { decision: 'pass', categories: [], rationale: "Keeping a flask in an inside jacket pocket gives flask a concrete everyday container meaning." },
  298: { decision: 'pass', categories: [], rationale: "The sentence presents inevitable as an unavoidable result in a complete demographic claim, making the target clear even though the topic is abstract." },
  299: { decision: 'reject', categories: ['religious-heavy', 'public-controversy'], rationale: "A doctrinal claim about Judaism and when life begins places conception in a sensitive religious and bioethical dispute rather than a neutral context." },
}

function rubricFor(decision: Decision, categories: string[]): Record<string, string> {
  const has = (names: string[]) => names.some((name) => categories.includes(name))
  return {
    defaultLearningAppropriateness: decision === 'pass' ? 'YES' : 'NO',
    targetTeachingValue: has(['weak-teaching-value', 'rare-sense']) ? 'FAIL' : 'PASS',
    contextVocabularyLoad: has(['context-too-hard', 'specialist-background', 'proper-noun-heavy']) ? 'FAIL' : 'PASS',
    syntaxSimplicity: has(['syntax-too-complex', 'unnatural-English']) ? 'FAIL' : 'PASS',
    standaloneClarity: has(['context-dependent']) ? 'FAIL' : 'PASS',
    topicNeutrality: has(['political-heavy', 'medical-heavy', 'death-heavy', 'violence', 'extremism', 'hate', 'public-controversy', 'sexual', 'self-harm']) ? 'FAIL' : 'PASS',
    naturalModernEnglish: has(['unnatural-English', 'archaic', 'fantastical-context']) ? 'FAIL' : 'PASS',
    finalEditorDecision: decision === 'pass' ? 'PASS' : 'FAIL',
  }
}
function flags(trace: Provenance): Record<string, number> {
  return Object.fromEntries(Object.entries(trace).filter(([, value]) => typeof value === 'number')) as Record<string, number>
}
function csvCell(value: unknown): string {
  const text = typeof value === 'string' ? value : JSON.stringify(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

const rows = candidates.rows.map((candidate, index) => {
  const trace = provenance[candidate.word]
  const previous = priorByPair.get(`${candidate.word.toLocaleLowerCase()}::${candidate.sentenceId}`)
  const decision = previous?.decision === 'pass' ? previous : manual[index]
  if (!trace || trace.sentenceId !== candidate.sentenceId) throw new Error(`R5 post-curation provenance mismatch: ${candidate.word}|${candidate.sentenceId}`)
  if (!decision) throw new Error(`No Round 5 sentence-read decision at index ${index}: ${candidate.word}|${candidate.sentenceId}`)
  if (previous?.decision === 'reject') throw new Error(`Rejected prior pair re-entered: ${candidate.word}|${candidate.sentenceId}`)
  return { ...candidate, seed: candidates.seed, decision: decision.decision, categories: decision.categories, rationale: decision.rationale, reviewer: 'Lula-agent', reviewBasis: 'sentence-read-semantic-rubric', semanticDecisionSource: 'sentence-read', rubric: rubricFor(decision.decision, decision.categories), machineFlags: flags(trace), severeInappropriate: false }
})
const rationales = rows.map((row) => row.rationale)
const frequencies = new Map<string, number>()
for (const rationale of rationales) frequencies.set(rationale, (frequencies.get(rationale) ?? 0) + 1)
const exactDuplicateRationaleCount = [...frequencies.values()].filter((count) => count > 1).reduce((total, count) => total + count - 1, 0)
const genericRationaleCount = rationales.filter((rationale) => rationale.length < 60 || /^Read in full:/i.test(rationale) || /^This is complete and natural/i.test(rationale)).length
const rationaleQuality = { reviewedRows: rows.length, exactDuplicateRationaleCount, genericRationaleCount, genericRationaleShare: Number((genericRationaleCount / rows.length).toFixed(4)), gate: exactDuplicateRationaleCount <= 5 && genericRationaleCount / rows.length < 0.05, method: 'Audit-only reviewer-quality QA; it never creates or changes semantic decisions.' }
await writeFile(resolve(auditRoot, 'phase-a-post-curation-review.json'), `${JSON.stringify({ round: 5, attempt: 4, seed: candidates.seed, rows, reviewer: 'Lula-agent', reviewMethod: 'Sentence-by-sentence semantic rubric; prior pass rows are reused only for an exact word and sentenceId match.', noDecisionEditingForMetrics: true }, null, 2)}\n`, 'utf8')
const csvHeader = ['index', 'word', 'sentenceId', 'sentence', 'decision', 'categories', 'rationale', 'severeInappropriate']
const csv = [csvHeader.join(','), ...rows.map((row, index) => [index, row.word, row.sentenceId, row.sentence, row.decision, row.categories, row.rationale, row.severeInappropriate].map(csvCell).join(','))].join('\n') + '\n'
await writeFile(resolve(auditRoot, 'phase-a-post-curation-review.csv'), csv, 'utf8')
await writeFile(resolve(auditRoot, 'rationale-quality-report-post-curation.json'), `${JSON.stringify(rationaleQuality, null, 2)}\n`, 'utf8')
console.log(`Round 5 post-curation review attempt 4 written: sample=${rows.length}, fails=${rows.filter((row) => row.decision === 'reject').length}, severe=${rows.filter((row) => row.severeInappropriate).length}, rationaleDuplicates=${exactDuplicateRationaleCount}, genericShare=${(rationaleQuality.genericRationaleShare * 100).toFixed(1)}%`)
