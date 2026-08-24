import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

type DecisionSpec = { word: string; sentenceId: number; categories: string[]; reason: string }

const root = resolve(import.meta.dirname, '..')
const selectedPath = resolve(root, 'data-source/examples/selected-examples.json')
const provenancePath = resolve(root, 'data-source/examples/example-provenance.json')
const outputPath = resolve(root, 'data-source/examples/context-curation.json')

const reasons: Record<string, string> = {
  violence: 'The sentence adds unnecessary violence, weapons, threats, or graphic harm to a default learning context.',
  extremism: 'The sentence requires extremist or Nazi-related context that is not necessary to teach the target word.',
  sexual: 'The sentence contains sexual or explicit material that is not appropriate as a default learning context.',
  medical: 'The sentence makes the learner process unnecessary medical detail instead of the target word.',
  political: 'The sentence depends on a politically charged dispute or institutional background that is unnecessary for the target word.',
  religious: 'The sentence depends on a religious controversy or background that is unnecessary for the target word.',
  hate: 'The sentence contains an identity-based generalization, slur-adjacent framing, or hateful conflict that is not needed for teaching.',
  obscure: 'The sentence requires obscure names, places, history, or specialist background before it can be understood.',
  hard: 'The surrounding vocabulary or technical background is substantially harder than the target word.',
  dependent: 'The sentence is not sufficiently standalone or leaves a key reference unresolved.',
  unnatural: 'The wording is awkward, archaic, or unnatural for a modern default teaching example.',
  weak: 'The target word is incidental, ambiguous, or too weakly illustrated to justify the context burden.',
}

const globalSpecs: Array<[number, string, string]> = [
  [11034211, 'sexual,medical', 'The sentence describes an explicit medical treatment involving the anus and piles.'],
  [11844548, 'extremism,political', 'The sentence places Nazis in a default child-facing context and is not a neutral teaching example.'],
  [12154787, 'sexual,violence,hate', 'The sentence describes sexual assault in an identity-based political dispute.'],
  [12000276, 'sexual,medical', 'The sentence describes a sexually transmitted fatal disease.'],
  [9511536, 'extremism,religious,violence', 'The sentence uses beheading as a threat in a religious conflict.'],
  [11765250, 'violence', 'The sentence frames mass shootings as the example context.'],
  [13267046, 'sexual', 'The sentence describes explicit photos used for blackmail.'],
  [11364538, 'extremism,violence', 'The sentence endorses punching Nazis.'],
  [11790283, 'extremism,violence', 'The sentence describes violent fascist threats.'],
  [11595487, 'sexual', 'The sentence describes sexual trysts in a default example.'],
  [11451337, 'extremism,political', 'The sentence centers propaganda and fascists in a partisan political claim.'],
  [11807420, 'extremism,political', 'The sentence centers Nazis in a partisan political comparison.'],
  [11948142, 'extremism,violence', 'The sentence describes Mussolini\'s corpse being displayed in a public square.'],
  [10228651, 'violence,religious', 'The sentence describes child sacrifice.'],
  [11740270, 'violence,political', 'The sentence describes mass killings under political regimes.'],
  [13035646, 'violence', 'The sentence contains unnecessary interpersonal stabbing.'],
  [8114983, 'violence,religious', 'The sentence describes slaughtering animals in front of children as a religious practice.'],
  [8022246, 'sexual', 'The sentence uses explicit sexual activity as the example context.'],
  [5268344, 'sexual', 'The sentence is ambiguous with a sex-work meaning and is not suitable as a default example.'],
  [8111594, 'violence,hate', 'The sentence describes beating women in an identity-based generalization.'],
]

