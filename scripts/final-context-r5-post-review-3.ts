import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

type Decision = 'pass' | 'reject'
interface DecisionNote { decision: Decision; categories: string[]; rationale: string }
interface Candidate { word: string; sentenceId: number; sentence: string; reviewType: string; semanticDecisionSource: string }
interface Provenance { sentenceId: number; source: string; qualityScore: number; [key: string]: number | string }
interface PriorRow extends Candidate, DecisionNote { [key: string]: unknown }

const root = resolve(import.meta.dirname, '..')
const auditRoot = resolve(root, 'audit/v1.3-context-final-semantic')
const candidates = JSON.parse(await readFile(resolve(auditRoot, 'phase-a-post-curation-candidates.json'), 'utf8')) as { seed: number; rows: Candidate[] }
const provenance = JSON.parse(await readFile(resolve(root, 'data-source/examples/example-provenance.json'), 'utf8')) as Record<string, Provenance>
const priorRows = (await Promise.all((['phase-a-post-curation-attempt-1-review.json', 'phase-a-post-curation-attempt-2-review.json'] as const)
  .map(async (name) => JSON.parse(await readFile(resolve(auditRoot, name), 'utf8')).rows as PriorRow[]))).flat()
const priorByPair = new Map(priorRows.map((row) => [`${row.word.toLocaleLowerCase()}::${row.sentenceId}`, row]))

