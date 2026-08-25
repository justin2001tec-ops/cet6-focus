import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const path = resolve(root, 'data-source/examples/context-curation.json')
const curation = JSON.parse(await readFile(path, 'utf8')) as { pairReject: Array<{ word: string; sentenceId: number }> }
const restore = `
accurate|12302767
adequate|12190656
alert|11048125
attach|11109115
auction|9452985
candidate|9229484
contaminate|11148934
cognitive|11969319
circulation|9805165
discipline|11168053
dodge|9944199
epoch|11044319
equator|12388999
fossil|11263097
fracture|11978684
genetic|8902722
irrigation|11553796
irritate|11248348
kidney|12004429
oxygen|12774938
participant|10913414
pose|12135993
privilege|12767032
recede|11165121
surgeon|12381011
tariff|11739145
tenant|12120034
transport|9805336
trigger|10478487
factor|11166959
optical|11507868
autonomy|11024109
commit|11563914
alter|9940629
auction|9452985
dismiss|12038108
federal|11984703
arrangement|11354864
commit|11563914
concise|12125475
congress|11997364
constitution|11559028
cocaine|10280164
convert|6119151
drag|11844546
bizarre|10357464
demand|12087155
historian|8858785
incentive|10750476
hatred|10538183
propaganda|10095186
employment|7807095
cynical|11350397
`.trim().split(/\r?\n/).filter(Boolean).map((line) => {
  const [word, sentenceId] = line.split('|')
  return `${word}::${Number(sentenceId)}`
})
const restoreKeys = new Set(restore)
const before = curation.pairReject.length
curation.pairReject = curation.pairReject.filter((entry) => !restoreKeys.has(`${entry.word}::${entry.sentenceId}`))
const removed = before - curation.pairReject.length
console.log(`Restored ${removed}/${restoreKeys.size} explicitly sentence-read acceptable pairs.`)
await writeFile(path, `${JSON.stringify(curation, null, 2)}\n`, 'utf8')