const pairSpecs = `
abandon|12338135|hard
abolish|5059670|religious
abundant|9954436|hard,political
accurate|12302767|medical,hard
additional|11689796|hard
adequate|12190656|medical,hard
adhere|11986511|political,hard
administration|12063836|political,hard
adopt|11702461|political,weak
advantage|11380634|hard,weak
aerial|12080130|hard
aggregate|11034211|sexual,medical
aggressive|11541536|political
alert|11048125|medical
alienate|12015551|hard,weak
alter|9940629|hard
alternative|13148347|unnatural
ambition|11676112|hard
ammunition|11891468|violence
analysis|12034469|hard
anonymous|11076401|obscure,hard
arrangement|11354864|political,obscure,hard
arrest|10009479|obscure,dependent
ascend|10722100|religious,unnatural
assert|9141055|political
attach|11109115|medical
attain|9801023|unnatural,hard
attitude|10104692|hard
attractive|11081976|political,weak
auction|9452985|hard
authentic|8108994|religious,political
author|8700856|political
autonomy|10018041|dependent
axis|8622843|political,obscure
bamboo|11209064|hard
barren|12764977|violence
behave|8111692|hate
bizarre|10357464|hard
blossom|11068644|weak
brisk|10844733|unnatural,hard
bull|10786896|hard
bully|10021723|violence,hard
bump|9794985|dependent
bureaucracy|8801510|extremism,obscure
bypass|10249063|extremism,political,hard
cancer|10806002|medical
candidate|9229484|political,unnatural
cane|11686683|obscure,hard
casual|11863884|unnatural
certainty|12060096|unnatural,hard
champagne|8736656|political
characterize|11095212|political,obscure
chief|11889584|obscure,hard
circulation|9805165|medical
cite|12417879|proper-noun-heavy,weak
clamp|10724631|medical
cling|11899770|obscure,hard
classification|11358495|hate,political
cocaine|12391805|medical
cognitive|11969319|medical,hard
collapse|11988241|hard
colonial|8421512|political,religious
combine|11598375|weak,obscure
commit|11678600|political,weak
committee|12272805|political,hard
commonwealth|11502104|political,unnatural
compact|11867522|hard
comparable|9267873|political,hard
compete|9005062|obscure
component|10087290|weak,dependent
comprehensive|11062578|sexual,medical,hard
concentrate|11409910|medical
concentration|12034453|hard
concern|11074647|political
concise|11265727|hard
congress|8732340|political,weak
conscientious|10791371|unnatural,hard
conservative|11997650|political
considerable|11813252|hard,unnatural
constitution|10059733|political,obscure
construct|8578557|political
consumption|10718770|political,hard
contaminate|11148934|obscure,hard
contempt|11560905|political
contract|8180110|hard
convention|9588355|obscure
conversion|11630018|medical,political
convert|11592849|hard
cooperative|11822514|hard
corpse|11948142|extremism,violence
court|12775845|obscure
coverage|10723423|hard
credible|12051844|political,obscure
criminal|8111679|hate,political,obscure
critic|11476006|hard
criticism|11977209|hard
criticize|9511536|extremism,religious,violence
crowd|12363632|hard
crumble|8143487|weak
cynical|11350397|political
decay|11742106|hard,unnatural
default|12296189|religious
defeat|12764886|violence
defendant|10775728|hard
defiance|11056703|hard
definitely|8608127|weak,political
definition|11581611|political
defy|11580293|unnatural,hard
degenerate|12115322|hard,unnatural
demand|12087155|hard
demonstrate|11488281|dependent
denote|9951226|hard
depress|11290486|political,hard
deprive|11047785|unnatural,hard
derive|11168919|proper-noun-heavy,hard
descendant|12267992|obscure,hard
design|10363149|weak
destruction|8613695|religious,obscure
diffuse|11165205|hard
discipline|11168053|hard
disease|12000276|sexual,medical
dismiss|12038108|political
disorder|12128440|medical
distinguish|5153393|hard
divine|9193752|religious
dodge|9944199|political,obscure
doubtless|12038284|medical,hard
drag|11352143|sexual,political,violence
drill|12382550|obscure,hard
element|12434464|religious,weak
elementary|11518080|sexual
eliminate|11997754|political
elite|9365572|hard
eloquent|12007328|obscure
embed|9452996|obscure,hard
emotion|10804111|medical,hard
employment|7807095|proper-noun-heavy
enclosure|12308182|violence
encounter|12138360|medical,dependent
endeavor|11944884|political,weak
enrich|7530201|political,weak
ensue|11906254|political
envisage|11419146|hard,violence
epoch|11044319|hard
equality|11607426|political,hard
equator|12388999|obscure,hard
erosion|10841928|obscure
escort|5268344|sexual
eternal|12777830|religious
ethnic|11034377|political,hate
exceptional|11626783|unnatural,hard
excess|9715179|religious
execute|11765250|violence
executive|11765250|violence
exhaust|11120980|hard
exotic|12764616|weak
explicit|13267046|sexual
extensive|10169351|hard
extinct|12154755|hard
facet|11062533|hard
factor|11166959|political,hard
fatal|12000276|sexual,medical
fatigue|11576413|unnatural,hard
federal|11984703|hard
fellowship|11997702|hard
fertilizer|11233041|hard
finite|11148401|hard
flap|11247774|hard
flare|11152976|violence,hard
flexible|11152907|hard
formidable|12807976|hard,unnatural
forum|11167366|obscure,political
fossil|11263097|hard
foul|9003983|hard
fraction|10014210|hard
fracture|11978684|medical
furthermore|10485485|political
fusion|10367067|hard
garment|11553812|obscure,hard
gear|12127706|hard
genetic|8902722|hard,political
genuine|11967133|political,hard
gland|10957274|medical,hard
gleam|11822323|unnatural,hard
glide|10919464|hard
gloom|10820417|weak
gracious|11819800|political,hard
grave|11264536|weak
grieve|7728420|political,proper-noun-heavy
grip|11076045|political
gross|9695409|political,hard
guarantee|11696504|violence
hatch|12141618|hard
hatred|10511603|hate
haunt|11100993|obscure
heighten|11095203|political,hate
historian|8858785|obscure,hard
hitherto|10971182|unnatural,hard
homogeneous|10654591|hard
hostile|11247972|political
humanity|12044268|political
identical|11264536|weak
identification|10722159|hard
idiot|11279780|weak,unnatural
ignore|11830874|dependent
illegal|12102138|violence
imaginary|12335008|dependent
imaginative|11007878|proper-noun-heavy,hard
immerse|10718787|medical
immigrant|12099281|political,proper-noun-heavy
immune|9101344|extremism,political
imperative|11364538|extremism,violence
implication|12095704|weak
incentive|10750476|dependent
incident|11937839|dependent
indefinite|9934956|hard
independence|8994913|hard
indulge|11790283|extremism,violence
inflict|10844687|hard
inhabit|10473638|medical,weak
inherent|11605309|political
inhibit|11542165|medical,hard
initial|12034469|hard
initiate|11248105|political
input|11566091|hate,political
insight|11566217|unnatural,weak
institution|8849707|political,hard
instrumental|12777283|weak
intellect|12386290|religious,obscure
intelligible|11972590|obscure,hard
intensify|12238252|hard
intensive|11045845|medical
interaction|9475763|hard
interfere|11759771|political
internal|10538151|hard
intrinsic|11043404|hard
irrigation|11553796|obscure,hard
irritate|11248348|medical
isolate|11051158|religious
item|12065617|dependent
jerk|8167966|violence,unnatural
junction|10640483|medical
junk|8805547|hard
kidney|12004429|medical
lame|8883585|weak,political
lash|8792307|unnatural
layman|11582398|hard
lease|10054477|dependent
leather|10370415|unnatural
legend|1566359|obscure
legitimate|11044209|political
leisure|11917447|hard,unnatural
liable|11129769|political,hard
liberal|11989505|political,religious
limb|8148317|violence,weak
liner|11152936|weak
literary|8736668|religious
literature|8832256|hard
logical|9952838|hard
luggage|10236661|hard
machinery|12300167|hard,obscure
magnetic|11095233|hard
majesty|12775801|proper-noun-heavy
manual|7713825|dependent,unnatural
masculine|8805634|hard
mass|11740270|violence,political
medieval|11624364|violence,hate
melody|11305424|hard
memorize|12363071|hard
menace|10723382|violence,medical
messenger|8613695|religious,obscure
migrant|12364859|obscure
militant|9635671|extremism,political
military|11976447|political,violence
minimal|9018760|religious,political
minority|11011363|religious
misery|9996955|violence
mistress|11595487|sexual
mob|10795816|violence
mobile|11107228|medical
morality|8603296|religious,hate
motive|11977290|hard
mourn|552682|religious,unnatural
municipal|11039206|political,medical
myth|11242378|hate
notion|8773945|religious,hate
objection|11857324|hard
obscure|11014134|political,hard
obtain|12069636|extremism,medical
occasional|9477210|hard
occupation|8622843|political,obscure
occupy|11044594|political,obscure
oppress|8135230|hate,political
optical|11507868|hard
optimum|9980903|obscure
option|10841956|political
orientation|12080121|sexual,political
orthodox|8988056|religious,dependent
outbreak|11048125|medical
outward|11034377|political,hate
overhead|12364859|obscure
overhear|552742|proper-noun-heavy
overwhelm|11178203|medical,political
oxide|9659556|hard
oxygen|12774938|medical
panic|11537552|medical,dependent
parasite|12327352|medical
participant|10913414|medical,hard
partition|12406201|hard
pastime|8022246|sexual
pave|12311448|medical,hard
peak|8908904|obscure,weak
peg|10159859|dependent,weak
penalty|12411736|political,violence
penguin|10007125|weak,unnatural
perception|12766805|weak
perfume|11919494|obscure,hard
permissible|10116181|hard
petition|12045723|proper-noun-heavy,hard
phenomenon|12150313|obscure,hard
pistol|12775252|violence
plausible|12061522|political,hard
poke|11247766|hard
pole|11696382|violence,unnatural
polish|11252737|proper-noun-heavy,weak
pope|11561193|religious,proper-noun-heavy
pore|10786588|medical
pose|12135993|medical,hard
poverty|11170398|political
preclude|11261835|hard,unnatural
predecessor|12063836|political,hard
preliminary|12102058|hard
presumably|5128446|medical,hard
prevail|8120016|unnatural,hard
priest|10522568|religious
primarily|12125848|medical,hard
prime|7792237|hard
principal|8813368|unnatural,hard
principle|8105907|obscure
priority|12766153|political
privacy|11720165|proper-noun-heavy
privilege|12767032|political
procedure|11248357|medical
professional|12148999|medical
progressive|11123420|medical
prominent|11671162|hard
prophet|11524513|religious,hard
prospect|11576413|unnatural,hard
propaganda|11451337|extremism,political
protest|11807420|extremism,political
prototype|11017157|hard
provision|11035776|unnatural,hard
pudding|12372699|hard
pursuit|12342807|proper-noun-heavy
racial|11358495|hate,political
radiate|10841958|hard
rank|10077687|political,violence
rap|11959395|violence
rational|11537836|unnatural,hard
rebel|11756292|political,hard
rebellion|12319714|dependent
recall|12770999|dependent
recede|11165121|medical,political
recite|10059733|political,obscure
reckon|10525226|dependent
recreation|13282982|obscure,hard
reform|11944748|political
refrain|8246720|religious
refusal|10790674|violence
regime|12381084|political,violence
region|11462415|violence,political
regulation|10781042|political,hard
relative|11091007|hard
release|11260218|violence,dependent
religion|6036927|religious,violence
religious|12113797|religious,political
rely|11242378|hate
renaissance|12777330|hard
render|10802144|violence
repay|9766892|unnatural
reserve|10478490|hard
resistant|11156257|hard
restrain|11017570|unnatural
retention|12777177|hard
revelation|10545401|weak
reverse|11919032|obscure
revolutionary|9267873|political,hard
ritual|12768381|religious
rivalry|10162430|weak
robust|10722131|hard
romance|10169884|hard
royalty|11748267|political
sacrifice|10228651|violence,religious
savage|11319213|proper-noun-heavy
scan|12262029|hard
scrub|11824186|hard
segment|11464741|hard
senator|10005713|political,proper-noun-heavy
sensible|11074656|religious
setback|12776199|weak
shaft|10762622|violence
shark|11330720|violence
shatter|11478878|medical
shed|10806882|medical
sheer|9995314|political
silicon|11845619|public-controversy
similar|12411756|proper-noun-heavy,hard
skull|10724631|medical
slap|10946919|violence
slash|12419034|violence
slaughter|8114983|violence,religious
slip|11955555|unnatural
specialty|9813893|violence
spectator|11989297|hard
spectrum|10428172|hard
speculate|12188991|hard
spine|12190656|medical
spoil|11327471|unnatural
spontaneous|6121835|medical,hard
stab|13035646|violence
stalk|10371291|violence
standpoint|9805551|medical,hard
stereo|12071337|hard
stern|9835515|political,proper-noun-heavy
strategy|12100782|medical
stroke|10792517|medical
sturdy|12267079|hard
substance|11524508|hard,unnatural
successive|11327471|unnatural
sue|11764741|dependent
suffice|10056966|dependent
summit|10820417|weak
summon|9669228|religious
superintendent|11657381|medical,hard
supreme|11980668|hate
surgeon|12381011|medical
surgery|11470747|medical,political
symmetry|11233291|hard
sympathy|12093688|dependent
symposium|12272801|proper-noun-heavy
syndrome|8033451|medical
tariff|11739145|political,hard
tenant|12120034|hard
terminate|11313255|political
territory|6543413|political
testify|10031121|hard
testimony|11183810|hard
therefore|10775728|hard
thorn|11172870|unnatural,hard
timid|11477339|unnatural,hard
tolerant|9519161|political
toxic|12765083|hard
trademark|11466947|hard
tragic|10147283|weak
transcend|12777822|weak
transmission|11671205|medical
transport|9805336|medical
tremendous|10126629|medical
trend|11111945|political
trial|8257498|public-controversy,political
tribe|10627733|hard,unnatural
tribute|8530287|proper-noun-heavy,hard
trigger|10478487|medical
undermine|10096145|political,obscure
update|10545369|dependent
upgrade|11217979|unnatural
urban|11135334|political
vain|11081976|political
vast|9359755|political,violence
vegetation|12382543|hard
veil|8135012|hate
velocity|11206816|hard
venture|9956556|obscure
verdict|12766041|hard
versatile|12175541|weak
victim|11541551|public-controversy
violent|8808650|violence,political
visa|11182508|obscure
vocal|12395454|hard
vulgar|11253810|violence,unnatural
vulnerable|11270819|medical,hate
wealthy|11921012|political
wedge|10721994|hard
whereby|11044319|hard
yield|11756596|unnatural,hard
`.trim().split(/\r?\n/).filter(Boolean)

