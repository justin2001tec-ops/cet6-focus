import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { parseCsv, csvEscape } from './csv.ts'

const root = resolve(import.meta.dirname, '..')
const cet6Path = resolve(root, 'data-source/CET6.txt')
const fullPath = process.env.ECDICT_PATH ? resolve(process.env.ECDICT_PATH) : resolve(root, '../..', 'work/source/ECDICT/ecdict.csv')
const outputPath = resolve(root, 'data-source/ecdict.cet6.csv')

const words = new Set((await readFile(cet6Path, 'utf8')).split(/\r?\n/).map((word) => word.trim().toLocaleLowerCase()).filter(Boolean))
const rows = parseCsv(await readFile(fullPath, 'utf8'))
const header = rows[0]
if (!header || header[0] !== 'word') throw new Error('ECDICT CSV header not found')
const wordIndex = header.indexOf('word')
const selected = rows.slice(1).filter((row) => words.has((row[wordIndex] ?? '').trim().toLocaleLowerCase()))
await mkdir(resolve(root, 'data-source'), { recursive: true })
await writeFile(outputPath, `${header.map(csvEscape).join(',')}\n${selected.map((row) => row.map((value) => csvEscape(value ?? '')).join(',')).join('\n')}\n`, 'utf8')
console.log(`Extracted ${selected.length} ECDICT rows to ${outputPath}`)
