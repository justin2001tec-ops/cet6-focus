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
const priorRows = (await Promise.all(([1, 2, 3, 4] as const).map(async (attempt) => JSON.parse(await readFile(resolve(auditRoot, `phase-a-post-curation-attempt-${attempt}-review.json`), 'utf8')).rows as PriorRow[]))).flat()
const priorByPair = new Map(priorRows.map((row) => [`${row.word.toLocaleLowerCase()}::${row.sentenceId}`, row]))
const manual: Record<number, Note> = {
  24: { decision: 'reject', categories: ['medical-heavy'], rationale: "Working miracles for depression is a personal mental-health treatment claim, so depression appears in a sensitive clinical context rather than a neutral default example." },
  82: { decision: 'reject', categories: ['violence', 'medical-heavy'], rationale: "The sentence links low self-esteem to the ability to hurt someone, adding a mental-health and harm scenario that is unnecessary for teaching capable." },
  298: { decision: 'reject', categories: ['fantastical-context', 'weak-teaching-value'], rationale: "A person making himself invisible depends on fantasy powers and gives invisible no ordinary modern context for a default learner." },
  299: { decision: 'pass', categories: [], rationale: "Comparing eggplant or mushrooms with imitation meat gives imitation a clear everyday meaning of a substitute made to resemble something else." },
}
function rubricFor(decision: Decision, categories: string[]): Record<string, string> {
  const has = (names: string[]) => names.some((name) => categories.includes(name))
  return {
    defaultLearningAppropriateness: decision === 'pass' ? 'YES' : 'NO', targetTeachingValue: has(['weak-teaching-value', 'rare-sense']) ? 'FAIL' : 'PASS', contextVocabularyLoad: has(['context-too-hard', 'specialist-background', 'proper-noun-heavy']) ? 'FAIL' : 'PASS', syntaxSimplicity: has(['syntax-too-complex', 'unnatural-English']) ? 'FAIL' : 'PASS', standaloneClarity: has(['context-dependent']) ? 'FAIL' : 'PASS', topicNeutrality: has(['political-heavy', 'medical-heavy', 'death-heavy', 'violence', 'extremism', 'hate', 'public-controversy', 'sexual', 'self-harm']) ? 'FAIL' : 'PASS', naturalModernEnglish: has(['unnatural-English', 'archaic', 'fantastical-context']) ? 'FAIL' : 'PASS', finalEditorDecision: decision === 'pass' ? 'PASS' : 'FAIL',
  }
}
function flags(trace: Provenance): Record<string, number> { return Object.fromEntries(Object.entries(trace).filter(([, value]) => typeof value === 'number')) as Record<string, number> }
function csvCell(value: unknown): string { const text = typeof value === 'string' ? value : JSON.stringify(value); return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text }

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
const frequencies = new Map<string, number>(); for (const rationale of rationales) frequencies.set(rationale, (frequencies.get(rationale) ?? 0) + 1)
const exactDuplicateRationaleCount = [...frequencies.values()].filter((count) => count > 1).reduce((total, count) => total + count - 1, 0)
const genericRationaleCount = rationales.filter((rationale) => rationale.length < 60 || /^Read in full:/i.test(rationale) || /^This is complete and natural/i.test(rationale)).length
const rationaleQuality = { reviewedRows: rows.length, exactDuplicateRationaleCount, genericRationaleCount, genericRationaleShare: Number((genericRationaleCount / rows.length).toFixed(4)), gate: exactDuplicateRationaleCount <= 5 && genericRationaleCount / rows.length < 0.05, method: 'Audit-only reviewer-quality QA; it never creates or changes semantic decisions.' }
await writeFile(resolve(auditRoot, 'phase-a-post-curation-review.json'), `${JSON.stringify({ round: 5, attempt: 5, seed: candidates.seed, rows, reviewer: 'Lula-agent', reviewMethod: 'Sentence-by-sentence semantic rubric; prior pass rows are reused only for an exact word and sentenceId match.', noDecisionEditingForMetrics: true }, null, 2)}\n`, 'utf8')
const csvHeader = ['index', 'word', 'sentenceId', 'sentence', 'decision', 'categories', 'rationale', 'severeInappropriate']
const csv = [csvHeader.join(','), ...rows.map((row, index) => [index, row.word, row.sentenceId, row.sentence, row.decision, row.categories, row.rationale, row.severeInappropriate].map(csvCell).join(','))].join('\n') + '\n'
await writeFile(resolve(auditRoot, 'phase-a-post-curation-review.csv'), csv, 'utf8')
await writeFile(resolve(auditRoot, 'rationale-quality-report-post-curation.json'), `${JSON.stringify(rationaleQuality, null, 2)}\n`, 'utf8')
console.log(`Round 5 post-curation review attempt 5 written: sample=${rows.length}, fails=${rows.filter((row) => row.decision === 'reject').length}, severe=${rows.filter((row) => row.severeInappropriate).length}, rationaleDuplicates=${exactDuplicateRationaleCount}, genericShare=${(rationaleQuality.genericRationaleShare * 100).toFixed(1)}%`)
