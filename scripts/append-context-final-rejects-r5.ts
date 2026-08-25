import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

interface ReviewRow {
  word: string
  sentenceId: number
  sentence: string
  decision: 'pass' | 'reject'
  categories: string[]
  rationale: string
  reviewType?: string
}
interface ReviewDocument { rows: ReviewRow[] }
interface RejectEntry {
  word?: string
  sentenceId: number
  categories: string[]
  reason: string
  round?: number
  reviewer?: string
  reviewType?: string
}
interface Curation { version: number; globalReject: RejectEntry[]; pairReject: RejectEntry[] }

const root = resolve(import.meta.dirname, '..')
const auditRoot = resolve(root, 'audit/v1.3-context-final-semantic')
const reviewFile = process.argv[2] ?? 'phase-a-post-curation-review.json'
const deltaFile = process.argv[3] ?? 'curation-delta-r5-post.json'
const reviewLabel = process.argv[4] ?? 'Round 5 post-curation sentence-read review'
const review = JSON.parse(await readFile(resolve(auditRoot, reviewFile), 'utf8')) as ReviewDocument
const curationPath = resolve(root, 'data-source/examples/context-curation.json')
const selectedPath = resolve(root, 'data-source/examples/selected-examples.json')
const provenancePath = resolve(root, 'data-source/examples/example-provenance.json')
const curation = JSON.parse(await readFile(curationPath, 'utf8')) as Curation
const selected = JSON.parse(await readFile(selectedPath, 'utf8')) as Record<string, { en: string }>
const provenance = JSON.parse(await readFile(provenancePath, 'utf8')) as Record<string, { sentenceId: number }>
const beforeGlobal = curation.globalReject.length
const beforePair = curation.pairReject.length
const existingPairs = new Set(curation.pairReject.map((entry) => `${entry.word?.toLocaleLowerCase()}::${entry.sentenceId}`))
const existingGlobal = new Set(curation.globalReject.map((entry) => entry.sentenceId))
const rejectedRows = review.rows.filter((row) => row.decision === 'reject')
const appended: Array<RejectEntry & { word: string }> = []

for (const row of rejectedRows) {
  if (!selected[row.word] || provenance[row.word]?.sentenceId !== row.sentenceId) {
    throw new Error(`R5 reviewed pair is not currently selected: ${row.word}|${row.sentenceId}`)
  }
  const pairKey = `${row.word.toLocaleLowerCase()}::${row.sentenceId}`
  if (existingGlobal.has(row.sentenceId) || existingPairs.has(pairKey)) continue
  const entry = {
    word: row.word,
    sentenceId: row.sentenceId,
    categories: row.categories,
    reason: row.rationale,
    round: 5,
    reviewer: 'Lula-agent',
    reviewType: row.reviewType ?? reviewLabel,
  }
  curation.pairReject.push(entry)
  existingPairs.add(pairKey)
  appended.push(entry)
}

curation.pairReject.sort((a, b) => String(a.word).localeCompare(String(b.word)) || a.sentenceId - b.sentenceId)
await writeFile(curationPath, `${JSON.stringify(curation, null, 2)}\n`, 'utf8')
await writeFile(resolve(auditRoot, deltaFile), `${JSON.stringify({
  round: 5,
  source: reviewLabel,
  reviewed: review.rows.length,
  rejectCount: rejectedRows.length,
  severeInappropriateCount: review.rows.filter((row) => (row as ReviewRow & { severeInappropriate?: boolean }).severeInappropriate === true).length,
  appendedCount: appended.length,
  appended,
  before: { globalRejectCount: beforeGlobal, pairRejectCount: beforePair },
  after: { globalRejectCount: curation.globalReject.length, pairRejectCount: curation.pairReject.length },
  noReplacementAuthored: true,
}, null, 2)}\n`, 'utf8')

console.log(`Round 5 durable curation appended=${appended.length}; reviewed=${review.rows.length}; rejects=${rejectedRows.length}; global=${curation.globalReject.length}; pair=${curation.pairReject.length}`)
