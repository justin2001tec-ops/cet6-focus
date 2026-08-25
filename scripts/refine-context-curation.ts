import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const curationPath = resolve(root, 'data-source/examples/context-curation.json')
const curation = JSON.parse(await readFile(curationPath, 'utf8')) as {
  version: number
  source: string
  reviewer: string
  reviewMethod: string
  globalReject: unknown[]
  pairReject: Array<{ word: string; sentenceId: number; categories: string[]; reason: string }>
}

// These are explicit sentence-read retention decisions for borderline R3 risk signals.
// They are intentionally kept separate from selector metrics: removing a pair here means
// the sentence was read and judged acceptable as a default teaching context.
const keepPairs = `
adhere|11986511
aerial|12080130
bamboo|11209064
barren|12764977
characterize|11095212
cite|12417879
consumption|10718770
cooperative|11822514
court|12775845
coverage|10723423
crumble|8143487
defeat|12764886
defiance|11056703
design|10363149
diffuse|11165205
disorder|12128440
elite|9365572
eloquent|12007328
enclosure|12308182
erosion|10841928
exhaust|11120980
exotic|12764616
extensive|10169351
extinct|12154755
facet|11062533
fellowship|11997702
fertilizer|11233041
foul|9003983
fusion|10367067
gear|12127706
glide|10919464
guarantee|11696504
hatch|12141618
haunt|11100993
homogeneous|10654591
hostile|11247972
identical|11264536
identification|10722159
imaginary|12335008
immerse|10718787
implication|12095704
inflict|10844687
instrumental|12777283
item|12065617
lease|10054477
liner|11152936
luggage|10236661
magnetic|11095233
memorize|12363071
migrant|12364859
objection|11857324
oxide|9659556
overhead|12364859
overhear|552742
partition|12406201
perception|12766805
permissible|10116181
priority|12766153
prototype|11017157
pursuit|12342807
radiate|10841958
release|11260218
rebel|11756292
renaissance|12777330
resistant|11156257
retention|12777177
revelation|10545401
ritual|12768381
rivalry|10162430
robust|10722131
romance|10169884
scan|12262029
scrub|11824186
segment|11464741
setback|12776199
shaft|10762622
shed|10806882
speculate|12188991
spectrum|10428172
stereo|12071337
strategy|12100782
sturdy|12267079
sue|11764741
suffice|10056966
symmetry|11233291
symposium|12272801
toxic|12765083
trademark|11466947
trend|11111945
update|10545369
upgrade|11217979
vegetation|12382543
verdict|12766041
versatile|12175541
vocal|12395454
wedge|10721994
`.trim().split(/\r?\n/).filter(Boolean).map((line) => {
  const [word, sentenceId] = line.split('|')
  return `${word}::${Number(sentenceId)}`
})

const keep = new Set(keepPairs)
const before = curation.pairReject.length
curation.pairReject = curation.pairReject.filter((entry) => !keep.has(`${entry.word}::${entry.sentenceId}`))
const removed = before - curation.pairReject.length
if (removed !== keep.size) throw new Error(`Expected to retain ${keep.size} reviewed pairs, found ${removed}.`)
await writeFile(curationPath, `${JSON.stringify(curation, null, 2)}\n`, 'utf8')
console.log(`Retained ${removed} sentence-read risk pairs; ${curation.pairReject.length} pair rejects remain.`)
