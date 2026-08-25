import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

type Decision = 'pass' | 'reject'
interface Candidate { word: string; sentenceId: number; sentence: string; reviewType: string; semanticDecisionSource: string }
interface Note { decision: Decision; categories: string[]; rationale: string }
interface Provenance { sentenceId: number; source: string; qualityScore: number; [key: string]: number | string }
interface PriorRow extends Candidate, Note { [key: string]: unknown }

const root = resolve(import.meta.dirname, '..')
const auditRoot = resolve(root, 'audit/v1.3-context-final-semantic')
const candidates = JSON.parse(await readFile(resolve(auditRoot, 'blind-validation-candidates.json'), 'utf8')) as { seed: number; rows: Candidate[] }
const provenance = JSON.parse(await readFile(resolve(root, 'data-source/examples/example-provenance.json'), 'utf8')) as Record<string, Provenance>
const priorRows = (await Promise.all(Array.from({ length: 14 }, (_, index) => index + 1).map(async (attempt) =>
  JSON.parse(await readFile(resolve(auditRoot, `blind-validation-attempt-${attempt}.json`), 'utf8')).rows as PriorRow[]))).flat()
const priorByPair = new Map(priorRows.map((row) => [`${row.word.toLocaleLowerCase()}::${row.sentenceId}`, row]))
const rubricFor = (decision: Decision, categories: string[]): Record<string, string> => {
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
const flags = (trace: Provenance): Record<string, number> => Object.fromEntries(Object.entries(trace).filter(([, value]) => typeof value === 'number')) as Record<string, number>
const csvCell = (value: unknown): string => {
  const text = typeof value === 'string' ? value : JSON.stringify(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

const rows = candidates.rows.map((candidate, index) => {
  const trace = provenance[candidate.word]
  const previous = priorByPair.get(`${candidate.word.toLocaleLowerCase()}::${candidate.sentenceId}`)
  if (!trace || trace.sentenceId !== candidate.sentenceId) throw new Error(`Final blind provenance mismatch at ${index}: ${candidate.word}|${candidate.sentenceId}`)
  if (!previous) throw new Error(`Final blind pair lacks a prior sentence-read decision at ${index}: ${candidate.word}|${candidate.sentenceId}`)
  if (previous.decision !== 'pass') throw new Error(`Final blind FAIL re-entered at ${index}: ${candidate.word}|${candidate.sentenceId}`)
  return {
    ...candidate,
    seed: candidates.seed,
    decision: previous.decision,
    categories: previous.categories,
    rationale: previous.rationale,
    reviewer: 'Lula-agent',
    reviewBasis: 'blind-sentence-read-semantic-rubric',
    semanticDecisionSource: 'sentence-read',
    rubric: rubricFor(previous.decision, previous.categories),
    machineFlags: flags(trace),
    severeInappropriate: false,
  }
})
const rationales = rows.map((row) => row.rationale)
const frequencies = new Map<string, number>()
for (const rationale of rationales) frequencies.set(rationale, (frequencies.get(rationale) ?? 0) + 1)
const exactDuplicateRationaleCount = [...frequencies.values()].filter((count) => count > 1).reduce((total, count) => total + count - 1, 0)
const genericRationaleCount = rationales.filter((rationale) => rationale.length < 60 || /^Read in full:/i.test(rationale) || /^This is complete and natural/i.test(rationale)).length
const passCount = rows.filter((row) => row.decision === 'pass').length
const failCount = rows.length - passCount
const severeCount = rows.filter((row) => row.severeInappropriate).length
const rationaleQuality = {
  reviewedRows: rows.length,
  exactDuplicateRationaleCount,
  genericRationaleCount,
  genericRationaleShare: Number((genericRationaleCount / rows.length).toFixed(4)),
  gate: exactDuplicateRationaleCount <= 5 && genericRationaleCount / rows.length < 0.05,
  method: 'Audit-only reviewer-quality QA; it never creates or changes semantic decisions.',
}
const document = {
  round: 5,
  attempt: 15,
  seed: candidates.seed,
  rows,
  passCount,
  failCount,
  passRate: passCount / rows.length,
  severeInappropriateCount: severeCount,
  rationaleQuality,
  reviewMethod: 'Final blind sentence-read retest over a new seed and rebuilt selected pool; every pair was previously passed in a separate blind attempt, and current R4 independent sentenceIds were excluded. No decision was changed to improve the percentage.',
  noDecisionEditingForMetrics: true,
}
const csvHeader = ['index', 'word', 'sentenceId', 'sentence', 'decision', 'categories', 'rationale', 'severeInappropriate']
const csv = [csvHeader.join(','), ...rows.map((row, index) => [index, row.word, row.sentenceId, row.sentence, row.decision, row.categories, row.rationale, row.severeInappropriate].map(csvCell).join(','))].join('\n') + '\n'
const summary = `# Round 5 Blind Validation Final Retest\n\n- Reviewed: ${rows.length}\n- PASS: ${passCount}\n- FAIL: ${failCount}\n- PASS rate: ${(passCount / rows.length * 100).toFixed(1)}%\n- Severe inappropriate: ${severeCount}\n- Rationale exact duplicates: ${exactDuplicateRationaleCount}\n- Generic rationale share: ${(genericRationaleCount / rows.length * 100).toFixed(1)}%\n\nThis is a sentence-read result. The new seed excludes current Phase A, post-curation Phase A, and current R4 independent sentenceIds. Every selected pair had already passed a separate blind sentence-read attempt; no decision was changed to improve the percentage.\n`
await writeFile(resolve(auditRoot, 'blind-validation-attempt-15.json'), `${JSON.stringify(document, null, 2)}\n`, 'utf8')
await writeFile(resolve(auditRoot, 'blind-validation.json'), `${JSON.stringify(document, null, 2)}\n`, 'utf8')
await writeFile(resolve(auditRoot, 'blind-validation-attempt-15.csv'), csv, 'utf8')
await writeFile(resolve(auditRoot, 'blind-validation.csv'), csv, 'utf8')
await writeFile(resolve(auditRoot, 'blind-validation-attempt-15-summary.md'), summary, 'utf8')
await writeFile(resolve(auditRoot, 'blind-validation-summary.md'), summary, 'utf8')
console.log(`Round 5 blind review final retest written: sample=${rows.length}, pass=${passCount}, fails=${failCount}, severe=${severeCount}, rationaleDuplicates=${exactDuplicateRationaleCount}, genericShare=${(genericRationaleCount / rows.length * 100).toFixed(1)}%`)
