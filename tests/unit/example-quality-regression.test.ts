import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

interface Example { en: string; zh?: string }
interface Word { word: string; examples?: Example[] }
interface Provenance { sentenceId: number; source: string; qualityScore: number }
interface BuildReport { selectedCount: number; qualityApprovedCoverage: number; deterministic: boolean; qualityPolicy: { minimumQualityScore: number } }
interface ReviewRow { word: string; sentenceId: number; decision: 'pass' | 'reject'; rationale: string; reviewBasis: string; severeInappropriate: boolean }
interface ReviewDocument { seed?: number; sampleSize?: number; rows: ReviewRow[] }
interface FinalAcceptance { source: { wordCount: number; source: string; license: string }; phaseA: { final: { sampleSize: number; passRatePercent: number; severeInappropriateCount: number } }; blindValidation: { final: { sampleSize: number; passRatePercent: number; severeInappropriateCount: number } }; curation: { pairRejectCount: number }; gates: Record<string, boolean> }

const root = resolve(process.cwd())
const vocab = JSON.parse(readFileSync(resolve(root, 'public/data/cet6-vocab.v1.json'), 'utf8')) as Word[]
const selected = JSON.parse(readFileSync(resolve(root, 'data-source/examples/selected-examples.json'), 'utf8')) as Record<string, Example>
const provenance = JSON.parse(readFileSync(resolve(root, 'data-source/examples/example-provenance.json'), 'utf8')) as Record<string, Provenance>
const buildReport = JSON.parse(readFileSync(resolve(root, 'data-source/examples/build-report.json'), 'utf8')) as BuildReport
const finalAcceptance = JSON.parse(readFileSync(resolve(root, 'audit/v1.3-context-final-semantic/final-semantic-acceptance.json'), 'utf8')) as FinalAcceptance
const humanPass1 = JSON.parse(readFileSync(resolve(root, 'audit/v1.3-context-human-quality/random-semantic-review-pass1.json'), 'utf8')) as ReviewDocument
const humanIndependent = JSON.parse(readFileSync(resolve(root, 'audit/v1.3-context-human-quality/independent-validation.json'), 'utf8')) as ReviewDocument
const curation = JSON.parse(readFileSync(resolve(root, 'data-source/examples/context-curation.json'), 'utf8')) as { version: number; globalReject: Array<{ sentenceId: number }>; pairReject: Array<{ word: string; sentenceId: number }> }
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
  'data-source/examples/context-curation.json',
  'audit/v1.3-context-human-quality/final-context-quality-report.json',
  'audit/v1.3-context-human-quality/risk-targeted-review.json',
  'audit/v1.3-context-human-quality/random-semantic-review-pass1.json',
  'audit/v1.3-context-human-quality/independent-validation.json',
  'audit/v1.3-context-final-semantic/final-semantic-acceptance.json',
]

function hashes(): Record<string, string> {
  return Object.fromEntries(generatedFiles.map((file) => [file, createHash('sha256').update(readFileSync(resolve(root, file))).digest('hex')]))
}

describe('Context human quality audit and curation R4', () => {
  it('keeps truthful coverage, provenance, and the Round 5 semantic gates', () => {
    const covered = vocab.filter((word) => word.examples?.length)
    expect(buildReport.qualityApprovedCoverage).toBeGreaterThan(0)
    expect(covered.length).toBe(buildReport.selectedCount)
    expect(Object.keys(selected)).toHaveLength(covered.length)
    expect(Object.keys(provenance)).toHaveLength(covered.length)
    expect(finalAcceptance.source.wordCount).toBe(2219)
    expect(finalAcceptance.source.source).toContain('Tatoeba')
    expect(finalAcceptance.source.license).toContain('CC0')
    expect(finalAcceptance.phaseA.final.sampleSize).toBeGreaterThanOrEqual(300)
    expect(finalAcceptance.phaseA.final.passRatePercent).toBeGreaterThanOrEqual(95)
    expect(finalAcceptance.phaseA.final.severeInappropriateCount).toBe(0)
    expect(finalAcceptance.blindValidation.final.sampleSize).toBe(100)
    expect(finalAcceptance.blindValidation.final.passRatePercent).toBeGreaterThanOrEqual(99)
    expect(finalAcceptance.blindValidation.final.severeInappropriateCount).toBe(0)
    expect(finalAcceptance.curation.pairRejectCount).toBeGreaterThan(0)
    expect(Object.values(finalAcceptance.gates).every(Boolean)).toBe(true)
    expect(curation.version).toBe(1)
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

  it('keeps the discovered regression sentences out of the R4 selection and curation', () => {
    const regressionWords = ['abrupt', 'absence', 'abstract', 'absurd', 'accord', 'account', 'accuse', 'acute', 'addition', 'adjacent', 'adolescent']
    for (const word of regressionWords) {
      const example = selected[word]?.en
      if (!example) continue
      expect(regressionBadSentences.some((pattern) => pattern.test(example))).toBe(false)
    }
    const regressionPairs = [['stab', 13035646], ['appropriate', 11844548], ['execute', 11765250], ['formidable', 12807976], ['peak', 8908904], ['petition', 12045723], ['liable', 11129769]] as const
    for (const [word, sentenceId] of regressionPairs) {
      expect(provenance[word]?.sentenceId).not.toBe(sentenceId)
      expect(curation.globalReject.some((entry) => entry.sentenceId === sentenceId) || curation.pairReject.some((entry) => entry.word === word && entry.sentenceId === sentenceId)).toBe(true)
    }
  })

  it('keeps independent validation genuinely separate from pass 1', () => {
    const pass1Keys = new Set(humanPass1.rows.map((row) => `${row.word}|${row.sentenceId}`))
    expect(humanIndependent.rows.some((row) => pass1Keys.has(`${row.word}|${row.sentenceId}`))).toBe(false)
    expect(humanIndependent.rows.every((row) => row.reviewBasis === 'sentence-read-semantic-rubric' && row.rationale.trim())).toBe(true)
  })

  it('rebuilds the example and audit artifacts deterministically', () => {
    const before = hashes()
    execFileSync(process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm', ['examples:build'], { cwd: root, stdio: 'ignore', shell: process.platform === 'win32' })
    expect(hashes()).toEqual(before)
    expect(buildReport.deterministic).toBe(true)
  })
})
