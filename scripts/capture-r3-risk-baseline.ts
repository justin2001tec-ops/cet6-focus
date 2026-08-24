import { execFileSync } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

interface Example { en: string }
interface Provenance {
  sentenceId: number
  qualityScore: number
  tokenCount: number
  characterCount: number
  rareTokenCount: number
  unknownLikeTokenCount: number
  properNounCount: number
  standalonePenalty: number
  topicPenalty: number
  targetPositionPenalty: number
}

const root = resolve(import.meta.dirname, '..')
const commit = '6bd6fb4a208bcfed07cafff06645b36fc4dc59a9'
const selected = JSON.parse(execFileSync('git', ['show', `${commit}:data-source/examples/selected-examples.json`], { cwd: root, encoding: 'utf8' })) as Record<string, Example>
const provenance = JSON.parse(execFileSync('git', ['show', `${commit}:data-source/examples/example-provenance.json`], { cwd: root, encoding: 'utf8' })) as Record<string, Provenance>
const outputPath = resolve(root, 'audit/v1.3-context-human-quality/r3-risk-candidate-baseline.json')

const highRiskText = /\b(?:stab(?:bing)?|shoot(?:ing|ings)?|gun|weapon|massacre|mass\s+kill|murder|bloodshed|bombing|terror(?:ist|ism)?|Nazi|Nazis|Neo-Nazi|extremist|extremism|propaganda|porn|sexual|rape|suicide|self-harm|slur|racist|racism|genocide|torture|behead|drowning|hemorrhoid|abortion|cocaine|masturbat|mistress|tryst|Mengele|Putin|Trump|Biden|Musk|Palestine|Israel|Ukraine|Russia|Kabyle|Tamasheq|fascist|fascism|monarchy|homeopathy)\b/i

function isRiskTargeted(word: string, example: Example, details: Provenance): boolean {
  return details.qualityScore < 80
    || details.properNounCount > 0
    || details.rareTokenCount > 0
    || details.unknownLikeTokenCount > 0
    || details.standalonePenalty > 0
    || details.topicPenalty > 0
    || details.targetPositionPenalty > 0
    || details.tokenCount > 14
    || details.characterCount > 120
    || highRiskText.test(example.en)
    || word === 'formidable'
}

const rows = Object.keys(selected)
  .sort((a, b) => a.localeCompare(b))
  .filter((word) => isRiskTargeted(word, selected[word], provenance[word]))
  .map((word) => ({
    word,
    sentenceId: provenance[word].sentenceId,
    sentence: selected[word].en,
    machineFlags: {
      qualityScore: provenance[word].qualityScore,
      tokenCount: provenance[word].tokenCount,
      characterCount: provenance[word].characterCount,
      rareTokenCount: provenance[word].rareTokenCount,
      unknownLikeTokenCount: provenance[word].unknownLikeTokenCount,
      properNounCount: provenance[word].properNounCount,
      standalonePenalty: provenance[word].standalonePenalty,
      topicPenalty: provenance[word].topicPenalty,
      targetPositionPenalty: provenance[word].targetPositionPenalty,
    },
  }))

await mkdir(resolve(root, 'audit/v1.3-context-human-quality'), { recursive: true })
await writeFile(outputPath, `${JSON.stringify({ sourceCommit: commit, reviewScope: 'R3 selected risk-targeted pool', rows }, null, 2)}\n`, 'utf8')
console.log(`Captured ${rows.length} R3 risk-targeted candidates.`)
