import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

interface WordExample { en: string; zh?: string }
interface Word { word: string; examples?: WordExample[] }

const root = resolve(process.cwd())
const words = JSON.parse(readFileSync(resolve(root, 'public/data/cet6-vocab.v1.json'), 'utf8')) as Word[]
const manifest = JSON.parse(readFileSync(resolve(root, 'data-source/examples/manifest.json'), 'utf8')) as { source: string; license: string; sourceUrl: string }

describe('offline formal example corpus', () => {
  it('keeps the frozen 2219-word vocabulary and clears the R3 quality coverage gate', () => {
    const covered = words.filter((word) => word.examples?.length)
    expect(words).toHaveLength(2219)
    expect(covered.length / words.length).toBeGreaterThanOrEqual(0.6)
    expect(covered.length).toBeGreaterThanOrEqual(1332)
  })

  it('ships traceable English-only examples without fixtures or fabricated translations', () => {
    const examples = words.flatMap((word) => word.examples ?? [])
    expect(manifest.source).toContain('Tatoeba')
    expect(manifest.license).toContain('CC0')
    expect(manifest.sourceUrl).toContain('tatoeba.org')
    expect(examples.length).toBeGreaterThan(0)
    expect(examples.every((example) => example.en.trim() && !example.zh && !/test fixture|不背单词/i.test(example.en))).toBe(true)
  })
})
