import { withBase } from '@/lib/public-path'

export type SceneCardTone = 'warm-dark' | 'cool-dark' | 'neutral-dark'

export interface BackgroundScene {
  id: string
  label: string
  category: string
  /** Runtime aliases retained for the stable v1.1 settings/provider contract. */
  avif: string
  webp: string
  srcAvif: string
  srcWebp: string
  source: string
  author: string
  license: string
  semanticTags: string[]
  moodTags: string[]
  featuredWords: string[]
  desktopPosition: string
  mobilePosition: string
  objectPosition: string
  overlayOpacity: number
  cardTone: SceneCardTone
}

interface SceneInput extends Omit<BackgroundScene, 'avif' | 'webp' | 'srcAvif' | 'srcWebp' | 'objectPosition'> {
  desktopPosition: string
}

function scene(input: SceneInput): BackgroundScene {
  return {
    ...input,
    avif: withBase(`backgrounds/v1.2/avif/${input.id}.avif`),
    webp: withBase(`backgrounds/v1.2/webp/${input.id}.webp`),
    srcAvif: withBase(`backgrounds/v1.2/avif/${input.id}.avif`),
    srcWebp: withBase(`backgrounds/v1.2/webp/${input.id}.webp`),
    objectPosition: input.desktopPosition,
  }
}

