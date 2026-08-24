import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

interface WordRecord {
  word: string
}

interface WordExample {
  en: string
}

interface Token {
  raw: string
  lower: string
  index: number
}

interface QualityMetrics {
  tokenCount: number
  characterCount: number
  targetIndex: number
  rareTokenCount: number
  unknownLikeTokenCount: number
  medianContextFrequency: number
  minContextFrequency: number
  properNounCount: number
  adjacentProperNounCount: number
  acronymCount: number
  commaCount: number
  quoteCount: number
  topicPenalty: number
  standalonePenalty: number
  targetPositionPenalty: number
}

interface Candidate extends WordExample {
  sentenceId: number
  score: number
  metrics: QualityMetrics
}

interface Provenance extends QualityMetrics {
  sentenceId: number
  source: 'tatoeba-cc0'
  qualityScore: number
}

interface ExampleBuildReport {
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
  qualityPolicy: {
    tokenRange: [number, number]
    extendedTokenRange: [number, number]
    preferredTokenRange: [number, number]
    preferredCharacterRange: [number, number]
    maxRareContextTokens: number
    maxUnknownLikeContextTokens: number
    rareFrequencyThreshold: number
    unknownFrequencyThreshold: number
    minimumQualityScore: number
  }
  deterministic: boolean
  curation: {
    version: number
    globalRejectCount: number
    pairRejectCount: number
    rejectedCandidateCount: number
    noFallbackCount: number
  }
}

interface CurationGlobalReject {
  sentenceId: number
  categories: string[]
  reason: string
}

interface CurationPairReject extends CurationGlobalReject {
  word: string
}

interface ContextCuration {
  version: number
  globalReject: CurationGlobalReject[]
  pairReject: CurationPairReject[]
}

const root = resolve(import.meta.dirname, '..')
const vocabularyPath = resolve(root, 'public/data/cet6-vocab.v1.json')
const sourcePath = resolve(root, 'data-source/examples/tatoeba/eng_sentences_CC0.tsv')
const outputPath = resolve(root, 'data-source/examples/selected-examples.json')
const provenancePath = resolve(root, 'data-source/examples/example-provenance.json')
const buildReportPath = resolve(root, 'data-source/examples/build-report.json')
const curationPath = resolve(root, 'data-source/examples/context-curation.json')

