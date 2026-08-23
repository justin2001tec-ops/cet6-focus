import { withBase } from '@/lib/public-path'

export interface Background {
  id: string
  label: string
  avif: string
  webp: string
  objectPosition?: string
  overlayLight?: number
  overlayDark?: number
  source: string
  author: string
  license: string
}

export const backgrounds: Background[] = [
  {
    id: 'study-01',
    label: '山谷日光',
    avif: withBase('backgrounds/study-01.avif'),
    webp: withBase('backgrounds/study-01.webp'),
    objectPosition: 'center 50%',
    overlayLight: 0.8,
    overlayDark: 0.58,
    source: 'https://commons.wikimedia.org/wiki/File:Mountain_Valley.jpg',
    author: 'Jasper Boer',
    license: 'CC0 1.0',
  },
  {
    id: 'study-02',
    label: '湖畔远山',
    avif: withBase('backgrounds/study-02.avif'),
    webp: withBase('backgrounds/study-02.webp'),
    objectPosition: 'center 50%',
    overlayLight: 0.82,
    overlayDark: 0.6,
    source: 'https://commons.wikimedia.org/wiki/File:Landscape_with_mountain,_forest_and_lake_with_reflection.jpg',
    author: 'Dev Vora',
    license: 'CC BY 4.0',
  },
  {
    id: 'study-03',
    label: '林间小路',
    avif: withBase('backgrounds/study-03.avif'),
    webp: withBase('backgrounds/study-03.webp'),
    objectPosition: 'center 48%',
    overlayLight: 0.86,
    overlayDark: 0.64,
    source: 'https://commons.wikimedia.org/wiki/File:Forest_path_and_trees.jpg',
    author: 'Denis Zastanceanu',
    license: 'CC BY-SA 4.0',
  },
  {
    id: 'study-04',
    label: '秋日山径',
    avif: withBase('backgrounds/study-04.avif'),
    webp: withBase('backgrounds/study-04.webp'),
    objectPosition: 'center 52%',
    overlayLight: 0.84,
    overlayDark: 0.62,
    source: 'https://commons.wikimedia.org/wiki/File:The_forest_path_(6244216669).jpg',
    author: 'Randi Hausken',
    license: 'CC BY-SA 2.0',
  },
  {
    id: 'study-05',
    label: '安静阅览室',
    avif: withBase('backgrounds/study-05.avif'),
    webp: withBase('backgrounds/study-05.webp'),
    objectPosition: 'center 45%',
    overlayLight: 0.88,
    overlayDark: 0.68,
    source: 'https://commons.wikimedia.org/wiki/File:Modern_library_interior_with_chairs.jpg',
    author: 'Shixart1985',
    license: 'CC BY 2.0',
  },
  {
    id: 'study-06',
    label: '窗边图书馆',
    avif: withBase('backgrounds/study-06.avif'),
    webp: withBase('backgrounds/study-06.webp'),
    objectPosition: 'center 52%',
    overlayLight: 0.9,
    overlayDark: 0.72,
    source: 'https://commons.wikimedia.org/wiki/File:Deanwood_Neighborhood_Library-interior.jpg',
    author: 'Carol M. Highsmith',
    license: 'Public domain',
  },
  {
    id: 'study-07',
    label: '湖光山色',
    avif: withBase('backgrounds/study-07.avif'),
    webp: withBase('backgrounds/study-07.webp'),
    objectPosition: 'center 44%',
    overlayLight: 0.86,
    overlayDark: 0.66,
    source: 'https://commons.wikimedia.org/wiki/File:Picturesque_landscape_over_the_lake.jpg',
    author: 'MuraliMenon22',
    license: 'CC BY 4.0',
  },
  {
    id: 'study-08',
    label: '林影倒映',
    avif: withBase('backgrounds/study-08.avif'),
    webp: withBase('backgrounds/study-08.webp'),
    objectPosition: 'center 48%',
    overlayLight: 0.9,
    overlayDark: 0.72,
    source: 'https://commons.wikimedia.org/wiki/File:Reflection_of_forest_in_lake_water._(edbfdc057a2e48cc8b8f42e3fe2105a9).jpg',
    author: 'Kevin Bacher (MORA)',
    license: 'Public domain',
  },
  {
    id: 'study-09',
    label: '云下湖面',
    avif: withBase('backgrounds/study-09.avif'),
    webp: withBase('backgrounds/study-09.webp'),
    objectPosition: 'center 48%',
    overlayLight: 0.88,
    overlayDark: 0.68,
    source: 'https://commons.wikimedia.org/wiki/File:Dal_Lake_landscape_reflection,_Srinagar,_Kashmir,_India.jpg',
    author: 'Kreativeart',
    license: 'CC BY-SA 4.0',
  },
  {
    id: 'study-10',
    label: '雪峰之间',
    avif: withBase('backgrounds/study-10.avif'),
    webp: withBase('backgrounds/study-10.webp'),
    objectPosition: 'center 52%',
    overlayLight: 0.86,
    overlayDark: 0.66,
    source: 'https://commons.wikimedia.org/wiki/File:Valley,_Tengboche,_Nepal.jpg',
    author: 'Vyacheslav Argenberg',
    license: 'CC BY 4.0',
  },
]

export function chooseBackground(lastId?: string): Background {
  const available = backgrounds.filter((background) => background.id !== lastId)
  return available[Math.floor(Math.random() * available.length)] ?? backgrounds[0]
}
