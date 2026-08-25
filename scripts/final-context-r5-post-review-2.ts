import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

type Decision = 'pass' | 'reject'
interface ManualDecision { decision: Decision; categories: string[]; rationale: string }
interface Candidate { word: string; sentenceId: number; sentence: string; reviewType: string; semanticDecisionSource: string }
interface Provenance { sentenceId: number; source: string; qualityScore: number; [key: string]: number | string }
interface PriorReviewRow extends Candidate, ManualDecision { [key: string]: unknown }

const root = resolve(import.meta.dirname, '..')
const auditRoot = resolve(root, 'audit/v1.3-context-final-semantic')
const candidatePath = resolve(auditRoot, 'phase-a-post-curation-candidates.json')
const provenancePath = resolve(root, 'data-source/examples/example-provenance.json')
const priorReviewPath = resolve(auditRoot, 'phase-a-post-curation-attempt-1-review.json')

// These are the 94 candidates not covered by the preserved Round 5 post-curation
// attempt. Every note was written against the sentence at this exact index.
const manual: Record<number, ManualDecision> = {
  44: { decision: 'reject', categories: ['public-controversy', 'weak-teaching-value'], rationale: "Calling all intellectual property theft is an ideological claim, so intellectual is embedded in a public controversy rather than a neutral learning context." },
  55: { decision: 'pass', categories: [], rationale: "An alternate spelling is a direct, familiar language example that shows alternate as a different version." },
  65: { decision: 'pass', categories: [], rationale: "A shark swimming past a porthole is a simple concrete scene with the target unambiguous." },
  68: { decision: 'reject', categories: ['medical-heavy', 'context-dependent'], rationale: "Asking what someone was injected with gives inject no object or purpose and leaves the learner dependent on an unstated medical situation." },
  71: { decision: 'pass', categories: [], rationale: "Asking for a secret recipe creates a familiar cooking context that clearly identifies recipe." },
  80: { decision: 'pass', categories: [], rationale: "The phrase formal definition places formal in a precise academic usage, and the sentence remains short and self-contained." },
  82: { decision: 'reject', categories: ['medical-heavy', 'weak-teaching-value'], rationale: "That was insane is a vague colloquial judgment, and the speaker's claim to know would not give a default learner a careful modern sense of insane." },
  84: { decision: 'reject', categories: ['public-controversy', 'political-heavy'], rationale: "The sentence presents an adversarial claim about corporate interests and infinite scrolling, adding a loaded debate that is unnecessary for benefit." },
  87: { decision: 'reject', categories: ['public-controversy', 'political-heavy'], rationale: "A political agenda is the central accusation, so acknowledge is taught inside a partisan claim rather than a neutral, broadly reusable context." },
  88: { decision: 'reject', categories: ['public-controversy', 'medical-heavy'], rationale: "The slogan about trans people and trusting science makes transition depend on a contested identity and medical-policy discussion instead of a neutral meaning." },
  94: { decision: 'reject', categories: ['hate', 'archaic', 'context-dependent'], rationale: "The archaic exclamation about queer morality is hostile and opaque, so purity is not presented in a safe, clear default-learning context." },
  99: { decision: 'reject', categories: ['public-controversy', 'weak-teaching-value'], rationale: "The boomer stereotype turns cable into a generational joke and gives the target little teaching value beyond a dismissive cultural reference." },
  108: { decision: 'pass', categories: [], rationale: "Calling art a form of protest gives protest a clear public-expression meaning without requiring a specific controversy." },
  114: { decision: 'pass', categories: [], rationale: "The question about fake tan is an ordinary product-use context and makes fake clear as not genuine." },
  121: { decision: 'reject', categories: ['context-too-hard', 'weak-teaching-value'], rationale: "The mocking sieve and smiling rug are an opaque personified proverb, so coarse is harder to learn than the sentence's surface contrast suggests." },
  144: { decision: 'pass', categories: [], rationale: "The historical sentence uses alternative for another possible system, and the contrast with monarchy makes the meaning clear." },
  146: { decision: 'pass', categories: [], rationale: "Looking up an unknown word in a dictionary is a familiar study action that clearly teaches definition." },
  149: { decision: 'reject', categories: ['context-dependent', 'weak-teaching-value'], rationale: "Reign of mediocrity is an ornate abstract slogan with no concrete subject, so the target is not taught through a clear standalone situation." },
  150: { decision: 'pass', categories: [], rationale: "Saying someone may have the plague presents a direct disease meaning in a short, understandable sentence." },
  154: { decision: 'pass', categories: [], rationale: "Seeing light at the end of a tunnel is a common idiom that clearly illustrates tunnel in a familiar figurative setting." },
  158: { decision: 'pass', categories: [], rationale: "The stock exchange sentence gives exchange a clear financial-market noun meaning in a complete modern sentence." },
  160: { decision: 'reject', categories: ['medical-heavy', 'weak-teaching-value'], rationale: "Obesity and a goiter introduce an unexplained medical and body-focused detail that contributes little to teaching bonus." },
  165: { decision: 'reject', categories: ['religious-heavy', 'public-controversy'], rationale: "Calling Tom very Catholic while qualifying his conservatism makes catholic depend on a personal religious-political identity rather than a neutral context." },
  174: { decision: 'reject', categories: ['violence', 'self-harm'], rationale: "The sentence explicitly treats murdering people as a possible solution, so solution appears in a severe violence context unsuitable for default learning." },
  185: { decision: 'pass', categories: [], rationale: "A negative comment is an ordinary communication example that makes negative directly understandable." },
  186: { decision: 'pass', categories: [], rationale: "Free verse with meter and rhyme gives verse a clear poetry meaning and enough contrast to orient the learner." },
  193: { decision: 'pass', categories: [], rationale: "Teenagers threatening to run away is a complete, familiar example of threaten without graphic harm." },
  207: { decision: 'pass', categories: [], rationale: "Being responsible for a scientific breakthrough gives responsible a clear causal-accountability meaning." },
  208: { decision: 'reject', categories: ['public-controversy', 'political-heavy'], rationale: "The phrase revolutionary Marxist opens a political-ideology classification dispute, making revolutionary less accessible than a neutral innovation example." },
  219: { decision: 'pass', categories: [], rationale: "Every aspect of their lives is a standard whole-and-part use that clearly teaches aspect." },
  222: { decision: 'reject', categories: ['violence', 'medical-heavy'], rationale: "Mass shooters and psychiatric evaluations place mass in an explicit violence and mental-health debate, creating a severe unsuitable context." },
  224: { decision: 'reject', categories: ['specialist-background', 'context-too-hard'], rationale: "Garnet chemistry and composition ranges require specialist background that overwhelms the ordinary variation meaning." },
  227: { decision: 'reject', categories: ['public-controversy', 'political-heavy'], rationale: "Deportation, border crossing, and authoritarianism make border part of a charged immigration argument rather than a neutral spatial context." },
  239: { decision: 'pass', categories: [], rationale: "Stock markets and earnings reports give stock a direct financial-market meaning in a complete news-style example." },
  240: { decision: 'pass', categories: [], rationale: "Mechanical pencils provide a concrete everyday object for mechanical and the comparison explains their practical benefit." },
  241: { decision: 'pass', categories: [], rationale: "Facing potential in every challenge gives challenge a familiar difficulty meaning in a short first-person statement." },
  242: { decision: 'pass', categories: [], rationale: "Open communication supporting mutual learning is a clear interpersonal and education context." },
  243: { decision: 'pass', categories: [], rationale: "Wet flaxseeds becoming sticky is a concrete physical-property context that places the target at the center." },
  244: { decision: 'pass', categories: [], rationale: "Volunteering during a medical outbreak places outbreak in a clear public-health event context without graphic detail." },
  245: { decision: 'pass', categories: [], rationale: "A lens of possibility is a familiar figurative viewpoint expression that clearly demonstrates lens." },
  246: { decision: 'pass', categories: [], rationale: "Falling down an elevator shaft gives shaft a concrete structural meaning in a brief, non-graphic accident context." },
  247: { decision: 'pass', categories: [], rationale: "A director asking a board to nominate someone is a clear formal selection context." },
  248: { decision: 'reject', categories: ['death-heavy', 'context-dependent'], rationale: "The euphemism if he were still of this world makes offspring depend on an unexplained death and does not provide a neutral family context." },
  249: { decision: 'pass', categories: [], rationale: "The Sun's magnetic field changing polarity gives magnetic a precise but accessible science context." },
  250: { decision: 'pass', categories: [], rationale: "Writing something off as a business expense is a familiar accounting use that clearly shows expense." },
  251: { decision: 'pass', categories: [], rationale: "Sorting out a personal schedule is a common planning action that directly teaches schedule." },
  252: { decision: 'pass', categories: [], rationale: "A novelty pencil sharpener is a concrete gift designed for unusual amusement, making novelty clear." },
  253: { decision: 'pass', categories: [], rationale: "Hearing coyotes howl is a short, natural animal-sound context with no distracting background." },
  254: { decision: 'reject', categories: ['hate', 'public-controversy'], rationale: "The insult-laden claim about cis ideology and children is a severe identity controversy that makes impose unsafe for default learning." },
  255: { decision: 'pass', categories: [], rationale: "Comparing reading on screens versus paper gives versus a direct contrast meaning in an ordinary study context." },
  256: { decision: 'pass', categories: [], rationale: "Keeping a garden thriving during drought gives drought a concrete environmental condition." },
  257: { decision: 'pass', categories: [], rationale: "A governess working for a wealthy family makes wealthy clear as financially prosperous." },
  258: { decision: 'pass', categories: [], rationale: "Asking how to apply a bandage is a direct first-aid context with the target central and no graphic detail." },
  259: { decision: 'pass', categories: [], rationale: "Taking a ferry to an island is a simple transport example that makes ferry immediately concrete." },
  260: { decision: 'pass', categories: [], rationale: "Admitting a tendency to text long messages gives tendency a clear habitual-behavior use." },
  261: { decision: 'pass', categories: [], rationale: "Improving team productivity is a familiar workplace goal that makes productivity clear." },
  262: { decision: 'pass', categories: [], rationale: "Questioning a norm with courage shows norm as an accepted social standard." },
  263: { decision: 'pass', categories: [], rationale: "Asking to turn up the volume while listening from another apartment is a natural everyday audio context." },
  264: { decision: 'pass', categories: [], rationale: "Vegetation becoming sparser as conditions dry gives vegetation a clear plant-cover meaning." },
  265: { decision: 'pass', categories: [], rationale: "A reaction to anesthesia is a direct medical response example, and the target is clear in the complete sentence." },
  266: { decision: 'pass', categories: [], rationale: "A cash register requiring a purchase gives purchase a clear transaction meaning." },
  267: { decision: 'pass', categories: [], rationale: "Exchanging insurance information after a collision is a familiar accident-response context." },
  268: { decision: 'pass', categories: [], rationale: "A whispered remark causing giggling gives giggle a clear light social-reaction meaning." },
  269: { decision: 'reject', categories: ['hate', 'public-controversy'], rationale: "The sweeping claim about trans women and women's sports is an exclusionary identity controversy, not a safe neutral context for athlete." },
  270: { decision: 'pass', categories: [], rationale: "Healing through teaching others to cope gives cope a clear manage-difficulty meaning." },
  271: { decision: 'pass', categories: [], rationale: "A question about a tow-truck driver's earnings gives tow a concrete vehicle-service context." },
  272: { decision: 'reject', categories: ['hate', 'death-heavy'], rationale: "Burial alive for associating with Jews combines historical antisemitic persecution and explicit violence, so merely is in a severe unsuitable context." },
  273: { decision: 'pass', categories: [], rationale: "Being out of one's element is a common idiom that clearly presents element as a situation or domain." },
  274: { decision: 'pass', categories: [], rationale: "Removing a hair clog from a sink drain is a concrete household action that makes drain unambiguous." },
  275: { decision: 'pass', categories: [], rationale: "In spite of everything is a common concessive phrase that clearly demonstrates spite in its idiomatic use." },
  276: { decision: 'reject', categories: ['context-too-hard', 'weak-teaching-value'], rationale: "Legally distinct candy bar is a niche trademark joke tied to a starvation setup, so distinct is not taught in a broadly useful neutral context." },
  277: { decision: 'reject', categories: ['specialist-background', 'political-heavy'], rationale: "An absentee landlord, state enforcement, and property claims create a dense legal-political argument that overwhelms enforce." },
  278: { decision: 'pass', categories: [], rationale: "A genie promising three wishes is a familiar narrative use of grant as give or allow." },
  279: { decision: 'pass', categories: [], rationale: "Keeping a microbe from contaminating Mars gives contaminate a clear scientific cause-and-effect context." },
  280: { decision: 'pass', categories: [], rationale: "Devising a plan is a direct planning use with the target central and the syntax uncomplicated." },
  281: { decision: 'pass', categories: [], rationale: "Legal terms and conditions constituting acceptance give acceptance a clear formal-contract meaning." },
  282: { decision: 'reject', categories: ['context-dependent', 'weak-teaching-value'], rationale: "The wrong-turn joke provides no concrete explanation of suburb and makes the target depend on an odd negative characterization." },
  283: { decision: 'reject', categories: ['medical-heavy'], rationale: "Autism and severe depression make depression part of a personal diagnostic context that is too medically sensitive for a default example." },
  284: { decision: 'reject', categories: ['hate', 'public-controversy'], rationale: "The claim about vicious transphobes and chasers is hostile identity discourse, so vicious is not presented in a safe neutral context." },
  285: { decision: 'reject', categories: ['religious-heavy', 'public-controversy'], rationale: "The sentence uses Catholic identity to qualify conservative and therefore teaches the target inside a religious-political generalization." },
  286: { decision: 'pass', categories: [], rationale: "Leaving a bruise is a simple physical-result example that makes the noun clear without graphic description." },
  287: { decision: 'pass', categories: [], rationale: "Being immune to a virus is a direct health-related example of resistance." },
  288: { decision: 'pass', categories: [], rationale: "Finding Danish hard to imitate shows imitate as reproduce another sound or style." },
  289: { decision: 'pass', categories: [], rationale: "Asking whether food is sufficient for survival on an island makes survival clear as continued living." },
  290: { decision: 'pass', categories: [], rationale: "Lessons in every religious tradition give religious a neutral descriptive use without advocating a belief." },
  291: { decision: 'pass', categories: [], rationale: "The crime-and-posting warning directly uses commit to mean carry out an offense." },
  292: { decision: 'pass', categories: [], rationale: "Balancing reason and emotion gives emotion a familiar contrast with thought." },
  293: { decision: 'reject', categories: ['public-controversy', 'unnatural-English'], rationale: "The sentence generalizes about African banking and uses an awkward many Africans who do not use banks construction, so mobile is not a reliable neutral model." },
  294: { decision: 'pass', categories: [], rationale: "Migrating birds flying overhead is a concrete spatial-direction example that is easy to visualize." },
  295: { decision: 'pass', categories: [], rationale: "The whole thing about to collapse is a direct physical-failure context with the target unmistakable." },
  296: { decision: 'pass', categories: [], rationale: "Intrinsic motivation to study French gives intrinsic a clear built-in or internal meaning in a learning context." },
  297: { decision: 'pass', categories: [], rationale: "Galapagos islands lying along the equator provides a precise geography context for the target." },
  298: { decision: 'pass', categories: [], rationale: "Providing first aid to injured civilians clearly teaches provided as supplied help, without graphic description." },
  299: { decision: 'pass', categories: [], rationale: "Stegosaurs disappearing before the end of the period gives extinct a clear species-survival meaning in a factual science context." },
}