const MIN_TOKENS = 6
const MAX_TOKENS = 18
const MAX_EXTENDED_TOKENS = 20
const MIN_CHARS = 18
const MAX_CHARS = 150
const MAX_RARE_CONTEXT_TOKENS = 2
const MAX_UNKNOWN_LIKE_CONTEXT_TOKENS = 1
const MIN_QUALITY_SCORE = 29
const RARE_FREQUENCY_THRESHOLD = 2
const UNKNOWN_FREQUENCY_THRESHOLD = 1
const tokenPattern = /[A-Za-z]+(?:['-][a-z]+)*/gi

const allowedCapitalizedWords = new Set([
  'Earth',
  'English',
  'Internet',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
])

const severeTopic = /\b(?:porn|pornography|nude|nudity|rape|rapist|fuck|fucking|shit|bitch|cunt|whore|slut|nigger|nigga|suicide|self-harm|selfharm|terrorist|terrorism|murder|murderer|bloodshed|bomb|bombing|genocide|beheading|torture|tortured|massacre|abortion|weapon|weapons|gun|guns|shoot|shooting|drowning|drowned)\b/i

const topicSignals: Array<{ reason: string; pattern: RegExp; penalty: number }> = [
  { reason: 'sensitiveTopic', pattern: /\b(?:war|military|battle|soldier|army|rebel|rebels|invasion|occupation|violence|violent|crime|criminal|police|prison|arrest|court|trial|lawsuit|victim|blood|kill|killed|killing)\b/i, penalty: 24 },
  { reason: 'politicalTopic', pattern: /\b(?:politic|political|election|electoral|president|prime minister|minister|government|parliament|congress|senate|democrat|republican|party|campaign|policy|sanction|diplomat|immigration|refugee)\b/i, penalty: 20 },
  { reason: 'religiousTopic', pattern: /\b(?:religion|religious|church|mosque|temple|prayer|priest|jesus|christian|christianity|islam|muslim|catholic|bible|god|heaven|hell)\b/i, penalty: 18 },
  { reason: 'medicalTopic', pattern: /\b(?:cancer|tumou?r|hiv|aids|hemorrhoid|hemorrhoids|disease|illness|symptom|surgery|hospital|medical|medicine|diagnosis|therapy|disability)\b/i, penalty: 18 },
  { reason: 'publicControversy', pattern: /\b(?:trump|biden|musk|putin|zelensky|palestine|israel|ukraine|russia|taiwan)\b/i, penalty: 26 },
  { reason: 'identityConflict', pattern: /\b(?:racist|racism|racial|slur|discrimination|homophobic|sexist|slavery|slave)\b/i, penalty: 20 },
]

const standalonePenaltyPatterns: Array<{ pattern: RegExp; penalty: number }> = [
  { pattern: /^(?:because|although|though|therefore|thus|however|as a result|that is why|this is why)\b/i, penalty: 20 },
  { pattern: /^(?:this|that|these|those|he|she|they|it|we|such|so)\b/i, penalty: 10 },
  { pattern: /\b(?:did so|do so|does so|agreed to it|referred to it|because of this|for this reason)\b/i, penalty: 9 },
]

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
  return value
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[—–]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokenize(sentence: string): Token[] {
  return [...sentence.matchAll(tokenPattern)].map((match) => ({
    raw: match[0],
    lower: match[0].toLocaleLowerCase(),
    index: match.index ?? 0,
  }))
}

function frequencyKey(token: string): string {
  return token.toLocaleLowerCase().replace(/^'+|'+$/g, '')
}

function isClauseStart(sentence: string, token: Token): boolean {
  const prefix = sentence.slice(0, token.index)
  return token.index === 0 || /^[\s"'([{]*$/.test(prefix) || /[.!?]\s*["')\]]*$/.test(prefix)
}

function detectProperNouns(sentence: string, tokens: Token[]): { properNounCount: number; adjacentProperNounCount: number; acronymCount: number } {
  const midSentenceCaps = tokens.filter((token) => {
    if (isClauseStart(sentence, token) || token.raw === 'I' || allowedCapitalizedWords.has(token.raw)) return false
    return /^[A-Z][a-z]+$/.test(token.raw)
  })
  const acronymCount = (sentence.match(/\b[A-Z]{2,}\b/g) ?? []).length
  const properNounIndexes = midSentenceCaps.map((token) => tokens.indexOf(token))
  const adjacentProperNounCount = properNounIndexes.filter((index) => properNounIndexes.includes(index + 1)).length
  return { properNounCount: midSentenceCaps.length, adjacentProperNounCount, acronymCount }
}

function median(values: number[]): number {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

function getTopicPenalty(sentence: string): number {
  return topicSignals.reduce((total, signal) => total + (signal.pattern.test(sentence) ? signal.penalty : 0), 0)
}

function getStandalonePenalty(sentence: string): number {
  return standalonePenaltyPatterns.reduce((total, signal) => total + (signal.pattern.test(sentence) ? signal.penalty : 0), 0)
}

function getTargetPositionPenalty(targetIndex: number, tokenCount: number): number {
  if (targetIndex === 0 || targetIndex === tokenCount - 1) return 10
  if (targetIndex === 1 || targetIndex === tokenCount - 2) return 4
  return 0
}

function evaluateCandidate(sentence: string, sourceHadLongDash: boolean, tokens: Token[], targetIndex: number, tokenFrequency: Map<string, number>): { candidate?: Omit<Candidate, 'en' | 'sentenceId'>; reasons: string[] } {
  const reasons: string[] = []
  const { properNounCount, adjacentProperNounCount, acronymCount } = detectProperNouns(sentence, tokens)
  const contextFrequencies = tokens
    .filter((_, index) => index !== targetIndex)
    .map((token) => tokenFrequency.get(frequencyKey(token.raw)) ?? 0)
  const rareTokenCount = contextFrequencies.filter((frequency) => frequency < RARE_FREQUENCY_THRESHOLD).length
  const unknownLikeTokenCount = contextFrequencies.filter((frequency) => frequency < UNKNOWN_FREQUENCY_THRESHOLD).length
  const commaCount = (sentence.match(/,/g) ?? []).length
  const quoteCount = (sentence.match(/"/g) ?? []).length
  const topicPenalty = getTopicPenalty(sentence)
  const standalonePenalty = getStandalonePenalty(sentence)
  const targetPositionPenalty = getTargetPositionPenalty(targetIndex, tokens.length)
  const extendedLengthAllowed = tokens.length <= MAX_TOKENS
    || (tokens.length <= MAX_EXTENDED_TOKENS
      && sentence.length <= 120
      && properNounCount === 0
      && acronymCount === 0
      && rareTokenCount <= 1
      && unknownLikeTokenCount <= 1
      && commaCount <= 1
      && quoteCount <= 2
      && topicPenalty === 0
      && standalonePenalty === 0
      && !sourceHadLongDash)

  if (sourceHadLongDash || /[;:()[\]{}\/]/.test(sentence) || /--/.test(sentence)) reasons.push('structure')
  if (!extendedLengthAllowed) reasons.push('length')
  if (commaCount > 1 || quoteCount > 2) reasons.push('structure')
  if (properNounCount >= 3 || adjacentProperNounCount > 0) reasons.push('properNoun')
  if (acronymCount > 0) reasons.push('properNoun')
  if (severeTopic.test(sentence)) reasons.push('sensitiveTopic')
  if (rareTokenCount > MAX_RARE_CONTEXT_TOKENS) reasons.push('rareContext')
  if (unknownLikeTokenCount > MAX_UNKNOWN_LIKE_CONTEXT_TOKENS) reasons.push('rareContext')
  if (standalonePenalty >= 20) reasons.push('contextDependence')

  const metrics: QualityMetrics = {
    tokenCount: tokens.length,
    characterCount: sentence.length,
    targetIndex,
    rareTokenCount,
    unknownLikeTokenCount,
    medianContextFrequency: median(contextFrequencies),
    minContextFrequency: contextFrequencies.length ? Math.min(...contextFrequencies) : 0,
    properNounCount,
    adjacentProperNounCount,
    acronymCount,
    commaCount,
    quoteCount,
    topicPenalty,
    standalonePenalty,
    targetPositionPenalty,
  }

  if (reasons.length) return { reasons: [...new Set(reasons)] }

  let score = 100
  score -= Math.abs(tokens.length - 11) * 2.5
  score -= Math.abs(sentence.length - 82) / 11
  score -= rareTokenCount * 8 + unknownLikeTokenCount * 12
  score -= properNounCount * 12 + acronymCount * 15
  score -= topicPenalty + standalonePenalty + targetPositionPenalty
  score -= commaCount * 5 + (quoteCount ? 3 : 0)
  if (sentence.length < 45 || sentence.length > 120) score -= 5
  if (tokens.length < 8 || tokens.length > 14) score -= 5

  const qualityScore = Math.max(0, Math.min(100, Math.round(score)))
  if (qualityScore < MIN_QUALITY_SCORE) return { reasons: ['qualityScore'] }
  return { candidate: { score: qualityScore, metrics }, reasons: [] }
}

function incrementRejectionCounts(target: Record<string, number>, reasons: string[]): void {
  for (const reason of reasons) target[reason] = (target[reason] ?? 0) + 1
}

const vocabulary = JSON.parse(await readFile(vocabularyPath, 'utf8')) as WordRecord[]
const words = new Map(vocabulary.map(({ word }) => [word.toLocaleLowerCase(), word.toLocaleLowerCase()]))
const curation = JSON.parse(await readFile(curationPath, 'utf8')) as ContextCuration
const globalRejectIds = new Set(curation.globalReject.map((entry) => entry.sentenceId))
const pairRejectKeys = new Set(curation.pairReject.map((entry) => `${entry.word.toLocaleLowerCase()}::${entry.sentenceId}`))
const source = await readFile(sourcePath, 'utf8')
const lines = source.split(/\r?\n/)
const tokenFrequency = new Map<string, number>()
let totalSourceSentences = 0

for (const line of lines) {
  const columns = line.split('\t')
  if (columns[1] !== 'eng' || !columns[2]) continue
  totalSourceSentences += 1
  const sentence = normalizeSentence(columns[2])
  for (const token of tokenize(sentence)) {
    const key = frequencyKey(token.raw)
    tokenFrequency.set(key, (tokenFrequency.get(key) ?? 0) + 1)
  }
}

const candidates = new Map<string, Candidate[]>()
const rawWords = new Set<string>()
const rejectionCounts: Record<string, number> = {}
let matchedTargetCandidates = 0
let rawCandidatePairs = 0

for (const line of lines) {
  const columns = line.split('\t')
  if (columns[1] !== 'eng' || !columns[2]) continue
  const sentenceId = Number(columns[0])
  if (!Number.isFinite(sentenceId)) continue
  const sourceText = columns[2]
  const sentence = normalizeSentence(sourceText)
  const tokens = tokenize(sentence)
  const targetMatches = tokens.filter((token) => words.has(token.lower))
  if (!targetMatches.length) continue
  matchedTargetCandidates += targetMatches.length

  const passesSourceSanity = tokens.length >= MIN_TOKENS
    && tokens.length <= MAX_EXTENDED_TOKENS
    && sentence.length >= MIN_CHARS
    && sentence.length <= MAX_CHARS
    && /^[A-Za-z"']/.test(sentence)
    && /[.!?]$/.test(sentence)
    && !/[\d<>]|https?:\/\/|www\.|@/.test(sentence)
    && !/[^\x20-\x7E]/.test(sentence)
  if (!passesSourceSanity) {
    const reason = tokens.length < MIN_TOKENS || tokens.length > MAX_EXTENDED_TOKENS || sentence.length < MIN_CHARS || sentence.length > MAX_CHARS ? 'length' : 'sourceSanity'
    incrementRejectionCounts(rejectionCounts, targetMatches.map(() => reason))
    continue
  }

  rawCandidatePairs += targetMatches.length
  for (const targetMatch of targetMatches) {
    const word = words.get(targetMatch.lower)
    if (!word) continue
    rawWords.add(word)
    const matchingTargets = targetMatches.filter((match) => match.lower === targetMatch.lower)
    if (matchingTargets.length !== 1) {
      incrementRejectionCounts(rejectionCounts, ['repeatedTarget'])
      continue
    }
    if (regressionQualityBlacklist.get(word)?.test(sentence)) {
      incrementRejectionCounts(rejectionCounts, ['regressionQuality'])
      continue
    }
    const targetIndex = tokens.indexOf(targetMatch)
    const evaluation = evaluateCandidate(sentence, /[—–]/.test(sourceText), tokens, targetIndex, tokenFrequency)
    if (!evaluation.candidate) {
      incrementRejectionCounts(rejectionCounts, evaluation.reasons)
      continue
    }
    const candidate: Candidate = {
      en: sentence,
      sentenceId,
      score: evaluation.candidate.score,
      metrics: evaluation.candidate.metrics,
    }
    const wordCandidates = candidates.get(word) ?? []
    wordCandidates.push(candidate)
    candidates.set(word, wordCandidates)
  }
}

function compareCandidates(a: Candidate, b: Candidate): number {
  return b.score - a.score || a.en.localeCompare(b.en) || a.sentenceId - b.sentenceId
}

let rejectedCandidateCount = 0
let noFallbackCount = 0
const selectedCandidates = [...candidates.entries()]
  .map(([word, wordCandidates]) => {
    const ranked = [...wordCandidates].sort(compareCandidates)
    const candidate = ranked.find((entry) => {
      const globalRejected = globalRejectIds.has(entry.sentenceId)
      const pairRejected = pairRejectKeys.has(`${word.toLocaleLowerCase()}::${entry.sentenceId}`)
      if (globalRejected || pairRejected) {
        rejectedCandidateCount += 1
        return false
      }
      return true
    })
    if (!candidate) noFallbackCount += 1
    return candidate ? [word, candidate] as const : undefined
  })
  .filter((entry): entry is readonly [string, Candidate] => Boolean(entry))
  .sort(([a], [b]) => a.localeCompare(b))

const selected = Object.fromEntries(selectedCandidates.map(([word, candidate]) => [word, { en: candidate.en } satisfies WordExample]))
const provenance = Object.fromEntries(selectedCandidates.map(([word, candidate]) => [word, {
  sentenceId: candidate.sentenceId,
  source: 'tatoeba-cc0' as const,
  qualityScore: candidate.score,
  ...candidate.metrics,
} satisfies Provenance]))
const rawCandidateCoverage = rawWords.size / vocabulary.length
const qualityApprovedCoverage = selectedCandidates.length / vocabulary.length
const report: ExampleBuildReport = {
  selectorVersion: 'v3-context-quality-curation',
  source: 'Tatoeba English CC0 sentence export',
  sourceFile: 'data-source/examples/tatoeba/eng_sentences_CC0.tsv',
  totalSourceSentences,
  totalVocabularyWords: vocabulary.length,
  matchedTargetCandidates,
  rawCandidatePairs,
  rawCandidateWordCount: rawWords.size,
  selectedCount: selectedCandidates.length,
  rawCandidateCoverage,
  rawCandidateCoveragePercent: Number((rawCandidateCoverage * 100).toFixed(1)),
  qualityApprovedCoverage,
  qualityApprovedCoveragePercent: Number((qualityApprovedCoverage * 100).toFixed(1)),
  rejectionCounts,
  qualityPolicy: {
    tokenRange: [MIN_TOKENS, MAX_TOKENS],
    extendedTokenRange: [19, MAX_EXTENDED_TOKENS],
    preferredTokenRange: [8, 14],
    preferredCharacterRange: [45, 120],
    maxRareContextTokens: MAX_RARE_CONTEXT_TOKENS,
    maxUnknownLikeContextTokens: MAX_UNKNOWN_LIKE_CONTEXT_TOKENS,
    rareFrequencyThreshold: RARE_FREQUENCY_THRESHOLD,
    unknownFrequencyThreshold: UNKNOWN_FREQUENCY_THRESHOLD,
    minimumQualityScore: MIN_QUALITY_SCORE,
  },
  deterministic: true,
  curation: {
    version: curation.version,
    globalRejectCount: curation.globalReject.length,
    pairRejectCount: curation.pairReject.length,
    rejectedCandidateCount,
    noFallbackCount,
  },
}

await writeFile(outputPath, `${JSON.stringify(selected, null, 2)}\n`, 'utf8')
await writeFile(provenancePath, `${JSON.stringify(provenance, null, 2)}\n`, 'utf8')
await writeFile(buildReportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')

console.log(`Example candidates selected: ${selectedCandidates.length} / ${vocabulary.length} (${(qualityApprovedCoverage * 100).toFixed(1)}%)`)
console.log(`Raw candidate coverage: ${rawWords.size} / ${vocabulary.length} (${(rawCandidateCoverage * 100).toFixed(1)}%)`)
console.log(`Durable curation: ${curation.globalReject.length} global rejects, ${curation.pairReject.length} pair rejects; ${rejectedCandidateCount} candidates skipped; ${noFallbackCount} words without a fallback`)
console.log(`Source sentences scanned: ${totalSourceSentences}`)
console.log(`Example source: ${sourcePath}`)
