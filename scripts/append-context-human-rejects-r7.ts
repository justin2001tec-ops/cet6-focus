import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

type Reject = { word?: string; sentenceId: number; categories: string[]; reason: string }
type Curation = { version: number; globalReject: Reject[]; pairReject: Reject[] }

const root = resolve(import.meta.dirname, '..')
const curationPath = resolve(root, 'data-source/examples/context-curation.json')
const selectedPath = resolve(root, 'data-source/examples/selected-examples.json')
const provenancePath = resolve(root, 'data-source/examples/example-provenance.json')

const curation = JSON.parse(await readFile(curationPath, 'utf8')) as Curation
const selected = JSON.parse(await readFile(selectedPath, 'utf8')) as Record<string, { en: string }>
const provenance = JSON.parse(await readFile(provenancePath, 'utf8')) as Record<string, { sentenceId: number }>

const rejects: Array<{ word: string; categories: string[]; reason: string }> = [
  { word: 'abuse', categories: ['public-controversy', 'weak-teaching-value'], reason: 'The sentence centers an emotionally charged abuse and defamation dispute rather than a neutral default context for the target word.' },
  { word: 'appropriate', categories: ['public-controversy', 'context-dependent'], reason: 'The sentence is tied to a current culture-war controversy and is not a neutral, context-independent default example.' },
  { word: 'arrangement', categories: ['political-heavy', 'proper-noun-heavy', 'context-too-hard'], reason: 'The sentence is a news-style government and visa-policy report with unnecessary country and institutional background.' },
  { word: 'attach', categories: ['medical-heavy', 'context-too-hard'], reason: 'The sentence requires specialist surgical and anatomical background that overwhelms the ordinary target-word use.' },
  { word: 'barren', categories: ['violence'], reason: 'The sentence places the target in an unnecessary war aftermath context.' },
  { word: 'bleed', categories: ['sexual', 'medical-heavy'], reason: 'The sentence asks about bleeding after sex and is not appropriate as a default learning context.' },
  { word: 'budget', categories: ['political-heavy', 'violence'], reason: 'The sentence is a partisan military-spending prescription rather than a neutral example of budget.' },
  { word: 'congress', categories: ['proper-noun-heavy', 'political-heavy', 'context-dependent'], reason: 'The target is used as a specific political institution in a news-like sentence with unnecessary background.' },
  { word: 'constitution', categories: ['political-heavy', 'public-controversy'], reason: 'The sentence is a bare political judgment about a national constitution, not a neutral default context.' },
  { word: 'convert', categories: ['religious-heavy', 'public-controversy'], reason: 'The target appears inside a personal argument about religion and carries unnecessary controversy.' },
  { word: 'deny', categories: ['public-controversy', 'political-heavy'], reason: 'The sentence is a contemporary social-policy comparison about sexual orientation, not a neutral default context.' },
  { word: 'despite', categories: ['sexual'], reason: 'The sentence explicitly discusses sex drive and repeated sexual references without teaching the target beyond a charged context.' },
  { word: 'disease', categories: ['medical-heavy', 'context-dependent'], reason: 'The sentence is an elliptical conversational remark about celiac disease and an implied food choice, so it is not a clean standalone default example.' },
  { word: 'dismiss', categories: ['political-heavy', 'public-controversy'], reason: 'The sentence is a news-style allegation about government supporters and adds unnecessary political controversy.' },
  { word: 'existence', categories: ['public-controversy', 'weak-teaching-value'], reason: 'The sentence is awkward and centers a sensitive social-identity controversy rather than a useful default use of existence.' },
  { word: 'federal', categories: ['political-heavy', 'context-dependent'], reason: 'The sentence depends on an unexplained informant and allegation scenario, making the target context opaque and politically loaded.' },
  { word: 'hatred', categories: ['religious-heavy', 'obscure-background'], reason: 'The sentence requires religious and ancient historical background that is unnecessary for the target word.' },
  { word: 'majesty', categories: ['proper-noun-heavy', 'obscure-background'], reason: 'The sentence depends on royal and courtly background and is not a common standalone default context.' },
  { word: 'military', categories: ['weak-teaching-value'], reason: 'The target is only an incidental modifier in a veteran compost-business anecdote and does not provide strong teaching value.' },
  { word: 'proof', categories: ['medical-heavy', 'public-controversy', 'context-too-hard'], reason: 'The sentence combines an unfamiliar drug, a heroin epidemic, and an unsupported conspiracy claim.' },
  { word: 'propaganda', categories: ['political-heavy', 'public-controversy'], reason: 'The sentence is a partisan accusation about right-wing media and is not a neutral default teaching context.' },
  { word: 'religion', categories: ['religious-heavy', 'public-controversy'], reason: 'The sentence is dismissive and confrontational toward religion rather than a neutral example of the target word.' },
  { word: 'spite', categories: ['public-controversy', 'weak-teaching-value'], reason: 'The sentence relies on an emotionally charged abuse context that is unnecessary for teaching spite.' },
  { word: 'supreme', categories: ['political-heavy', 'public-controversy', 'proper-noun-heavy'], reason: 'The sentence is a partisan allegation about the U.S. Supreme Court and billionaire influence.' },
  { word: 'surgery', categories: ['medical-heavy', 'context-too-hard'], reason: 'The target is embedded in a specialist medical facility phrase that adds unnecessary jargon for a default example.' },
  { word: 'tariff', categories: ['political-heavy', 'context-too-hard'], reason: 'The sentence is dense trade-policy news language with several unrelated institutional terms.' },
  { word: 'versus', categories: ['public-controversy', 'political-heavy'], reason: 'The sentence centers a sensitive social-policy comparison about sexual orientation rather than a neutral contrast.' },
  { word: 'violent', categories: ['context-too-hard', 'weak-teaching-value'], reason: 'The target is used in a specialist vaporization and flare description whose technical background obscures the ordinary sense.' },
]

for (const item of rejects) {
  const entry = selected[item.word]
  const provenanceEntry = provenance[item.word]
  if (!entry || !provenanceEntry) throw new Error(`Selected/provenance record missing for ${item.word}.`)
  const duplicate = curation.pairReject.some((candidate) => candidate.word === item.word && candidate.sentenceId === provenanceEntry.sentenceId)
  if (!duplicate) {
    curation.pairReject.push({ word: item.word, sentenceId: provenanceEntry.sentenceId, categories: item.categories, reason: item.reason })
  }
}

curation.pairReject.sort((a, b) => String(a.word).localeCompare(String(b.word)) || a.sentenceId - b.sentenceId)
await writeFile(curationPath, `${JSON.stringify(curation, null, 2)}\n`, 'utf8')
console.log(`Added ${rejects.length} sentence-read Round 4 rejects (idempotent).`)
