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
  'religious-heavy': 'The sentence depends on a religious controversy or background that is unnecessary for the target word.',
  hate: 'The sentence contains an identity-based generalization or hateful conflict that is not needed for teaching.',
  'public-controversy': 'The sentence depends on a current public-figure or culture-war controversy that is unnecessary for the target word.',
  'obscure-background': 'The sentence requires obscure names, places, history, or specialist background before it can be understood.',
  'context-too-hard': 'The surrounding vocabulary or technical background is substantially harder than the target word.',
  'context-dependent': 'The sentence is not sufficiently standalone or leaves a key reference unresolved.',
  'unnatural-English': 'The wording is awkward, archaic, or unnatural for a modern default teaching example.',
  'weak-teaching-value': 'The target word is incidental, ambiguous, or too weakly illustrated to justify the context burden.',
  'proper-noun-heavy': 'The proper names or named institutions create unnecessary cognitive load for this target word.',
}

const globalSpecs: Array<[number, string[], string]> = [
  [11765251, ['violence'], 'The sentence frames mass shootings as the learning context for executive function.'],
  [11150718, ['violence'], 'The sentence is a literary stabbing reference and is not appropriate as a default context.'],
  [8832211, ['violence', 'hate'], 'The sentence describes the slaughter of Jews in an antisemitic historical context.'],
  [8111597, ['sexual'], 'The sentence includes pornographic material.'],
  [9956770, ['violence'], 'The sentence describes a violent gang turf war.'],
  [8022209, ['sexual'], 'The sentence includes explicit sexual activity.'],
  [10161554, ['hate'], 'The sentence explicitly uses a racial epithet.'],
  [8214536, ['violence'], 'The sentence pairs commit with atrocities and is not a neutral default context.'],
  [11779076, ['violence'], 'The sentence explicitly describes pulling a trigger.'],
  [11928120, ['violence'], 'The sentence describes aggravated assault and mayhem.'],
]

