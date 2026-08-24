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
const reasonByCategory: Record<string, string> = {
  violence: 'The sentence adds unnecessary violence, weapons, threats, or graphic harm to a default learning context.',
  extremism: 'The sentence requires extremist or Nazi-related context that is not necessary to teach the target word.',
  sexual: 'The sentence contains sexual or explicit material that is not appropriate as a default learning context.',
  'medical-heavy': 'The sentence makes the learner process unnecessary medical detail instead of the target word.',
  'political-heavy': 'The sentence depends on a politically charged dispute or institutional background that is unnecessary for the target word.',
  'religious-heavy': 'The sentence depends on a religious controversy or background that is unnecessary for the target word.',
  hate: 'The sentence contains an identity-based generalization or hateful conflict that is not needed for teaching.',
  'public-controversy': 'The sentence depends on a current public-figure or culture-war controversy that is unnecessary for the target word.',
  'proper-noun-heavy': 'The proper names or named institutions create unnecessary cognitive load for this target word.',
  'weak-teaching-value': 'The target word is incidental, ambiguous, or too weakly illustrated to justify the context burden.',
}
const specs = `
author|11559218|public-controversy
cocaine|10280164|medical-heavy
commit|11563914|violence
concise|12125475|proper-noun-heavy,weak-teaching-value
congress|11997364|political-heavy,proper-noun-heavy
conservative|11523859|political-heavy,public-controversy
constitution|11559028|political-heavy,proper-noun-heavy
convert|6119151|religious-heavy
drag|11844546|sexual,political-heavy
explicit|12029263|sexual
hatred|9635725|hate,extremism
internal|11610553|medical-heavy
occupation|8622834|extremism,political-heavy
propaganda|9323488|political-heavy
priest|9936800|religious-heavy
racial|10161553|hate
supreme|11890020|political-heavy
tolerant|11899402|religious-heavy,political-heavy
victim|11541533|public-controversy
violent|9635788|violence,political-heavy
vast|12013682|political-heavy
`.trim().split(/\r?\n/).filter(Boolean)
const globals = new Set(curation.globalReject.map((entry) => entry.sentenceId))
const pairs = new Set(curation.pairReject.map((entry) => `${entry.word}::${entry.sentenceId}`))
for (const line of specs) {
  const [word, sentenceIdText, categoryText] = line.split('|')
  const sentenceId = Number(sentenceIdText)
  if (!selected[word] || provenance[word]?.sentenceId !== sentenceId) { console.log(`Skip no-longer-selected pair: ${word}/${sentenceId}`); continue }
  if (globals.has(sentenceId) || pairs.has(`${word}::${sentenceId}`)) continue
  const categories = categoryText.split(',')
  curation.pairReject.push({ word, sentenceId, categories, reason: categories.map((category) => reasonByCategory[category] ?? `The sentence fails the ${category} semantic review dimension.`).join(' ') })
}
curation.pairReject.sort((a, b) => String(a.word).localeCompare(String(b.word)) || a.sentenceId - b.sentenceId)
await writeFile(path, `${JSON.stringify(curation, null, 2)}\n`, 'utf8')
console.log(`Added Round 4 final semantic rejects from ${specs.length} reviewed rows.`)