function parseSpec(line: string): DecisionSpec {
  const [word, sentenceIdText, categoryText] = line.split('|')
  const categories = categoryText.split(',')
  const reason = categories.map((category) => reasons[category] ?? reasons.weak).join(' ')
  return { word, sentenceId: Number(sentenceIdText), categories, reason }
}

const selected = JSON.parse(await readFile(selectedPath, 'utf8')) as Record<string, { en: string }>
const provenance = JSON.parse(await readFile(provenancePath, 'utf8')) as Record<string, { sentenceId: number }>
const pairReject = pairSpecs.map(parseSpec)
const globalReject = globalSpecs.map(([sentenceId, categoryText, reason]) => ({ sentenceId, categories: categoryText.split(','), reason }))

for (const entry of pairReject) {
  if (!selected[entry.word] || provenance[entry.word]?.sentenceId !== entry.sentenceId) {
    throw new Error(`Curated pair is not the current R3 selection: ${entry.word}/${entry.sentenceId}`)
  }
}

const globalIds = new Set(globalReject.map((entry) => entry.sentenceId))
const uniquePairs = new Map<string, DecisionSpec>()
for (const entry of pairReject) uniquePairs.set(`${entry.word}::${entry.sentenceId}`, entry)

const output = {
  version: 1,
  source: 'Tatoeba English CC0 sentence export',
  reviewer: 'Lula-agent',
  reviewMethod: 'Sentence-read semantic rubric; machine metrics are retained only as risk signals.',
  globalReject: globalReject.sort((a, b) => a.sentenceId - b.sentenceId),
  pairReject: [...uniquePairs.values()]
    .filter((entry) => !globalIds.has(entry.sentenceId))
    .map(({ word, sentenceId, categories, reason }) => ({ word, sentenceId, categories, reason }))
    .sort((a, b) => a.word.localeCompare(b.word) || a.sentenceId - b.sentenceId),
}

await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8')
console.log(`Wrote ${output.globalReject.length} global and ${output.pairReject.length} pair semantic curation decisions.`)
