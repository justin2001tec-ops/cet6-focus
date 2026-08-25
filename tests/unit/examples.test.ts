import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

interface WordExample { en: string; zh?: string }
interface Word { word: string; examples?: WordExample[] }
interface Provenance { sentenceId: number; source: string }
interface CurationReject { word?: string; sentenceId: number }
interface BuildReport { selectedCount: number; curation: { rejectedCandidateCount: number; noFallbackCount: number } }

const root = resolve(process.cwd())
const words = JSON.parse(readFileSync(resolve(root, 'public/data/cet6-vocab.v1.json'), 'utf8')) as Word[]
const manifest = JSON.parse(readFileSync(resolve(root, 'data-source/examples/manifest.json'), 'utf8')) as { source: string; license: string; sourceUrl: string }
const selected = JSON.parse(readFileSync(resolve(root, 'data-source/examples/selected-examples.json'), 'utf8')) as Record<string, WordExample>
const provenance = JSON.parse(readFileSync(resolve(root, 'data-source/examples/example-provenance.json'), 'utf8')) as Record<string, Provenance>
const curation = JSON.parse(readFileSync(resolve(root, 'data-source/examples/context-curation.json'), 'utf8')) as { version: number; globalReject: CurationReject[]; pairReject: CurationReject[] }
const buildReport = JSON.parse(readFileSync(resolve(root, 'data-source/examples/build-report.json'), 'utf8')) as BuildReport

describe('offline formal example corpus', () => {
  it('keeps the frozen 2219-word vocabulary and reports truthful Round 5 coverage', () => {
    const covered = words.filter((word) => word.examples?.length)
    expect(words).toHaveLength(2219)
    expect(covered.length / words.length).toBeGreaterThan(0)
    expect(covered.length).toBeGreaterThan(0)
  })

  it('ships traceable English-only examples without fixtures or fabricated translations', () => {
    const examples = words.flatMap((word) => word.examples ?? [])
    expect(manifest.source).toContain('Tatoeba')
    expect(manifest.license).toContain('CC0')
    expect(manifest.sourceUrl).toContain('tatoeba.org')
    expect(examples.length).toBeGreaterThan(0)
    expect(examples.every((example) => example.en.trim() && !example.zh && !/test fixture|不背单词/i.test(example.en))).toBe(true)
  })

  it('keeps every durable global and pair rejection out of the selected pool', () => {
    expect(curation.version).toBe(1)
    for (const reject of curation.globalReject) {
      expect(Object.values(provenance).some((trace) => trace.sentenceId === reject.sentenceId)).toBe(false)
    }
    for (const reject of curation.pairReject) {
      if (reject.word) expect(provenance[reject.word]?.sentenceId).not.toBe(reject.sentenceId)
    }
    expect(Object.keys(selected)).toHaveLength(Object.keys(provenance).length)
    expect(buildReport.selectedCount).toBe(Object.keys(selected).length)
    expect(buildReport.curation.rejectedCandidateCount).toBeGreaterThan(0)
    expect(buildReport.curation.noFallbackCount).toBeGreaterThan(0)
  })
})
