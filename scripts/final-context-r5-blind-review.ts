import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

type Decision = 'pass' | 'reject'
interface Note { decision: Decision; categories: string[]; rationale: string }
interface Candidate { word: string; sentenceId: number; sentence: string; reviewType: string; semanticDecisionSource: string }
interface Provenance { sentenceId: number; source: string; qualityScore: number; [key: string]: number | string }

const root = resolve(import.meta.dirname, '..')
const auditRoot = resolve(root, 'audit/v1.3-context-final-semantic')
const candidates = JSON.parse(await readFile(resolve(auditRoot, 'blind-validation-candidates.json'), 'utf8')) as { seed: number; rows: Candidate[] }
const provenance = JSON.parse(await readFile(resolve(root, 'data-source/examples/example-provenance.json'), 'utf8')) as Record<string, Provenance>

const decisions: Record<number, Note> = {
  0: { decision: 'pass', categories: [], rationale: "Urban landscapes are a familiar visual setting that gives urban a direct city-related meaning." },
  1: { decision: 'reject', categories: ['religious-heavy', 'archaic', 'context-dependent'], rationale: "The archaic religious question about being cast down by sin and ascending makes cast depend on a fixed biblical-style idiom rather than a clear default context." },
  2: { decision: 'reject', categories: ['political-heavy', 'public-controversy'], rationale: "Capitalism and Marxism-Leninism are presented as competing political solutions, so solution is embedded in an ideological claim unsuitable for a neutral default example." },
  3: { decision: 'pass', categories: [], rationale: "A credit score being low is a common personal-finance context that clearly demonstrates score." },
  4: { decision: 'pass', categories: [], rationale: "Taking a scenic hike along the coast is a complete, ordinary activity context for hike." },
  5: { decision: 'reject', categories: ['violence', 'political-heavy'], rationale: "Persistent callous attacks in an unnamed country create a loaded political and violence context that is unnecessary for teaching persistent." },
  6: { decision: 'pass', categories: [], rationale: "A config file with documented configuration options gives configuration a direct technical-documentation meaning." },
  7: { decision: 'pass', categories: [], rationale: "A bank's actions assuring investors about bonds gives assure a clear formal confidence-building meaning." },
  8: { decision: 'reject', categories: ['public-controversy', 'political-heavy'], rationale: "Canceling one of the most powerful people invokes cancel-culture discourse and a public power struggle rather than a neutral use of cancel." },
  9: { decision: 'pass', categories: [], rationale: "Finding grace in the heart of the humble is a short, understandable descriptive use of humble." },
  10: { decision: 'pass', categories: [], rationale: "A woebegone facial expression after coming from the kitchen gives expression a clear visible-emotion meaning." },
  11: { decision: 'pass', categories: [], rationale: "Calling privacy a fundamental human right gives fundamental a clear importance-and-basis meaning in a modern civic sentence." },
  12: { decision: 'pass', categories: [], rationale: "Considering a lawsuit over a minor mistake and checking a contract is a clear everyday legal context for sue." },
  13: { decision: 'reject', categories: ['medical-heavy'], rationale: "Asking about personal cancer risk from relatives is a sensitive medical-genetics question, not a neutral default context for cancer." },
  14: { decision: 'reject', categories: ['archaic', 'context-dependent', 'weak-teaching-value'], rationale: "The clouds-as-veil personification is ornate and poetic, so veil is not shown in a straightforward modern context." },
  15: { decision: 'reject', categories: ['context-too-hard', 'weak-teaching-value'], rationale: "Invariant virtue and uninterrupted vice form an abstract philosophical argument with no concrete situation to anchor vice." },
  16: { decision: 'pass', categories: [], rationale: "Identifying the right lane to be in is a short, direct driving context for lane." },
  17: { decision: 'pass', categories: [], rationale: "A dean of admissions is a familiar education-administration role that clearly teaches dean." },
  18: { decision: 'pass', categories: [], rationale: "Being in denial about being an emo kid gives denial a clear refusal-to-accept meaning in an ordinary self-description." },
  19: { decision: 'reject', categories: ['fantastical-context', 'weak-teaching-value'], rationale: "An intergalactic alliance is a science-fiction setting, so alliance is not grounded in a normal default-learning context." },
  20: { decision: 'pass', categories: [], rationale: "Going out in a blaze of glory is a widely understood idiom that clearly demonstrates blaze." },
  21: { decision: 'pass', categories: [], rationale: "Discussion being unlikely to be beneficial gives beneficial a simple evaluation-of-value meaning." },
  22: { decision: 'pass', categories: [], rationale: "Cherishing silence is a natural personal-preference sentence that directly demonstrates cherish." },
  23: { decision: 'pass', categories: [], rationale: "Europe devising a strategy to prevent water-borne diseases gives strategy a clear plan-for-a-goal meaning." },
  24: { decision: 'pass', categories: [], rationale: "A discount on a next order is a familiar retail context that makes discount concrete." },
  25: { decision: 'pass', categories: [], rationale: "Immersing oysters in a frying basket is a complete cooking instruction that clearly shows immerse as putting something into a liquid or fat." },
  26: { decision: 'pass', categories: [], rationale: "Fragmentary evidence with possible interpretations gives evidence a clear support-for-a-claim meaning." },
  27: { decision: 'pass', categories: [], rationale: "Tourist barges gliding around bends provide a concrete movement scene for glide." },
  28: { decision: 'pass', categories: [], rationale: "Studying symbolism in Renaissance art gives Renaissance a clear historical-art context." },
  29: { decision: 'pass', categories: [], rationale: "An unopposed office candidate and a write-in joke still make candidate's election meaning immediately clear." },
  30: { decision: 'pass', categories: [], rationale: "Electrical generators in a heat-exchanger system provide a precise but understandable engineering context for electrical." },
  31: { decision: 'pass', categories: [], rationale: "A store having a prime location gives prime a familiar best-or-most-desirable meaning." },
  32: { decision: 'pass', categories: [], rationale: "Saying someone is royalty is a short, direct status description that clearly teaches royalty." },
  33: { decision: 'pass', categories: [], rationale: "Extreme poverty leading to extreme measures shows extreme as unusually severe in a coherent social context." },
  34: { decision: 'pass', categories: [], rationale: "Differences between test subgroups being dramatic gives dramatic a clear large-or-striking meaning." },
  35: { decision: 'pass', categories: [], rationale: "Improved conditions elevating the human experience gives elevate a clear figurative raise-or-improve meaning." },
  36: { decision: 'pass', categories: [], rationale: "Asking whether someone is confident in an outcome is a natural, self-contained use of confident." },
  37: { decision: 'pass', categories: [], rationale: "Detecting other dimensions presents detect as noticing or discovering something, and the sentence keeps that target central." },
  38: { decision: 'pass', categories: [], rationale: "Aid and abet in an illegal felony context gives illegal a clear law-based prohibition meaning." },
  39: { decision: 'pass', categories: [], rationale: "Questioning what hardworking employees deserve from their bosses gives deserve a clear fairness-and-entitlement meaning." },
  40: { decision: 'pass', categories: [], rationale: "Compromise depending on good faith gives compromise a direct negotiation meaning in a concise general statement." },
  41: { decision: 'pass', categories: [], rationale: "Aerogel's extraordinary lightness provides a concrete comparison that clearly demonstrates extraordinary." },
  42: { decision: 'reject', categories: ['death-heavy', 'weak-teaching-value'], rationale: "Identical graves and a joke about burying suburbanites make identical depend on morbid humor and add little safe teaching value." },
  43: { decision: 'pass', categories: [], rationale: "Color vision affecting an animal's search for camouflaged prey gives vision a clear biological-sensory meaning." },
  44: { decision: 'pass', categories: [], rationale: "Diffuse gas filling space without stars is a concrete astronomy context that clearly shows diffuse." },
  45: { decision: 'reject', categories: ['context-dependent', 'weak-teaching-value'], rationale: "An exotic destination is vague travel-marketing language with no concrete referent, so exotic is not taught precisely." },
  46: { decision: 'pass', categories: [], rationale: "A hidden bookcase granting access to a cellar gives cellar a concrete household-space meaning despite the playful mystery setup." },
  47: { decision: 'pass', categories: [], rationale: "Floating in zero gravity as a unique astronaut experience gives unique a clear one-of-a-kind meaning." },
  48: { decision: 'reject', categories: ['public-controversy'], rationale: "Describing a woman's way of talking as masculine relies on a gender stereotype rather than a neutral, broadly useful context for masculine." },
  49: { decision: 'reject', categories: ['specialist-background', 'political-heavy'], rationale: "Quantitative easing, eurozone risks, and a named speaker create dense policy-finance background that overwhelms quantitative." },
  50: { decision: 'pass', categories: [], rationale: "A dog instinctively recognizing another dog gives recognize a clear perception-and-identification meaning." },
  51: { decision: 'reject', categories: ['medical-heavy', 'weak-teaching-value'], rationale: "Severe diarrhea of the mouth is a vulgar body-based insult, not a reliable natural or useful default context for severe." },
  52: { decision: 'pass', categories: [], rationale: "Cashews being the exception to the shelled-or-unshelled purchase rule gives exception a clear exclusion meaning." },
  53: { decision: 'pass', categories: [], rationale: "Buying a snack from a vending machine is a simple everyday purchase context for snack." },
  54: { decision: 'pass', categories: [], rationale: "Birds migrating to roost during seasons gives migrate a clear recurring movement meaning." },
  55: { decision: 'reject', categories: ['specialist-background', 'context-too-hard'], rationale: "A Danish glottal stop and vocal-cord terminology require specialist phonetics knowledge that overwhelms vocal." },
  56: { decision: 'reject', categories: ['political-heavy', 'public-controversy'], rationale: "China imposing rule on Taiwan is a charged geopolitical claim, so impose is not shown in a neutral default context." },
  57: { decision: 'reject', categories: ['context-dependent', 'weak-teaching-value'], rationale: "You don't know me or what I'm capable of is an incomplete challenge with no action or ability specified, so capable is poorly anchored." },
  58: { decision: 'reject', categories: ['archaic', 'fantastical-context', 'weak-teaching-value'], rationale: "Disastrous recipes paired with may the devil take me is an odd archaic curse, so disastrous is not taught through a useful natural context." },
  59: { decision: 'pass', categories: [], rationale: "Asking someone to read an essay's rough draft gives draft a clear writing-stage meaning." },
  60: { decision: 'pass', categories: [], rationale: "Releasing less successful music into the public domain gives domain a clear legal-ownership context." },
  61: { decision: 'pass', categories: [], rationale: "Describing oneself as on the ace spectrum is a concise, neutral identity use that clearly shows spectrum as a range." },
  62: { decision: 'pass', categories: [], rationale: "A clerk at a feed store is a concrete retail role in a complete everyday sentence." },
  63: { decision: 'pass', categories: [], rationale: "Asking whether someone has hated a person for being gorgeous gives gorgeous a clear appearance meaning." },
  64: { decision: 'reject', categories: ['political-heavy', 'violence'], rationale: "Funding missile-defense programs places fund inside a militarized policy debate rather than a neutral money-support context." },
  65: { decision: 'reject', categories: ['fantastical-context', 'public-controversy', 'weak-teaching-value'], rationale: "Tinfoil hats amplifying mind-control signals is a conspiracy claim, so amplify is not presented in a reliable modern learning context." },
  66: { decision: 'pass', categories: [], rationale: "Being out of commission is a common idiom for being unable to work or function, clearly teaching commission." },
  67: { decision: 'pass', categories: [], rationale: "Ultraviolet light disinfecting wastewater gives ultraviolet a concrete scientific-property context." },
  68: { decision: 'pass', categories: [], rationale: "An island with white sandy beaches being paradise is a familiar, concrete ideal-place description." },
  69: { decision: 'reject', categories: ['specialist-background', 'context-too-hard'], rationale: "Decomposition ecology is a specialist scientific compound that provides too much background and does not teach ecology in an accessible way." },
  70: { decision: 'pass', categories: [], rationale: "Asking for effective ways to manage a crisis is a clear practical problem-solving context." },
  71: { decision: 'pass', categories: [], rationale: "Asking whether more oxygen tanks are needed gives oxygen a concrete medical-equipment context without offering unsafe advice." },
  72: { decision: 'pass', categories: [], rationale: "Seeking calm in the midst of chaos is a common contrast that directly demonstrates midst." },
  73: { decision: 'pass', categories: [], rationale: "Calling criticism facile while discussing whether it is controversial gives controversial a clear disputed-or-sensitive meaning." },
  74: { decision: 'pass', categories: [], rationale: "A facsimile proving an inscription genuine gives genuine a clear authentic-not-fake meaning." },
  75: { decision: 'pass', categories: [], rationale: "Doing one's best being sufficient is a familiar, self-contained use of suffice." },
  76: { decision: 'pass', categories: [], rationale: "A ballroom filled with the scent of roses is a concrete sensory setting for scent." },
  77: { decision: 'pass', categories: [], rationale: "Asking about a flag's history or origin gives origin a direct beginning-or-source meaning." },
  78: { decision: 'reject', categories: ['public-controversy', 'context-dependent'], rationale: "The Depp-Heard case is a highly charged public legal dispute and the sentence asks the learner to evaluate a verdict, not simply learn jury." },
  79: { decision: 'pass', categories: [], rationale: "Radiation and convection carrying energy outward gives outward a precise directional meaning in an understandable science context." },
  80: { decision: 'reject', categories: ['context-dependent', 'weak-teaching-value'], rationale: "That's not much of an incentive supplies no goal or motivating factor, so incentive is left as an unexplained abstract label." },
  81: { decision: 'reject', categories: ['context-dependent', 'weak-teaching-value'], rationale: "To stand tall is to be vulnerable is a paradoxical aphorism without a concrete situation, so vulnerable is not taught clearly enough." },
  82: { decision: 'pass', categories: [], rationale: "Repairing roof tiles on a slope gives slope a concrete surface-and-position meaning." },
  83: { decision: 'pass', categories: [], rationale: "Wasps reducing insect populations gives insect a clear biological group meaning." },
  84: { decision: 'reject', categories: ['fantastical-context', 'weak-teaching-value'], rationale: "Teaching someone to tame dragons is a fantasy premise and does not provide a normal default-learning context for tame." },
  85: { decision: 'pass', categories: [], rationale: "Turning over in one's grave is a widely understood idiom that gives grave a clear burial-place meaning." },
  86: { decision: 'pass', categories: [], rationale: "Amplifying a debate with thoughtless responses gives debate a clear public-discussion meaning." },
  87: { decision: 'pass', categories: [], rationale: "Promoting hygiene at work is a direct workplace-health use that clearly demonstrates promote." },
  88: { decision: 'pass', categories: [], rationale: "Aerogel mixed to the consistency of pudding gives pudding a concrete texture comparison." },
  89: { decision: 'pass', categories: [], rationale: "Seeing opportunity in every setback is a common resilience context that clearly shows setback." },
  90: { decision: 'pass', categories: [], rationale: "Attractive country along a leisurely train journey gives attractive a clear visual-appeal meaning." },
  91: { decision: 'pass', categories: [], rationale: "Living proof that someone failed to break the speaker gives proof a clear evidence meaning." },
  92: { decision: 'reject', categories: ['hate', 'public-controversy'], rationale: "Misogynistic hatred of a defendant introduces explicit gendered hostility into a legal dispute, making hatred a severe unsuitable context." },
  93: { decision: 'pass', categories: [], rationale: "A permanent structure made of concrete gives permanent a clear lasting-duration meaning." },
  94: { decision: 'pass', categories: [], rationale: "Gold spectacle frames in a jackdaw nest give spectacle a concrete eyeglasses-related meaning." },
  95: { decision: 'pass', categories: [], rationale: "Sour cream and onion chips provide a familiar food-flavor context for sour." },
  96: { decision: 'reject', categories: ['context-dependent', 'unnatural-English'], rationale: "The conditional fragment about someday planting olive trees has no complete proposition, so olive is not presented in a reliable standalone sentence." },
  97: { decision: 'pass', categories: [], rationale: "Voting for freedom and equality gives equality a clear civic fairness meaning in a short sentence." },
  98: { decision: 'pass', categories: [], rationale: "You can't prohibit me from doing that is a direct, ordinary use of prohibit as forbid." },
  99: { decision: 'reject', categories: ['public-controversy', 'political-heavy'], rationale: "Corrupt politicians siphoning billions from private businesses is a loaded political-corruption claim rather than a neutral context for corrupt." },
}

