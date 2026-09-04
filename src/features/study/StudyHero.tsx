import { Bookmark } from 'lucide-react'
import { GlassAudioControl, GlassIconButton } from '@/design-system/glass/GlassControls'
import type { Word } from '@/types'

interface StudyHeroProps {
  word: Word
  starred: boolean
  compact?: boolean
  onSpeak: () => void
  onToggleStar: () => void
}

export function StudyHero({ word, starred, compact = false, onSpeak, onToggleStar }: StudyHeroProps) {
  const length = [...word.word].length
  const lengthClass = length <= 10 ? 'short' : length <= 14 ? 'medium' : length <= 18 ? 'long' : 'very-long'

  return (
    <header className={`learning-word-header study-hero learning-word-header--length-${lengthClass} ${compact ? 'learning-word-header--compact' : ''}`} data-content-layer="word-hero">
      <div className="learning-word-header__copy">
        <h1>{word.word}</h1>
        <div className="learning-word-header__phonetic"><span>{word.phonetic || '/—/'}</span></div>
      </div>
      <div className="learning-word-header__actions" data-functional-layer="word-controls">
        <GlassAudioControl onClick={onSpeak} label="播放发音" />
        <GlassIconButton label={starred ? '取消重点标记' : '标记重点'} variant={starred ? 'regular' : 'clear'} aria-pressed={starred} className={starred ? 'is-selected' : ''} onClick={onToggleStar}>
          <Bookmark size={18} strokeWidth={1.8} fill={starred ? 'currentColor' : 'none'} />
        </GlassIconButton>
      </div>
    </header>
  )
}
