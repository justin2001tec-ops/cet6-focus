import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

interface Example { en: string; zh?: string }
interface Word { word: string; examples?: Example[] }
interface Provenance { sentenceId: number; source: string; qualityScore: number }
interface BuildReport { selectedCount: number; qualityApprovedCoverage: number; deterministic: boolean; qualityPolicy: { minimumQualityScore: number } }
interface AuditReport { audit: { sampleSize: number; sampleQualityPassRate: number; severeInappropriateSampleCount: number; provenanceCoverage: number } }

const root = resolve(process.cwd())
const vocab = JSON.parse(readFileSync(resolve(root, 'public/data/cet6-vocab.v1.json'), 'utf8')) as Word[]
const selected = JSON.parse(readFileSync(resolve(root, 'data-source/examples/selected-examples.json'), 'utf8')) as Record<string, Example>
const provenance = JSON.parse(readFileSync(resolve(root, 'data-source/examples/example-provenance.json'), 'utf8')) as Record<string, Provenance>
const buildReport = JSON.parse(readFileSync(resolve(root, 'data-source/examples/build-report.json'), 'utf8')) as BuildReport
const auditReport = JSON.parse(readFileSync(resolve(root, 'audit/v1.3-context-quality/context-quality-build-report.json'), 'utf8')) as AuditReport
const manifest = JSON.parse(readFileSync(resolve(root, 'data-source/examples/manifest.json'), 'utf8')) as { source: string; license: string; sourceUrl: string }
const tokenPattern = /[A-Za-z]+(?:['-][a-z]+)*/gi
const regressionBadSentences = [
  /free markets|limited government|horrifying/i,
  /pollock|krasner|abstract expressionism/i,
  /conspirac|rights groups|amnesty/i,
  /government|immigrant|murderous|mafia|dissent|politically/i,
  /hemorrhoid|ointment|lard/i,
  /flag|mengele|disease|dataset|oscar|galileo/i,
  /hiv|aids/i,
]
const generatedFiles = [
  'data-source/examples/selected-examples.json',
  'data-source/examples/example-provenance.json',
  'data-source/examples/build-report.json',
  'audit/v1.3-context-quality/context-quality-build-report.json',
  'audit/v1.3-context-quality/context-quality-sample.json',
  'audit/v1.3-context-quality/context-quality-sample.csv',
  'audit/v1.3-context-quality/context-quality-summary.md',
  'audit/v1.3-context-quality/regression-examples.md',
]

function hashes(): Record<string, string> {
  return Object.fromEntries(generatedFiles.map((file) => [file, createHash('sha256').update(readFileSync(resolve(root, file))).digest('hex')]))
}

describe('Context quality refinement R3', () => {
  it('keeps quality-approved coverage, provenance, and the five audit gates', () => {
    const covered = vocab.filter((word) => word.examples?.length)
    expect(buildReport.qualityApprovedCoverage).toBeGreaterThanOrEqual(0.6)
    expect(covered.length).toBe(buildReport.selectedCount)
    expect(Object.keys(selected)).toHaveLength(covered.length)
    expect(Object.keys(provenance)).toHaveLength(covered.length)
    expect(auditReport.audit.sampleSize).toBeGreaterThanOrEqual(200)
    expect(auditReport.audit.sampleQualityPassRate).toBeGreaterThanOrEqual(90)
    expect(auditReport.audit.severeInappropriateSampleCount).toBe(0)
    expect(auditReport.audit.provenanceCoverage).toBe(1)
  })

  it('keeps every shipped example source-traceable, English-only, and exact-match', () => {
    for (const word of vocab) {
      for (const example of word.examples ?? []) {
        const tokens = example.en.match(tokenPattern)?.map((token) => token.toLocaleLowerCase()) ?? []
        expect(tokens.filter((token) => token === word.word.toLocaleLowerCase())).toHaveLength(1)
        expect(tokens.length).toBeGreaterThanOrEqual(6)
        expect(tokens.length).toBeLessThanOrEqual(20)
        expect(example.en).not.toMatch(/[\d<>]|https?:\/\/|www\.|@/i)
        expect(example.en).not.toMatch(/test fixture|不背单词/i)
        expect(example.zh).toBeUndefined()
        expect(provenance[word.word]).toMatchObject({ source: 'tatoeba-cc0' })
        expect(provenance[word.word].sentenceId).toBeGreaterThan(0)
        expect(provenance[word.word].qualityScore).toBeGreaterThanOrEqual(buildReport.qualityPolicy.minimumQualityScore)
      }
    }
    expect(manifest.source).toContain('Tatoeba')
    expect(manifest.license).toContain('CC0')
    expect(manifest.sourceUrl).toContain('tatoeba.org')
  })

  it('keeps the discovered regression sentences out of the R3 selection', () => {
    const regressionWords = ['abrupt', 'absence', 'abstract', 'absurd', 'accord', 'account', 'accuse', 'acute', 'addition', 'adjacent', 'adolescent']
    for (const word of regressionWords) {
      const example = selected[word]?.en
      if (!example) continue
      expect(regressionBadSentences.some((pattern) => pattern.test(example))).toBe(false)
    }
  })

  it('rebuilds the example and audit artifacts deterministically', () => {
    const before = hashes()
    execFileSync(process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm', ['examples:build'], { cwd: root, stdio: 'ignore', shell: process.platform === 'win32' })
    expect(hashes()).toEqual(before)
    expect(buildReport.deterministic).toBe(true)
  })
})