const severeIndices = new Set([92])
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
function flags(trace: Provenance): Record<string, number> { return Object.fromEntries(Object.entries(trace).filter(([, value]) => typeof value === 'number')) as Record<string, number> }
function csvCell(value: unknown): string { const text = typeof value === 'string' ? value : JSON.stringify(value); return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text }

const rows = candidates.rows.map((candidate, index) => {
  const trace = provenance[candidate.word]
  const decision = decisions[index]
  if (!trace || trace.sentenceId !== candidate.sentenceId) throw new Error(`Blind provenance mismatch at ${index}: ${candidate.word}|${candidate.sentenceId}`)
  if (!decision) throw new Error(`No blind sentence-read decision at index ${index}: ${candidate.word}|${candidate.sentenceId}`)
  return { ...candidate, seed: candidates.seed, decision: decision.decision, categories: decision.categories, rationale: decision.rationale, reviewer: 'Lula-agent', reviewBasis: 'blind-sentence-read-semantic-rubric', semanticDecisionSource: 'sentence-read', rubric: rubricFor(decision.decision, decision.categories), machineFlags: flags(trace), severeInappropriate: severeIndices.has(index) }
})
const rationales = rows.map((row) => row.rationale); const frequencies = new Map<string, number>(); for (const rationale of rationales) frequencies.set(rationale, (frequencies.get(rationale) ?? 0) + 1); const exactDuplicateRationaleCount = [...frequencies.values()].filter((count) => count > 1).reduce((total, count) => total + count - 1, 0); const genericRationaleCount = rationales.filter((rationale) => rationale.length < 60 || /^Read in full:/i.test(rationale) || /^This is complete and natural/i.test(rationale)).length
const passCount = rows.filter((row) => row.decision === 'pass').length; const failCount = rows.length - passCount; const severeCount = rows.filter((row) => row.severeInappropriate).length
const rationaleQuality = { reviewedRows: rows.length, exactDuplicateRationaleCount, genericRationaleCount, genericRationaleShare: Number((genericRationaleCount / rows.length).toFixed(4)), gate: exactDuplicateRationaleCount <= 5 && genericRationaleCount / rows.length < 0.05, method: 'Audit-only reviewer-quality QA; it never creates or changes semantic decisions.' }
await writeFile(resolve(auditRoot, 'blind-validation.json'), `${JSON.stringify({ round: 5, seed: candidates.seed, rows, passCount, failCount, passRate: passCount / rows.length, severeInappropriateCount: severeCount, rationaleQuality, reviewMethod: 'Independent sentence-by-sentence blind semantic review; machine metrics were not shown before decisions.', noDecisionEditingForMetrics: true }, null, 2)}\n`, 'utf8')
const csvHeader = ['index', 'word', 'sentenceId', 'sentence', 'decision', 'categories', 'rationale', 'severeInappropriate']; const csv = [csvHeader.join(','), ...rows.map((row, index) => [index, row.word, row.sentenceId, row.sentence, row.decision, row.categories, row.rationale, row.severeInappropriate].map(csvCell).join(','))].join('\n') + '\n'; await writeFile(resolve(auditRoot, 'blind-validation.csv'), csv, 'utf8')
await writeFile(resolve(auditRoot, 'blind-validation-summary.md'), `# Round 5 Blind Validation\n\n- Reviewed: ${rows.length}\n- PASS: ${passCount}\n- FAIL: ${failCount}\n- PASS rate: ${(passCount / rows.length * 100).toFixed(1)}%\n- Severe inappropriate: ${severeCount}\n- Rationale exact duplicates: ${exactDuplicateRationaleCount}\n- Generic rationale share: ${(genericRationaleCount / rows.length * 100).toFixed(1)}%\n\nThis is a sentence-read result. Any FAIL is retained as a FAIL and must be durably rejected, followed by rebuild and retest; no decision was changed to improve the percentage.\n`, 'utf8')
console.log(`Round 5 blind review written: sample=${rows.length}, pass=${passCount}, fails=${failCount}, severe=${severeCount}, rationaleDuplicates=${exactDuplicateRationaleCount}, genericShare=${(genericRationaleCount / rows.length * 100).toFixed(1)}%`)