const severeIndices = new Set([174, 222, 254, 269, 272, 284])

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

const candidates = JSON.parse(await readFile(candidatePath, 'utf8')) as { seed: number; rows: Candidate[] }
const provenance = JSON.parse(await readFile(provenancePath, 'utf8')) as Record<string, Provenance>
const prior = JSON.parse(await readFile(priorReviewPath, 'utf8')).rows as PriorReviewRow[]
const priorByPair = new Map(prior.map((row) => [`${row.word.toLocaleLowerCase()}::${row.sentenceId}`, row]))
const rows = candidates.rows.map((candidate, index) => {
  const trace = provenance[candidate.word]
  const previous = priorByPair.get(`${candidate.word.toLocaleLowerCase()}::${candidate.sentenceId}`)
  const decision = previous?.decision === 'pass' ? previous : manual[index]
  if (!trace || trace.sentenceId !== candidate.sentenceId) throw new Error(`Post-curation provenance mismatch at ${index}: ${candidate.word}|${candidate.sentenceId}`)
  if (!decision) throw new Error(`No sentence-read decision authored at ${index}: ${candidate.word}|${candidate.sentenceId}`)
  if (previous?.decision === 'reject') throw new Error(`Rejected prior pair re-entered post-curation sample: ${candidate.word}|${candidate.sentenceId}`)
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
await writeFile(resolve(auditRoot, 'phase-a-post-curation-review.json'), `${JSON.stringify({
  round: 5,
  attempt: 2,
  seed: candidates.seed,
  rows,
  reviewer: 'Lula-agent',
  reviewMethod: 'Sentence-by-sentence semantic rubric; prior pass rows are reused only when the exact word and sentenceId match.',
  noDecisionEditingForMetrics: true,
}, null, 2)}\n`, 'utf8')
const csvHeader = ['index', 'word', 'sentenceId', 'sentence', 'decision', 'categories', 'rationale', 'severeInappropriate']
const csv = [csvHeader.join(','), ...rows.map((row, index) => [index, row.word, row.sentenceId, row.sentence, row.decision, row.categories, row.rationale, row.severeInappropriate].map(csvCell).join(','))].join('\n') + '\n'
await writeFile(resolve(auditRoot, 'phase-a-post-curation-review.csv'), csv, 'utf8')
await writeFile(resolve(auditRoot, 'rationale-quality-report-post-curation.json'), `${JSON.stringify(rationaleQuality, null, 2)}\n`, 'utf8')
console.log(`Round 5 post-curation review attempt 2 written: sample=${rows.length}, fails=${rows.filter((row) => row.decision === 'reject').length}, severe=${rows.filter((row) => row.severeInappropriate).length}, rationaleDuplicates=${exactDuplicateRationaleCount}, genericShare=${(rationaleQuality.genericRationaleShare * 100).toFixed(1)}%`)
