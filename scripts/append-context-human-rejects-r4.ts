import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

type Reject = { word?: string; sentenceId: number; categories: string[]; reason: string }
const root = resolve(import.meta.dirname, '..')
const path = resolve(root, 'data-source/examples/context-curation.json')
const selectedPath = resolve(root, 'data-source/examples/selected-examples.json')
const provenancePath = resolve(root, 'data-source/examples/example-provenance.json')
const curation = JSON.parse(await readFile(path, 'utf8')) as { globalReject: Reject[]; pairReject: Reject[] }
const selected = JSON.parse(await readFile(selectedPath, 'utf8')) as Record<string, { en: string }>
const provenance = JSON.parse(await readFile(provenancePath, 'utf8')) as Record<string, { sentenceId: number }>
const reasons: Record<string, string> = {
  hate: 'The sentence contains an identity-based generalization or hateful conflict that is not needed for teaching.',
  extremism: 'The sentence requires extremist or Nazi-related context that is not necessary to teach the target word.',
  'political-heavy': 'The sentence depends on a politically charged dispute or institutional background that is unnecessary for the target word.',
  sexual: 'The sentence contains sexual or explicit material that is not appropriate as a default learning context.',
  'medical-heavy': 'The sentence makes the learner process unnecessary medical detail instead of the target word.',
  'public-controversy': 'The sentence depends on a public-figure or culture-war controversy that is unnecessary for the target word.',
  'proper-noun-heavy': 'The proper names or named institutions create unnecessary cognitive load for this target word.',
  'weak-teaching-value': 'The target word is incidental, ambiguous, or too weakly illustrated to justify the context burden.',
  'religious-heavy': 'The sentence depends on a religious controversy or background that is unnecessary for the target word.',
}
const specs = `
concise|12125475|proper-noun-heavy,weak-teaching-value
congress|11997364|political-heavy,proper-noun-heavy
constitution|11559028|political-heavy,proper-noun-heavy
convert|6119151|religious-heavy
hatred|10538183|hate,religious-heavy
occupation|8622832|extremism,political-heavy
prominent|8931349|proper-noun-heavy,political-heavy
propaganda|10095186|political-heavy
racial|11266415|sexual,political-heavy
supreme|11732902|political-heavy
victim|12134940|hate,public-controversy
violent|11789212|medical-heavy,violence
`.trim().split(/\r?\n/).filter(Boolean)
const globals = new Set(curation.globalReject.map((entry) => entry.sentenceId))
const pairs = new Set(curation.pairReject.map((entry) => `${entry.word}::${entry.sentenceId}`))
for (const line of specs) {
  const [word, sentenceIdText, categoriesText] = line.split('|')
  const sentenceId = Number(sentenceIdText)
  if (!selected[word] || provenance[word]?.sentenceId !== sentenceId) { console.log(`Skip no-longer-selected pair: ${word}/${sentenceId}`); continue }
  if (globals.has(sentenceId) || pairs.has(`${word}::${sentenceId}`)) continue
  const categories = categoriesText.split(',')
  curation.pairReject.push({ word, sentenceId, categories, reason: categories.map((category) => reasons[category] ?? `The sentence fails the ${category} semantic review dimension.`).join(' ') })
}
curation.pairReject.sort((a, b) => String(a.word).localeCompare(String(b.word)) || a.sentenceId - b.sentenceId)
await writeFile(path, `${JSON.stringify(curation, null, 2)}\n`, 'utf8')
console.log(`Added ${specs.length} Round 4 final semantic rejects.`)