export const backgrounds: BackgroundScene[] = [
  scene({
    id: 'plateau-kiang-01',
    label: '旷野与远方',
    category: '高原 / 动物远景',
    source: 'https://unsplash.com/photos/a-mountain-range-with-a-body-of-water-in-the-foreground-FP-LQo1AGTA',
    author: 'Mayur Arvind',
    license: 'Unsplash License',
    semanticTags: ['remote', 'vast', 'plateau', 'graze'],
    moodTags: ['remote', 'vast', 'quiet'],
    featuredWords: ['remote', 'vast', 'plateau', 'graze'],
    desktopPosition: '50% 52%',
    mobilePosition: '54% 52%',
    overlayOpacity: 0.28,
    cardTone: 'cool-dark',
  }),
  scene({
    id: 'altiplano-01',
    label: '贫瘠高原',
    category: '高原 / 荒山',
    source: 'https://unsplash.com/photos/a-barren-landscape-with-mountains-in-the-background-VCmVqsnoCyY',
    author: 'Alexander Schimmeck',
    license: 'Unsplash License',
    semanticTags: ['barren', 'rugged', 'arid', 'desolate'],
    moodTags: ['severe', 'remote', 'barren'],
    featuredWords: ['barren', 'remote', 'severe', 'extent'],
    desktopPosition: '50% 50%',
    mobilePosition: '52% 50%',
    overlayOpacity: 0.24,
    cardTone: 'warm-dark',
  }),
  scene({
    id: 'altiplano-02',
    label: '荒原光线',
    category: '高原 / 荒山',
    source: 'https://unsplash.com/photos/a-mountain-range-in-the-middle-of-a-desert-yweLOOSW9Do',
    author: 'Marek Piwnicki',
    license: 'Unsplash License',
    semanticTags: ['vast', 'harsh', 'remote', 'rugged'],
    moodTags: ['vast', 'arid', 'still'],
    featuredWords: ['vast', 'remote', 'barren', 'peak'],
    desktopPosition: '50% 50%',
    mobilePosition: '50% 50%',
    overlayOpacity: 0.24,
    cardTone: 'warm-dark',
  }),
  scene({
    id: 'ladakh-plateau-01',
    label: '棱角与天际',
    category: '高原 / 荒山',
    source: 'https://unsplash.com/photos/a-landscape-with-mountains-in-the-back-RMn0hMj-46A',
    author: 'Rishi Dubey',
    license: 'Unsplash License',
    semanticTags: ['angular', 'rugged', 'remote', 'vast'],
    moodTags: ['angular', 'clear', 'remote'],
    featuredWords: ['peak', 'remote', 'vast', 'cliff'],
    desktopPosition: '50% 52%',
    mobilePosition: '50% 54%',
    overlayOpacity: 0.22,
    cardTone: 'neutral-dark',
  }),
  scene({
    id: 'pangong-01',
    label: '水面回声',
    category: '高原湖',
    source: 'https://unsplash.com/photos/mountains-rise-above-a-tranquil-lake-4XwOG6Ah4cU',
    author: 'Rohan Gupta',
    license: 'Unsplash License',
    semanticTags: ['tranquil', 'vast', 'remote', 'reflect'],
    moodTags: ['tranquil', 'reflective', 'open'],
    featuredWords: ['reflect', 'remote', 'vast', 'isolate'],
    desktopPosition: '50% 48%',
    mobilePosition: '54% 50%',
    overlayOpacity: 0.2,
    cardTone: 'cool-dark',
  }),
  scene({
    id: 'aurora-01',
    label: '极光初醒',
    category: '极光 / 星空',
    source: 'https://unsplash.com/photos/aurora-borealis-dances-over-a-mountain-landscape-DwPo-SA3Fjw',
    author: 'Jonas Degener',
    license: 'Unsplash License',
    semanticTags: ['luminous', 'glow', 'radiant', 'ethereal'],
    moodTags: ['luminous', 'quiet', 'night'],
    featuredWords: ['luminous', 'glow', 'radiant', 'infinite'],
    desktopPosition: '50% 50%',
    mobilePosition: '50% 52%',
    overlayOpacity: 0.22,
    cardTone: 'cool-dark',
  }),
  scene({
    id: 'aurora-02',
    label: '夜色流光',
    category: '极光 / 星空',
    source: 'https://unsplash.com/photos/aurora-borealis-above-mountain-and-body-of-water-l9cneQNE03Y',
    author: 'Angela Compagnone',
    license: 'Unsplash License',
    semanticTags: ['aurora', 'glow', 'serene', 'radiant'],
    moodTags: ['radiant', 'serene', 'night'],
    featuredWords: ['radiant', 'luminous', 'reflect', 'infinite'],
    desktopPosition: '50% 48%',
    mobilePosition: '54% 50%',
    overlayOpacity: 0.24,
    cardTone: 'cool-dark',
  }),
  scene({
    id: 'stars-02',
    label: '远处星河',
    category: '极光 / 星空',
    source: 'https://unsplash.com/photos/a-field-with-trees-and-stars-in-the-sky-e_bmabLuhOE',
    author: 'Daniel Bynum',
    license: 'Unsplash License',
    semanticTags: ['cosmic', 'night', 'vast', 'distant'],
    moodTags: ['distant', 'night', 'quiet'],
    featuredWords: ['infinite', 'radiant', 'luminous', 'remote'],
    desktopPosition: '50% 46%',
    mobilePosition: '50% 48%',
    overlayOpacity: 0.25,
    cardTone: 'cool-dark',
  }),
  scene({
    id: 'waterfall-02',
    label: '高瀑与岩壁',
    category: '水景 / 瀑布',
    source: 'https://unsplash.com/photos/tall-waterfall-cascades-down-basalt-columns-in-green-valley-lKdnVgBjc48',
    author: 'Marc Wieland',
    license: 'Unsplash License',
    semanticTags: ['plunge', 'vertical', 'cascade', 'cliff'],
    moodTags: ['vertical', 'green', 'dramatic'],
    featuredWords: ['cascade', 'vertical', 'plunge', 'cliff'],
    desktopPosition: '62% 50%',
    mobilePosition: '65% 50%',
    overlayOpacity: 0.3,
    cardTone: 'cool-dark',
  }),
  scene({
    id: 'waterfall-03',
    label: '山谷水线',
    category: '水景 / 瀑布',
    source: 'https://unsplash.com/photos/a-waterfall-in-the-middle-of-a-lush-green-valley-7Bd8sGIjqvc',
    author: 'Juan Goyache',
    license: 'Unsplash License',
    semanticTags: ['lush', 'valley', 'cascade', 'scenic'],
    moodTags: ['lush', 'green', 'flowing'],
    featuredWords: ['cascade', 'stream', 'meadow', 'remote'],
    desktopPosition: '58% 50%',
    mobilePosition: '62% 50%',
    overlayOpacity: 0.28,
    cardTone: 'cool-dark',
  }),
  scene({
    id: 'penguins-01',
    label: '一起向前',
    category: '动物环境摄影',
    source: 'https://unsplash.com/photos/a-group-of-penguins-standing-on-top-of-a-lush-green-field-h3JubFOr_Is',
    author: 'Martin Wettstein',
    license: 'Unsplash License',
    semanticTags: ['waddle', 'group', 'stride', 'playful'],
    moodTags: ['playful', 'green', 'together'],
    featuredWords: ['waddle', 'stride', 'meadow', 'remote'],
    desktopPosition: '50% 56%',
    mobilePosition: '50% 58%',
    overlayOpacity: 0.24,
    cardTone: 'warm-dark',
  }),
  scene({
    id: 'daisy-02',
    label: '草坡花开',
    category: '花草近景',
    source: 'https://unsplash.com/photos/a-bunch-of-daisies-in-a-field-of-grass-5nPu3UY94RA',
    author: 'Annie Spratt',
    license: 'Unsplash License',
    semanticTags: ['daisy', 'gentle', 'bloom', 'spring'],
    moodTags: ['gentle', 'fresh', 'meadow'],
    featuredWords: ['daisy', 'meadow', 'mild', 'radiant'],
    desktopPosition: '50% 52%',
    mobilePosition: '50% 54%',
    overlayOpacity: 0.3,
    cardTone: 'neutral-dark',
  }),
  scene({
    id: 'lighthouse-02',
    label: '孤独灯塔',
    category: '灯塔 / 独立建筑',
    source: 'https://unsplash.com/photos/a-lighthouse-on-a-grassy-hill-Qk6MMA7YeFE',
    author: 'Ingo Stiller',
    license: 'Unsplash License',
    semanticTags: ['beacon', 'horizon', 'guide', 'remote'],
    moodTags: ['signal', 'solitary', 'open'],
    featuredWords: ['beacon', 'signal', 'solitary', 'remote'],
    desktopPosition: '50% 48%',
    mobilePosition: '52% 50%',
    overlayOpacity: 0.24,
    cardTone: 'neutral-dark',
  }),
  scene({
    id: 'volcano-02',
    label: '火山点燃夜色',
    category: '火山 / 极端自然',
    source: 'https://unsplash.com/photos/a-volcano-erupting-at-night-JChyrFPcWd4',
    author: 'Jeferson Argueta',
    license: 'Unsplash License',
    semanticTags: ['eruption', 'ignite', 'intense', 'dramatic'],
    moodTags: ['intense', 'blaze', 'night'],
    featuredWords: ['eruption', 'blaze', 'ignite', 'severe'],
    desktopPosition: '50% 58%',
    mobilePosition: '50% 60%',
    overlayOpacity: 0.28,
    cardTone: 'warm-dark',
  }),
]

export function chooseBackground(lastId?: string): BackgroundScene {
  const available = backgrounds.filter((background) => background.id !== lastId)
  return available[Math.floor(Math.random() * available.length)] ?? backgrounds[0]
}