const manual: Record<number, DecisionNote> = {
  2: { decision: 'reject', categories: ['public-controversy', 'proper-noun-heavy'], rationale: "A campaign speech in a Dakar suburb makes suburb depend on political campaigning and an unfamiliar proper-noun setting rather than a neutral place example." },
  19: { decision: 'reject', categories: ['context-dependent', 'weak-teaching-value'], rationale: "The sentence calls something a long-term solution but never identifies the problem, so solution lacks a concrete standalone teaching context." },
  46: { decision: 'reject', categories: ['medical-heavy'], rationale: "The speaker's severe depression and ongoing symptoms are a sensitive personal diagnostic context that is not suitable as a default example." },
  93: { decision: 'pass', categories: [], rationale: "A global mass extinction event gives mass a clear large-scale modifier meaning in an understandable environmental sentence." },
  96: { decision: 'reject', categories: ['context-too-hard', 'weak-teaching-value'], rationale: "Putative benefit and a risk-balancing argument use abstract policy vocabulary that makes benefit less accessible than a concrete everyday example." },
  106: { decision: 'reject', categories: ['medical-heavy', 'weak-teaching-value'], rationale: "The plump-and-goiter comparison adds body and medical detail that contributes little to teaching bonus in a neutral way." },
  116: { decision: 'reject', categories: ['specialist-background', 'context-too-hard'], rationale: "Pronominal suffixes, enclitic pronouns, and accent require specialist linguistics knowledge that overwhelms merely." },
  144: { decision: 'pass', categories: [], rationale: "Conversations that push intellectual boundaries provide a natural modern use of intellectual for mental or conceptual activity." },
  154: { decision: 'pass', categories: [], rationale: "A balloon tethered to a truck by a winch cable gives cable a concrete physical-object meaning." },
  185: { decision: 'reject', categories: ['archaic', 'context-dependent'], rationale: "The literary statement about every man finding an answer and acknowledging sorrow is abstract and gendered, so acknowledge is not taught in a broadly reusable context." },
  204: { decision: 'reject', categories: ['public-controversy', 'hate'], rationale: "Contrasting Hindu and Nazi swastikas introduces religious and extremist symbolism that is unnecessary for teaching distinct." },
  222: { decision: 'pass', categories: [], rationale: "Comparing the aggressiveness of swans and geese gives vicious a clear animal-behavior meaning without graphic detail." },
  271: { decision: 'pass', categories: [], rationale: "A justice system enforcing reforms is a clear formal-law context that directly demonstrates enforce." },
  285: { decision: 'pass', categories: [], rationale: "Returning a product without a receipt is a familiar shop transaction that makes receipt concrete." },
  286: { decision: 'pass', categories: [], rationale: "Privacy protecting the essence of identity gives privacy a clear modern rights-and-personal-boundary meaning." },
  287: { decision: 'pass', categories: [], rationale: "A company investing in cybersecurity tools gives invest a direct business-spending meaning." },
  288: { decision: 'pass', categories: [], rationale: "The contrast between a recording studio with stereo and mono equipment gives stereo a clear audio meaning." },
  289: { decision: 'reject', categories: ['hate', 'public-controversy'], rationale: "The sentence makes a generalized claim about Algerians and their wives, adding ethnic and religious stereotyping unrelated to deceive." },
  290: { decision: 'pass', categories: [], rationale: "A double standard being impossible to ignore is a natural idiomatic use that clearly demonstrates ignore." },
  291: { decision: 'pass', categories: [], rationale: "Choosing not to interact with people is a direct social-contact use of interact in plain modern English." },
  292: { decision: 'pass', categories: [], rationale: "Color-coding cards for someone's convenience gives convenience a clear practical-help meaning." },
  293: { decision: 'pass', categories: [], rationale: "Going through a phase is a common expression for a temporary period, and the target is unmistakable." },
  294: { decision: 'pass', categories: [], rationale: "A corporate bond or gilt gives corporate a clear business-finance modifier meaning." },
  295: { decision: 'reject', categories: ['medical-heavy', 'context-dependent'], rationale: "Being sent back to a psych ward implies an unresolved psychiatric history, making ward a sensitive clinical context unsuitable for default learning." },
  296: { decision: 'pass', categories: [], rationale: "Restoring order after a natural disaster gives restore a clear return-to-condition meaning." },
  297: { decision: 'pass', categories: [], rationale: "A splotch of paint on a canvas is a concrete art-material context that makes canvas immediate." },
  298: { decision: 'pass', categories: [], rationale: "Fantasy and science fiction in other languages gives fiction a clear literary-genre meaning." },
  299: { decision: 'pass', categories: [], rationale: "Using lowercase letters and rarely using punctuation provides a simple frequency contrast that clearly teaches rarely." },
}
const severeIndices = new Set([289])

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
  const key = `${candidate.word.toLocaleLowerCase()}::${candidate.sentenceId}`
  const previous = priorByPair.get(key)
  const decision = previous?.decision === 'pass' ? previous : manual[index]
  if (!trace || trace.sentenceId !== candidate.sentenceId) throw new Error(`R5 post-curation provenance mismatch: ${candidate.word}|${candidate.sentenceId}`)
  if (!decision) throw new Error(`No Round 5 sentence-read decision at index ${index}: ${candidate.word}|${candidate.sentenceId}`)
  if (previous?.decision === 'reject') throw new Error(`Rejected prior pair re-entered: ${candidate.word}|${candidate.sentenceId}`)
  return {
    ...candidate,
    seed: candidates.seed,
    decision: decision.decision,
    categories: decision.categories,
    rationale: decision.rationale,
    reviewer: 'Lula-agent',
    reviewBasis: 'sentence-read-semantic-rubric',
    semanticDecisionSource: 'sentence-read',
    rubric: rubricFor(decision.decision, decision.categories),
    machineFlags: flags(trace),
    severeInappropriate: severeIndices.has(index),
  }
})
const rationales = rows.map((row) => row.rationale)
const frequencies = new Map<string, number>()
for (const rationale of rationales) frequencies.set(rationale, (frequencies.get(rationale) ?? 0) + 1)
const exactDuplicateRationaleCount = [...frequencies.values()].filter((count) => count > 1).reduce((total, count) => total + count - 1, 0)
const genericRationaleCount = rationales.filter((rationale) => rationale.length < 60 || /^Read in full:/i.test(rationale) || /^This is complete and natural/i.test(rationale)).length
const rationaleQuality = {
  reviewedRows: rows.length,
  exactDuplicateRationaleCount,
  genericRationaleCount,
  genericRationaleShare: Number((genericRationaleCount / rows.length).toFixed(4)),
  gate: exactDuplicateRationaleCount <= 5 && genericRationaleCount / rows.length < 0.05,
  method: 'Audit-only reviewer-quality QA; it never creates or changes semantic decisions.',
}
await writeFile(resolve(auditRoot, 'phase-a-post-curation-review.json'), `${JSON.stringify({ round: 5, attempt: 3, seed: candidates.seed, rows, reviewer: 'Lula-agent', reviewMethod: 'Sentence-by-sentence semantic rubric; prior pass rows are reused only for an exact word and sentenceId match.', noDecisionEditingForMetrics: true }, null, 2)}\n`, 'utf8')
const csvHeader = ['index', 'word', 'sentenceId', 'sentence', 'decision', 'categories', 'rationale', 'severeInappropriate']
const csv = [csvHeader.join(','), ...rows.map((row, index) => [index, row.word, row.sentenceId, row.sentence, row.decision, row.categories, row.rationale, row.severeInappropriate].map(csvCell).join(','))].join('\n') + '\n'
await writeFile(resolve(auditRoot, 'phase-a-post-curation-review.csv'), csv, 'utf8')
await writeFile(resolve(auditRoot, 'rationale-quality-report-post-curation.json'), `${JSON.stringify(rationaleQuality, null, 2)}\n`, 'utf8')
console.log(`Round 5 post-curation review attempt 3 written: sample=${rows.length}, fails=${rows.filter((row) => row.decision === 'reject').length}, severe=${rows.filter((row) => row.severeInappropriate).length}, rationaleDuplicates=${exactDuplicateRationaleCount}, genericShare=${(rationaleQuality.genericRationaleShare * 100).toFixed(1)}%`)
