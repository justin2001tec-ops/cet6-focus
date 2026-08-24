import type { Word, RatingValue } from '@/types'

export type LearningPresentationState = 'recall' | 'context' | 'meaning' | 'detail' | 'transitioning'

export type RecognitionChoice = 'known' | 'fuzzy' | 'unknown' | 'mastered'

export const recognitionToRating: Record<RecognitionChoice, RatingValue> = {
  unknown: 1,
  fuzzy: 2,
  known: 3,
  mastered: 4,
}

export const recognitionOptions: Array<{
  value: Exclude<RecognitionChoice, 'mastered'>
  label: string
  description: string
}> = [
  { value: 'known', label: '认识', description: '我能说出大意' },
  { value: 'fuzzy', label: '模糊', description: '见过，但不够稳' },
  { value: 'unknown', label: '不认识', description: '需要重新建立记忆' },
]

export function recognitionLabel(choice: RecognitionChoice): string {
  if (choice === 'known') return '认识'
  if (choice === 'fuzzy') return '模糊'
  if (choice === 'mastered') return '熟词'
  return '不认识'
}

export function nextLearningState(choice: RecognitionChoice, word: Word): LearningPresentationState {
  if ((choice === 'unknown' || choice === 'fuzzy') && word.examples?.length) return 'context'
  return 'meaning'
}

export function hasLearningDetails(word: Word): boolean {
  return Boolean(
    word.meaningZh.length > 1
      || word.definitionEn?.length
      || (word.examples?.length ?? 0) > 1
      || word.collocations?.length
      || (word.wordForms && Object.keys(word.wordForms).length),
  )
}
