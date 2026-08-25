import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { parseCsv } from './csv.ts'

interface WordRecord {
  id: string
  word: string
  phonetic?: string
  pos?: string[]
  meaningZh: string[]
  definitionEn?: string[]
  frequency?: { bnc?: number; contemporary?: number }
  examTags: string[]
  source: string
  sourceLicense: string
  examples?: { en: string; zh?: string }[]
}

const root = resolve(import.meta.dirname, '..')
const cet6Path = resolve(root, 'data-source/CET6.txt')
const ecdictPath = process.env.ECDICT_PATH ? resolve(process.env.ECDICT_PATH) : resolve(root, 'data-source/ecdict.cet6.csv')
const outputPath = resolve(root, 'public/data/cet6-vocab.v1.json')
const examplesPath = resolve(root, 'data-source/examples/selected-examples.json')

const cetWords = (await readFile(cet6Path, 'utf8')).split(/\r?\n/).map((word) => word.trim().toLocaleLowerCase()).filter(Boolean)
const uniqueWords = [...new Set(cetWords)]
const rows = parseCsv(await readFile(ecdictPath, 'utf8'))
const header = rows[0] ?? []
const index = (name: string) => header.indexOf(name)
const dictionary = new Map<string, string[]>()
for (const row of rows.slice(1)) dictionary.set((row[index('word')] ?? '').trim().toLocaleLowerCase(), row)
const examples = JSON.parse(await readFile(examplesPath, 'utf8')) as Record<string, { en: string; zh?: string }>

function splitField(value: string | undefined): string[] {
  return (value ?? '')
    .replace(/\\r\\n|\\n|\\r/g, '\n')
    .split(/\r?\n|\s*\/\s*/)
    .map((part) => part.trim())
    .filter(Boolean)
}

const output: WordRecord[] = uniqueWords.map((word) => {
  const row = dictionary.get(word)
  const translation = splitField(row?.[index('translation')])
  const definition = splitField(row?.[index('definition')])
  const sourcePos = splitField(row?.[index('pos')]).map((part) => part.split(':')[0]).filter(Boolean)
  const derivedPos = definition
    .map((part) => part.match(/^([a-z]{1,5})\./i)?.[1]?.toLowerCase())
    .filter((part): part is string => Boolean(part))
  const pos = [...new Set(sourcePos.length ? sourcePos : derivedPos)]
  const bnc = Number(row?.[index('bnc')])
  const frq = Number(row?.[index('frq')])
  const record: WordRecord = {
    id: `cet6-${word.replace(/[^a-z0-9]+/g, '-')}`,
    word,
    meaningZh: translation.length ? translation : ['六级词汇；请结合例句与复习记录掌握'],
    examTags: ['CET6'],
    source: 'OpenEtymology CET6.txt + ECDICT intersection',
    sourceLicense: 'CC BY-SA 4.0 + MIT',
  }
  if (examples[word]?.en) record.examples = [examples[word]]
  if (row?.[index('phonetic')]) record.phonetic = row[index('phonetic')]
  if (pos.length) record.pos = pos
  if (definition.length) record.definitionEn = definition
  if (Number.isFinite(bnc) || Number.isFinite(frq)) record.frequency = { ...(Number.isFinite(bnc) ? { bnc } : {}), ...(Number.isFinite(frq) ? { contemporary: frq } : {}) }
  return record
})

await mkdir(resolve(root, 'public/data'), { recursive: true })
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8')
console.log(`Built ${output.length} CET-6 words at ${outputPath}`)
