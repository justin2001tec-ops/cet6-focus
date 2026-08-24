import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

interface WordExample { en: string; zh?: string }
interface WordRecord { id: string; word: string; meaningZh: string[]; phonetic?: string; pos?: string[]; definitionEn?: string[]; examples?: WordExample[] }
interface ExampleManifest { source: string; sourceUrl: string; license: string; licenseUrl: string; attribution: string }
const root = resolve(import.meta.dirname, '..')
const path = resolve(root, 'public/data/cet6-vocab.v1.json')
const manifestPath = resolve(root, 'data-source/examples/manifest.json')
const words = JSON.parse(await readFile(path, 'utf8')) as WordRecord[]
const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as ExampleManifest
const ids = new Set<string>()
const spellings = new Set<string>()
const problems: string[] = []
let missingMeaning = 0
let missingPhonetic = 0
let missingPos = 0
let missingDefinition = 0
let exampleCoverage = 0
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
  if (word.examples?.length) {
    exampleCoverage += 1
    if (word.examples.length !== 1) problems.push(`expected one selected example: ${word.word}`)
    for (const example of word.examples) {
      if (!example.en?.trim()) problems.push(`empty example: ${word.word}`)
      if (/test fixture|不背单词/i.test(example.en)) problems.push(`fixture-like example: ${word.word}`)
      if (example.zh?.trim()) problems.push(`unlicensed example translation: ${word.word}`)
    }
  }
  if (word.meaningZh?.some((meaning) => /\\[nr]/.test(meaning)) || word.definitionEn?.some((definition) => /\\[nr]/.test(definition))) problems.push(`escaped line break: ${word.word}`)
  if (word.phonetic?.includes('<')) problems.push(`suspicious phonetic: ${word.word}`)
  ids.add(word.id)
  spellings.add(word.word)
}
if (words.length < 2000) problems.push(`word count below expected CET6 range: ${words.length}`)
if (words.length !== 2219) problems.push(`word count must remain 2219: ${words.length}`)
if (!manifest.source || !manifest.sourceUrl || !manifest.license || !manifest.licenseUrl || !manifest.attribution) problems.push('example source manifest is incomplete')
if (exampleCoverage / words.length < 0.6) problems.push(`example coverage below 60%: ${exampleCoverage}/${words.length}`)
if (problems.length) {
  console.error(`Vocabulary report: total=${words.length}; missingMeaning=${missingMeaning}; missingPhonetic=${missingPhonetic}; missingPos=${missingPos}; missingDefinition=${missingDefinition}`)
  console.error(`exampleCoverage = ${exampleCoverage} / ${words.length}`)
  console.error(`exampleCoveragePercent = ${((exampleCoverage / words.length) * 100).toFixed(1)}%`)
  console.error(`exampleSource = ${manifest.source}`)
  console.error(`license = ${manifest.license}`)
  console.error(problems.join('\n'))
  process.exit(1)
}
console.log(`Vocabulary OK: ${words.length} unique CET-6 entries; missingMeaning=${missingMeaning}; missingPhonetic=${missingPhonetic}; missingPos=${missingPos}; missingDefinition=${missingDefinition}`)
console.log(`exampleCoverage = ${exampleCoverage} / ${words.length}`)
console.log(`exampleCoveragePercent = ${((exampleCoverage / words.length) * 100).toFixed(1)}%`)
console.log(`exampleSource = ${manifest.source}`)
console.log(`license = ${manifest.license}`)
