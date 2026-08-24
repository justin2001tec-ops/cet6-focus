import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

interface WordRecord {
  word: string
}

interface WordExample {
  en: string
}

interface Candidate extends WordExample {
  score: number
}

const root = resolve(import.meta.dirname, '..')
const vocabularyPath = resolve(root, 'public/data/cet6-vocab.v1.json')
const sourcePath = resolve(root, 'data-source/examples/tatoeba/eng_sentences_CC0.tsv')
const outputPath = resolve(root, 'data-source/examples/selected-examples.json')

const vocabulary = JSON.parse(await readFile(vocabularyPath, 'utf8')) as WordRecord[]
const words = new Map(vocabulary.map(({ word }) => [word.toLocaleLowerCase(), word.toLocaleLowerCase()]))
const candidates = new Map<string, Candidate>()
const blockedContent = /\b(?:porn|pornography|nude|nudity|sex|sexual|sexy|rape|rapist|fuck|fucking|shit|bitch|cunt|whore|slut|nigger|nigga|suicide|terrorist|terrorism|murder|murderer|kill|killed|killing|bloodshed|weapon|bomb|bombing|drown|drowned|drowning|death|died|dying|abortion|abuse|abused|abusing|trans|gay|lesbian|lgbt|drag|racist|racism|racial|slavery|slave|war|shoot|shooting|gun|guns|politic|political|election|conservative|liberal|trump|biden|taiwan|russia|ukraine|israel|palestine|immigrant|immigration|refugee|god|jesus|catholic)\b/i
const tokenPattern = /[a-z]+(?:['-][a-z]+)*/gi

function normalizeSentence(value: string): string {
  return value
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/—/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
}

function scoreSentence(sentence: string, tokens: string[], targetIndex: number): number {
  const tokenDistance = Math.abs(tokens.length - 14)
  const characterDistance = Math.abs(sentence.length - 88) / 8
  const edgePenalty = targetIndex === 0 || targetIndex === tokens.length - 1 ? 1.5 : 0
  const punctuationPenalty = /[;:()[\]{}]/.test(sentence) ? 1 : 0
  return tokenDistance * 2 + characterDistance + edgePenalty + punctuationPenalty
}

for (const line of (await readFile(sourcePath, 'utf8')).split(/\r?\n/)) {
  const columns = line.split('\t')
  if (columns[1] !== 'eng' || !columns[2]) continue

  const sentence = normalizeSentence(columns[2])
  const tokens = sentence.match(tokenPattern)?.map((token) => token.toLocaleLowerCase()) ?? []
  if (tokens.length < 7 || tokens.length > 24) continue
  if (sentence.length < 28 || sentence.length > 180) continue
  if (!/^[A-Za-z]/.test(sentence) || !/[.!?]$/.test(sentence)) continue
  if (/[\d<>]|https?:\/\/|www\.|@/.test(sentence) || /[^\x20-\x7E]/.test(sentence) || blockedContent.test(sentence)) continue

  const seen = new Set<string>()
  tokens.forEach((token, targetIndex) => {
    const word = words.get(token)
    if (!word || seen.has(word) || tokens.filter((item) => item === token).length !== 1) return
    seen.add(word)
    const candidate: Candidate = { en: sentence, score: scoreSentence(sentence, tokens, targetIndex) }
    const previous = candidates.get(word)
    if (!previous || candidate.score < previous.score || (candidate.score === previous.score && candidate.en < previous.en)) {
      candidates.set(word, candidate)
    }
  })
}

const selected = Object.fromEntries([...candidates.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([word, candidate]) => [word, { en: candidate.en } satisfies WordExample]))
await writeFile(outputPath, `${JSON.stringify(selected, null, 2)}\n`, 'utf8')

console.log(`Example candidates selected: ${Object.keys(selected).length} / ${vocabulary.length} (${((Object.keys(selected).length / vocabulary.length) * 100).toFixed(1)}%)`)
console.log(`Example source: ${sourcePath}`)
