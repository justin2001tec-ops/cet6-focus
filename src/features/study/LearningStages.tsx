import { useRef, useState } from 'react'
import { Check, ChevronDown, Home, Undo2, Volume2 } from 'lucide-react'
import { Button } from '@/components/ui'
import { ApplePressable } from '@/design-system/components'
import { TintedGlassPrimaryAction } from '@/design-system/glass/GlassControls'
import { hasLearningDetails, recognitionLabel, recognitionOptions, type RecognitionChoice } from '@/features/study/learning'
import type { Word } from '@/types'
import { BottomActionDock } from './BottomActionDock'
import { MeaningReadingSurface } from './MeaningReadingSurface'
import { OverflowGlassButton, StudyOverflowMenu } from './StudyOverflowMenu'
import { StudyHero } from './StudyHero'

interface LearningWordHeaderProps {
  word: Word
  starred: boolean
  compact?: boolean
  onSpeak: () => void
  onToggleStar: () => void
}

export function LearningWordHeader({ word, starred, compact = false, onSpeak, onToggleStar }: LearningWordHeaderProps) {
  return <StudyHero word={word} starred={starred} compact={compact} onSpeak={onSpeak} onToggleStar={onToggleStar} />
}

export function LearningAtmosphere() {
  return (
    <div className="learning-shell__atmosphere" aria-hidden="true">
      <span className="learning-shell__atmosphere-layer learning-shell__atmosphere-layer--base" />
      <span className="learning-shell__atmosphere-layer learning-shell__atmosphere-layer--context" />
      <span className="learning-shell__atmosphere-layer learning-shell__atmosphere-layer--meaning" />
      <span className="learning-shell__atmosphere-layer learning-shell__atmosphere-layer--detail" />
      <span className="learning-shell__atmosphere-layer learning-shell__atmosphere-layer--transitioning" />
      <span className="learning-shell__atmosphere-layer learning-shell__atmosphere-layer--loading" />
    </div>
  )
}

export function RecognitionActions({ selected, disabled, onChoose }: { selected: RecognitionChoice | null; disabled?: boolean; onChoose: (choice: Exclude<RecognitionChoice, 'mastered'>) => void }) {
  return (
    <section className="learning-recognition" aria-label="回忆判断">
      <div className="learning-recognition__grid">
        {recognitionOptions.map((option) => (
          <ApplePressable
            type="button"
            key={option.value}
            className={`learning-recognition__button ${selected === option.value ? 'is-selected' : ''}`}
            aria-pressed={selected === option.value}
            disabled={disabled}
            onClick={() => onChoose(option.value)}
          >
            <strong>{option.label}</strong>
          </ApplePressable>
        ))}
      </div>
    </section>
  )
}

export function ContextStage({ word, choice, starred, onSpeak, onToggleStar, onBack, onContinue }: {
  word: Word
  choice: RecognitionChoice
  starred: boolean
  onSpeak: () => void
  onToggleStar: () => void
  onBack: () => void
  onContinue: () => void
}) {
  const example = word.examples?.[0]
  if (!example) return null

  return (
    <section className="learning-stage learning-stage--context" aria-labelledby="learning-context-title">
      <LearningWordHeader word={word} starred={starred} compact onSpeak={onSpeak} onToggleStar={onToggleStar} />
      <MeaningReadingSurface className="learning-context-surface">
        <p id="learning-context-title" className="learning-section-kicker">语境提示</p>
        <p className="learning-example learning-example--large">{highlightExample(example.en, word.word)}</p>
        <p className="learning-context-surface__note">再读一遍，看看它在句子里承担什么含义。</p>
        <span className="learning-choice-chip">你的判断：{recognitionLabel(choice)}</span>
      </MeaningReadingSurface>
      <BottomActionDock>
        <Button variant="ghost" onClick={onBack}>重新判断</Button>
        <TintedGlassPrimaryAction onClick={onContinue}>查看核心词义 <ChevronDown size={16} /></TintedGlassPrimaryAction>
      </BottomActionDock>
    </section>
  )
}

export function MeaningStage({ word, starred, onSpeak, onToggleStar, onBack, onExpand, onConfirm }: {
  word: Word
  starred: boolean
  onSpeak: () => void
  onToggleStar: () => void
  onBack: () => void
  onExpand: () => void
  onConfirm: () => void
}) {
  const example = word.examples?.[0]
  const canExpand = hasLearningDetails(word)
  const [overflowOpen, setOverflowOpen] = useState(false)
  const overflowAnchorRef = useRef<HTMLButtonElement | null>(null)

  function closeOverflow() {
    setOverflowOpen(false)
  }

  return (
    <section className="learning-stage learning-stage--meaning" aria-labelledby="learning-meaning-title">
      <LearningWordHeader word={word} starred={starred} compact onSpeak={onSpeak} onToggleStar={onToggleStar} />
      <MeaningReadingSurface className="learning-meaning-surface">
        <p id="learning-meaning-title" className="learning-section-kicker">核心词义</p>
        <p className="learning-core-meaning">{normalizeText(word.meaningZh[0])}</p>
        {word.pos?.length ? <p className="learning-pos">{word.pos.join(' · ')}</p> : null}
        {example && <div className="learning-example-block"><span>例句</span><p>{highlightExample(example.en, word.word)}</p>{example.zh && <small>{example.zh}</small>}</div>}
      </MeaningReadingSurface>
      <BottomActionDock>
        <Button variant="ghost" className="learning-stage-actions__secondary" onClick={onBack}>返回</Button>
        {canExpand && <div className="learning-stage-actions__overflow">
          <OverflowGlassButton anchorRef={overflowAnchorRef} open={overflowOpen} onClick={() => setOverflowOpen(true)} aria-label="更多" />
          <StudyOverflowMenu open={overflowOpen} anchorRef={overflowAnchorRef} onClose={closeOverflow} onExpand={() => { closeOverflow(); onExpand() }} />
        </div>}
        <TintedGlassPrimaryAction onClick={onConfirm}>继续</TintedGlassPrimaryAction>
      </BottomActionDock>
    </section>
  )
}