const pairSpecs = `
administration|11462440|political-heavy,context-too-hard
advantage|11878545|public-controversy
anonymous|9673899|public-controversy,proper-noun-heavy
assert|11532790|political-heavy,hate
author|8700874|public-controversy
autonomy|12131359|obscure-background,proper-noun-heavy,political-heavy
candidate|11026484|political-heavy,proper-noun-heavy
cocaine|11934950|medical-heavy
cognitive|12154399|medical-heavy,context-too-hard
committee|11121049|political-heavy,context-too-hard
comparable|12025045|political-heavy,obscure-background
compete|11976560|public-controversy
concentrate|11409906|medical-heavy
congress|9588518|obscure-background,proper-noun-heavy
conservative|11699350|political-heavy
considerable|10009511|political-heavy,proper-noun-heavy
constitution|9484575|obscure-background,political-heavy
convention|8991458|public-controversy
conversion|11379023|medical-heavy,political-heavy
convert|12143561|religious-heavy,public-controversy
corpse|11218157|violence,unnatural-English
defendant|11986313|hate,political-heavy
definitely|11520805|context-dependent
defy|12351506|obscure-background,unnatural-English
demand|11807063|context-too-hard,violence
destruction|12765080|violence
disease|9243507|medical-heavy,political-heavy
divine|8578933|religious-heavy
drag|11523882|sexual,weak-teaching-value
elementary|11690637|sexual,political-heavy
eliminate|11489654|political-heavy
eternal|12778572|religious-heavy
factor|11245993|religious-heavy,obscure-background
fatal|12073701|medical-heavy
finite|11146425|context-too-hard
fraction|11984575|extremism,political-heavy
garment|10096275|context-too-hard,hate
grip|12424709|public-controversy,proper-noun-heavy
gross|12368524|religious-heavy,unnatural-English
hatred|8111631|hate,obscure-background
idiot|9839996|weak-teaching-value,unnatural-English
ignore|11762798|political-heavy
illegal|11523859|political-heavy,public-controversy
incident|11937841|context-dependent
independence|9484584|political-heavy,obscure-background
inherent|5251250|context-too-hard
initiate|11455114|violence,medical-heavy
intensive|12061800|medical-heavy
interaction|11003321|medical-heavy,context-dependent
internal|8095614|violence,medical-heavy
junk|8805546|obscure-background,context-too-hard
legitimate|11938841|political-heavy,public-controversy
liberal|8108982|political-heavy,religious-heavy
literary|8736667|religious-heavy
literature|11179890|obscure-background
mass|5342483|political-heavy,violence
medieval|12230038|religious-heavy,political-heavy,context-too-hard
military|11074599|political-heavy,violence
mob|11696352|violence
mobile|10943928|medical-heavy
motive|11119100|violence
occupation|12496397|political-heavy
optimum|11168801|obscure-background,proper-noun-heavy
panic|8755474|sexual,political-heavy
parasite|10786588|medical-heavy
petition|9995644|political-heavy,context-too-hard
pore|10928260|medical-heavy
predecessor|10709469|religious-heavy,obscure-background
prevail|12766066|political-heavy,context-too-hard
priest|11928692|sexual,public-controversy
primarily|11633645|medical-heavy,violence
prime|8014168|context-too-hard
principal|11840846|context-too-hard,unnatural-English
prominent|11089826|proper-noun-heavy,context-too-hard
propaganda|10126322|political-heavy
rap|12113937|violence
rational|10249063|extremism,political-heavy
refusal|12111974|political-heavy
regime|11535201|political-heavy,violence
relative|11459133|context-too-hard,unnatural-English
religion|9801001|religious-heavy,violence
rely|11906243|medical-heavy
restrain|11017571|unnatural-English
senator|11450529|political-heavy,proper-noun-heavy
sheer|12113816|context-too-hard
stalk|11686683|proper-noun-heavy,context-too-hard
stern|9835502|extremism,proper-noun-heavy
stroke|12127602|medical-heavy
summit|12765986|political-heavy
summon|9669229|religious-heavy
supreme|11938841|political-heavy,public-controversy
surgery|11504710|medical-heavy,political-heavy
syndrome|7247280|medical-heavy
therefore|9005062|obscure-background,context-too-hard
tolerant|8122521|political-heavy
transcend|12777804|religious-heavy
tremendous|11952162|context-too-hard,unnatural-English
tribe|8755294|religious-heavy,proper-noun-heavy
tribute|11699281|proper-noun-heavy
trigger|11779076|violence
vain|9325066|unnatural-English,context-too-hard
vast|11566091|hate,political-heavy
veil|8111597|sexual,hate
violent|9956770|violence
`.trim().split(/\r?\n/).filter(Boolean)

const existingGlobal = new Set(curation.globalReject.map((entry) => entry.sentenceId))
const existingPairs = new Set(curation.pairReject.map((entry) => `${entry.word}::${entry.sentenceId}`))
const reason = (categories: string[]) => categories.map((category) => reasonByCategory[category] ?? `The sentence fails the ${category} semantic review dimension.`).join(' ')

for (const [sentenceId, categories, explicitReason] of globalSpecs) {
  if (!existingGlobal.has(sentenceId)) curation.globalReject.push({ sentenceId, categories, reason: explicitReason })
}
for (const line of pairSpecs) {
  const [word, sentenceIdText, categoriesText] = line.split('|')
  const sentenceId = Number(sentenceIdText)
  if (!selected[word] || provenance[word]?.sentenceId !== sentenceId) throw new Error(`Final reviewed pair is not selected: ${word}/${sentenceId}`)
  const pairKey = `${word}::${sentenceId}`
  if (!existingPairs.has(pairKey) && !existingGlobal.has(sentenceId)) {
    const categories = categoriesText.split(',')
    curation.pairReject.push({ word, sentenceId, categories, reason: reason(categories) })
  }
}
curation.globalReject.sort((a, b) => a.sentenceId - b.sentenceId)
curation.pairReject.sort((a, b) => String(a.word).localeCompare(String(b.word)) || a.sentenceId - b.sentenceId)
await writeFile(curationPath, `${JSON.stringify(curation, null, 2)}\n`, 'utf8')
console.log(`Appended final-pool semantic rejects. Global=${curation.globalReject.length}, pair=${curation.pairReject.length}.`)
