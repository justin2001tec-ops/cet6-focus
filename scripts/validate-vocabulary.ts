import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

interface WordRecord { id: string; word: string; meaningZh: string[]; phonetic?: string; pos?: string[]; definitionEn?: string[] }
const root = resolve(import.meta.dirname, '..')
const path = resolve(root, 'public/data/cet6-vocab.v1.json')
const words = JSON.parse(await readFile(path, 'utf8')) as WordRecord[]
const ids = new Set<string>()
const spellings = new Set<string>()
const problems: string[] = []
let missingMeaning = 0
let missingPhonetic = 0
let missingPos = 0
let missingDefinition = 0
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
  if (word.meaningZh?.some((meaning) => /\\[nr]/.test(meaning)) || word.definitionEn?.some((definition) => /\\[nr]/.test(definition))) problems.push(`escaped line break: ${word.word}`)
  if (word.phonetic?.includes('<')) problems.push(`suspicious phonetic: ${word.word}`)
  ids.add(word.id)
  spellings.add(word.word)
}
if (words.length < 2000) problems.push(`word count below expected CET6 range: ${words.length}`)
if (problems.length) {
  console.error(`Vocabulary report: total=${words.length}; missingMeaning=${missingMeaning}; missingPhonetic=${missingPhonetic}; missingPos=${missingPos}; missingDefinition=${missingDefinition}`)
  console.error(problems.join('\n'))
  process.exit(1)
}
console.log(`Vocabulary OK: ${words.length} unique CET-6 entries; missingMeaning=${missingMeaning}; missingPhonetic=${missingPhonetic}; missingPos=${missingPos}; missingDefinition=${missingDefinition}`)