export function DetailStage({ word, starred, onSpeak, onToggleStar, onBack, onConfirm }: {
  word: Word
  starred: boolean
  onSpeak: () => void
  onToggleStar: () => void
  onBack: () => void
  onConfirm: () => void
}) {
  const extraMeanings = word.meaningZh.slice(1)
  const examples = word.examples?.slice(1) ?? []
  const wordForms = word.wordForms ? Object.entries(word.wordForms) : []

  return (
    <section className="learning-stage learning-stage--detail" aria-labelledby="learning-detail-title">
      <LearningWordHeader word={word} starred={starred} compact onSpeak={onSpeak} onToggleStar={onToggleStar} />
      <MeaningReadingSurface className="learning-detail-surface">
        <p id="learning-detail-title" className="learning-section-kicker">扩展理解</p>
        <p className="learning-core-meaning learning-core-meaning--detail">{normalizeText(word.meaningZh[0])}</p>
        {extraMeanings.length > 0 && <DetailBlock label="更多中文义"><ul>{extraMeanings.map((meaning) => <li key={meaning}>{normalizeText(meaning)}</li>)}</ul></DetailBlock>}
        {word.definitionEn?.length ? <DetailBlock label="English definition"><p>{word.definitionEn.map(normalizeText).join('；')}</p></DetailBlock> : null}
        {examples.length > 0 && <DetailBlock label="更多例句"><div className="learning-detail-list">{examples.map((example) => <div key={example.en}><p>{highlightExample(normalizeText(example.en), word.word)}</p>{example.zh && <small>{normalizeText(example.zh)}</small>}</div>)}</div></DetailBlock>}
        {word.collocations?.length ? <DetailBlock label="搭配"><ul>{word.collocations.map((item) => <li key={item}>{normalizeText(item)}</li>)}</ul></DetailBlock> : null}
        {wordForms.length > 0 && <DetailBlock label="词形变化"><dl>{wordForms.map(([form, value]) => <div key={form}><dt>{form}</dt><dd>{normalizeText(value)}</dd></div>)}</dl></DetailBlock>}
      </MeaningReadingSurface>
      <BottomActionDock sticky>
        <Button variant="ghost" className="learning-stage-actions__secondary" onClick={onBack}>返回核心词义</Button>
        <TintedGlassPrimaryAction onClick={onConfirm}>继续</TintedGlassPrimaryAction>
      </BottomActionDock>
    </section>
  )
}

function DetailBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return <section className="learning-detail-block"><span>{label}</span>{children}</section>
}

function highlightExample(example: string, word: string): React.ReactNode {
  const safeWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = example.split(new RegExp(`(${safeWord})`, 'ig'))
  return parts.map((part, index) => part.toLocaleLowerCase() === word.toLocaleLowerCase() ? <mark key={`${part}-${index}`}>{part}</mark> : part)
}

function normalizeText(value: string): string {
  return value.replace(/\\n/g, '\n')
}

export function LearningComplete({ mode, count, onUndo, onContinue, onAgain, onHome }: {
  mode: 'study' | 'review' | 'weak'
  count?: number
  onUndo?: () => void
  onContinue?: () => void
  onAgain: () => void
  onHome: () => void
}) {
  const modeLabel = mode === 'review' ? '到期复习' : mode === 'weak' ? '薄弱词强化' : '今日学习'
  const primaryLabel = onContinue ? (mode === 'review' ? '继续今日学习' : '进入听写强化') : '回到首页'
  const primaryAction = onContinue ?? onHome

  return (
    <section className="learning-complete" aria-labelledby="learning-complete-title">
      <div className="learning-complete__mark"><Check size={23} /></div>
      <p className="learning-section-kicker">{modeLabel}完成</p>
      <h1 id="learning-complete-title">这一组，完成了。</h1>
      <p className="learning-complete__summary">{count ? `你处理了 ${count} 个单词。` : '这一段学习已经保存。'}</p>
      <div className="learning-complete__actions">
        {onUndo && <Button variant="ghost" onClick={onUndo}><Undo2 size={16} /> 撤销上一词</Button>}
        <Button onClick={primaryAction}>{primaryLabel}{primaryLabel === '回到首页' && <Home size={16} />}</Button>
        <Button variant="soft" onClick={onAgain}>再学一组</Button>
      </div>
    </section>
  )
}

export function LearningStageLoading() {
  return <div className="learning-stage-loading" role="status"><span className="learning-stage-loading__line" />正在准备下一段学习…</div>
}

export function LearningAudioIcon() {
  return <Volume2 size={15} aria-hidden="true" />
}
