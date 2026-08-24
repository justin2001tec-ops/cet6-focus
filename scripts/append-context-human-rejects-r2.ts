import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

type Reject = { word?: string; sentenceId: number; categories: string[]; reason: string }
const root = resolve(import.meta.dirname, '..')
const curationPath = resolve(root, 'data-source/examples/context-curation.json')
const selectedPath = resolve(root, 'data-source/examples/selected-examples.json')
const provenancePath = resolve(root, 'data-source/examples/example-provenance.json')
const curation = JSON.parse(await readFile(curationPath, 'utf8')) as { globalReject: Reject[]; pairReject: Reject[] }
const selected = JSON.parse(await readFile(selectedPath, 'utf8')) as Record<string, { en: string }>
const provenance = JSON.parse(await readFile(provenancePath, 'utf8')) as Record<string, { sentenceId: number }>
const reasonByCategory: Record<string, string> = {
  violence: 'The sentence adds unnecessary violence, weapons, threats, or graphic harm to a default learning context.',
  extremism: 'The sentence requires extremist or Nazi-related context that is not necessary to teach the target word.',
  sexual: 'The sentence contains sexual or explicit material that is not appropriate as a default learning context.',
  'medical-heavy': 'The sentence makes the learner process unnecessary medical detail instead of the target word.',
  'political-heavy': 'The sentence depends on a politically charged dispute or institutional background that is unnecessary for the target word.',
  hate: 'The sentence contains an identity-based generalization or hateful conflict that is not needed for teaching.',
  'public-controversy': 'The sentence depends on a current public-figure or culture-war controversy that is unnecessary for the target word.',
  'obscure-background': 'The sentence requires obscure names, places, history, or specialist background before it can be understood.',
  'context-too-hard': 'The surrounding vocabulary or technical background is substantially harder than the target word.',
  'context-dependent': 'The sentence is not sufficiently standalone or leaves a key reference unresolved.',
  'unnatural-English': 'The wording is awkward, archaic, or unnatural for a modern default teaching example.',
  'weak-teaching-value': 'The target word is incidental, ambiguous, or too weakly illustrated to justify the context burden.',
  'proper-noun-heavy': 'The proper names or named institutions create unnecessary cognitive load for this target word.',
}
const specs = `
anonymous|12437930|public-controversy,proper-noun-heavy
assault|9416101|violence
author|12052583|public-controversy
autonomy|11024109|obscure-background,proper-noun-heavy,political-heavy
commit|11563914|violence
compete|11976271|public-controversy
conversion|11763486|medical-heavy,political-heavy
convert|12274190|religious-heavy,public-controversy
destruction|12134948|medical-heavy,context-too-hard
drag|11844542|sexual,political-heavy
executive|12052026|political-heavy
hatred|11277440|hate,public-controversy
idiot|11608838|weak-teaching-value,unnatural-English
intensive|11725953|medical-heavy
internal|11610552|medical-heavy
junk|7954842|medical-heavy,context-dependent
legitimate|8769328|extremism,political-heavy
military|11997672|political-heavy,violence
mob|11696355|violence
occupation|8622838|extremism,political-heavy
pastime|8022208|sexual
priest|12043579|sexual,public-controversy
propaganda|10113994|political-heavy,sexual
racial|11987917|hate,political-heavy
relative|11459133|context-too-hard,unnatural-English
slaughter|8114981|violence,religious-heavy
stern|11608539|violence
summon|9669229|religious-heavy,obscure-background
supreme|12002475|extremism,political-heavy
tolerant|11280599|political-heavy
trigger|10062867|violence,context-dependent
vast|11994717|political-heavy
violent|11789211|violence,medical-heavy
`.trim().split(/\r?\n/).filter(Boolean)
const existingGlobal = new Set(curation.globalReject.map((entry) => entry.sentenceId))
const existingPairs = new Set(curation.pairReject.map((entry) => `${entry.word}::${entry.sentenceId}`))
for (const line of specs) {
  const [word, sentenceIdText, categoryText] = line.split('|')
  const sentenceId = Number(sentenceIdText)
  if (!selected[word] || provenance[word]?.sentenceId !== sentenceId) {
    console.log(`Skip already-unselected review pair: ${word}/${sentenceId}`)
    continue
  }
  const pairKey = `${word}::${sentenceId}`
  if (existingPairs.has(pairKey) || existingGlobal.has(sentenceId)) continue
  const categories = categoryText.split(',')
  curation.pairReject.push({ word, sentenceId, categories, reason: categories.map((category) => reasonByCategory[category] ?? `The sentence fails the ${category} semantic review dimension.`).join(' ') })
}
curation.pairReject.sort((a, b) => String(a.word).localeCompare(String(b.word)) || a.sentenceId - b.sentenceId)
await writeFile(curationPath, `${JSON.stringify(curation, null, 2)}\n`, 'utf8')
console.log(`Appended ${specs.length} final-pool Round 4 semantic rejects.`)
