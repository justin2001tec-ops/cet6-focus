import { useEffect, useMemo, useRef, useState } from 'react'
import { HelpCircle, Undo2, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/app/providers'
import { EmptyState } from '@/components/States'
import { IconButton } from '@/components/ui'
import { createSession, finishSession, getCardsByIds, getQueue, getWordsByIds, recordReview, toggleStar, undoLastReview } from '@/db/db'
import { scheduleCard } from '@/lib/fsrs'
import { speakWord } from '@/lib/speech'
import type { LearningCard, QueueItem, StudySessionRecord, Word } from '@/types'
import {
  ContextStage,
  DetailStage,
  LearningComplete,
  LearningStageLoading,
  LearningWordHeader,
  MeaningStage,
  RecognitionActions,
} from '@/features/study/LearningStages'
import {
  hasLearningDetails,
  nextLearningState,
  recognitionToRating,
  type LearningPresentationState,
  type RecognitionChoice,
} from '@/features/study/learning'

interface StudyProps { mode: 'study' | 'review' | 'weak'; onComplete?: () => void }
interface StudyItem { queue: QueueItem; word: Word; card: LearningCard }

export function Study({ mode, onComplete }: StudyProps) {
  const navigate = useNavigate()
  const { settings, refresh, showNotice } = useApp()
  const [items, setItems] = useState<StudyItem[]>([])
  const [index, setIndex] = useState(0)
  const [presentation, setPresentation] = useState<LearningPresentationState>('recall')
  const [recognition, setRecognition] = useState<RecognitionChoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<StudySessionRecord | null>(null)
  const [completed, setCompleted] = useState(false)
  const [ratedStack, setRatedStack] = useState<string[]>([])
  const [ratingBusy, setRatingBusy] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const cardStartedAt = useRef(Date.now())
  const ratingInFlight = useRef(false)
  const queueSettings = useMemo(() => ({ dailyNewWords: settings.dailyNewWords }), [settings.dailyNewWords])
  const reducedMotion = settings.reducedMotion || prefersReducedMotion

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setPrefersReducedMotion(media.matches)
    update()
    media.addEventListener?.('change', update)
    return () => media.removeEventListener?.('change', update)
  }, [])

  useEffect(() => {
    let active = true
    setItems([])
    setIndex(0)
    setPresentation('recall')
    setRecognition(null)
    setCompleted(false)
    setRatedStack([])
    setSession(null)
    cardStartedAt.current = Date.now()
    setLoading(true)
    getQueue(mode, queueSettings).then(async (queue) => {
      const ids = queue.map((item) => item.wordId)
      const [words, cards] = await Promise.all([getWordsByIds(ids), getCardsByIds(ids)])
      const nextItems = queue.map((queueItem) => {
        const word = words.find((candidate) => candidate.id === queueItem.wordId)
        const card = cards.find((candidate) => candidate.wordId === queueItem.wordId)
        return word && card ? { queue: queueItem, word, card } : null
      }).filter((item): item is StudyItem => Boolean(item))
      if (active) {
        setItems(nextItems)
        if (nextItems.length) setSession(await createSession(mode))
      }
    }).catch(() => showNotice('学习队列加载失败，请稍后重试。')).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [mode, queueSettings, showNotice])

  useEffect(() => () => {
    if (session) void finishSession(session.id)
  }, [session])

  const current = items[index]

  useEffect(() => {
    if (!current || !settings.autoplayPronunciation || presentation !== 'recall') return
    const timer = window.setTimeout(() => speakWord(current.word.word, settings.pronunciation), 140)
    return () => window.clearTimeout(timer)
  }, [current, presentation, settings.autoplayPronunciation, settings.pronunciation])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable || target.closest('button,a'))) return
      if (event.key === '?') {
        event.preventDefault()
        setShowHelp((value) => !value)
        return
      }
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault()
        advancePresentation()
      } else if (presentation === 'recall' && ['1', '2', '3'].includes(event.key)) {
        event.preventDefault()
        chooseRecognition(event.key === '1' ? 'known' : event.key === '2' ? 'fuzzy' : 'unknown')
      } else if (event.key.toLowerCase() === 'p' && current) {
        event.preventDefault()
        speakWord(current.word.word, settings.pronunciation)
      } else if (event.key.toLowerCase() === 's' && current) {
        event.preventDefault()
        void toggleCurrentStar()
      } else if (event.key.toLowerCase() === 'z') {
        event.preventDefault()
        void undo()
      } else if (event.key === 'Escape') {
        event.preventDefault()
        navigate('/')
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  function chooseRecognition(choice: Exclude<RecognitionChoice, 'mastered'>) {
    if (!current || ratingBusy) return
    setRecognition(choice)
    setPresentation(nextLearningState(choice, current.word))
  }

  function advancePresentation() {
    if (ratingBusy || !recognition) return
    if (presentation === 'context') {
      setPresentation('meaning')
    } else if (presentation === 'meaning') {
      if (current && hasLearningDetails(current.word)) setPresentation('detail')
      else void rate()
    } else if (presentation === 'detail') {
      void rate()
    }
  }

  async function toggleCurrentStar() {
    if (!current) return
    const next = await toggleStar(current.word.id)
    if (next) setItems((existing) => existing.map((item) => item.word.id === current.word.id ? { ...item, card: next } : item))
  }

  async function rate() {
    if (!current || !session || !recognition || ratingInFlight.current) return
    ratingInFlight.current = true
    setRatingBusy(true)
    const currentIndex = index
    try {
      const before = current.card
      const rating = recognitionToRating[recognition]
      const result = scheduleCard(before.fsrsCard, rating, new Date(), settings.targetRetention)
      const after: LearningCard = { ...before, due: result.card.due, fsrsCard: result.card, updatedAt: new Date().toISOString() }
      await recordReview({ wordId: before.wordId, sessionId: session.id, rating, before, after, durationMs: Math.max(0, Date.now() - cardStartedAt.current) })
      await refresh()
      setItems((existing) => existing.map((item, itemIndex) => itemIndex === currentIndex ? { ...item, card: after } : item))
      setRatedStack((existing) => [...existing, before.wordId])
      setPresentation('transitioning')
      await waitForMotion(reducedMotion)
      if (currentIndex >= items.length - 1) {
        await finishSession(session.id)
        await refresh()
        setCompleted(true)
      } else {
        setIndex(currentIndex + 1)
        setRecognition(null)
        setPresentation('recall')
        cardStartedAt.current = Date.now()
      }
    } catch {
      showNotice('学习记录保存失败，请检查本地存储后重试。')
      setPresentation(recognition ? nextLearningState(recognition, current.word) : 'recall')
    } finally {
      ratingInFlight.current = false
      setRatingBusy(false)
    }
  }

  async function undo() {
    if (!session || ratedStack.length === 0 || ratingBusy) return
    const log = await undoLastReview(session.id)
    if (!log) return
    const restoredIndex = items.findIndex((item) => item.word.id === log.wordId)
    setItems((existing) => existing.map((item) => item.word.id === log.wordId ? { ...item, card: { ...item.card, due: log.before.due, fsrsCard: log.before } } : item))
    setIndex(restoredIndex >= 0 ? restoredIndex : Math.max(0, index - 1))
    setRecognition(null)
    setPresentation('recall')
    setCompleted(false)
    setRatedStack((existing) => existing.slice(0, -1))
    cardStartedAt.current = Date.now()
    await refresh()
  }

  function resetRound() {
    setIndex(0)
    setCompleted(false)
    setRatedStack([])
    setRecognition(null)
    setPresentation('recall')
    cardStartedAt.current = Date.now()
  }

  const modeLabel = mode === 'review' ? '到期复习' : mode === 'weak' ? '薄弱词强化' : '今日学习'
  const progress = items.length ? Math.round(((completed ? items.length : index) / items.length) * 100) : 0
  const shellClass = `learning-shell learning-shell--${presentation} ${reducedMotion ? 'learning-shell--reduced-motion' : ''}`

  if (loading) return <div className="learning-shell learning-shell--loading"><div className="learning-shell__atmosphere" /><div className="learning-shell__inner"><LearningStageLoading /></div></div>

  return (
    <div className={shellClass} data-learning-mode={mode} data-learning-state={presentation}>
      <div className="learning-shell__atmosphere" aria-hidden="true" />
      <div className="learning-shell__inner">
        {items.length > 0 && <LearningTopbar modeLabel={modeLabel} progress={progress} index={index} total={items.length} completed={completed} canUndo={ratedStack.length > 0} onUndo={() => void undo()} onHelp={() => setShowHelp(true)} onExit={() => navigate('/')} />}
        {completed ? (
          <LearningComplete mode={mode} count={items.length} onUndo={ratedStack.length ? () => void undo() : undefined} onContinue={onComplete} onAgain={resetRound} onHome={() => navigate('/')} />
        ) : current ? (
          <>
            {presentation === 'recall' && <RecallStage item={current} recognition={recognition} disabled={ratingBusy} onChoose={chooseRecognition} onSpeak={() => speakWord(current.word.word, settings.pronunciation)} onToggleStar={() => void toggleCurrentStar()} />}
            {presentation === 'context' && recognition && <ContextStage word={current.word} choice={recognition} starred={current.card.starred} onSpeak={() => speakWord(current.word.word, settings.pronunciation)} onToggleStar={() => void toggleCurrentStar()} onBack={() => { setRecognition(null); setPresentation('recall') }} onContinue={() => setPresentation('meaning')} />}
            {presentation === 'meaning' && recognition && <MeaningStage word={current.word} choice={recognition} starred={current.card.starred} onSpeak={() => speakWord(current.word.word, settings.pronunciation)} onToggleStar={() => void toggleCurrentStar()} onBack={() => { setRecognition(null); setPresentation('recall') }} onExpand={() => setPresentation('detail')} onConfirm={() => void rate()} />}
            {presentation === 'detail' && recognition && <DetailStage word={current.word} choice={recognition} starred={current.card.starred} onSpeak={() => speakWord(current.word.word, settings.pronunciation)} onToggleStar={() => void toggleCurrentStar()} onBack={() => setPresentation('meaning')} onConfirm={() => void rate()} />}
            {presentation === 'transitioning' && <TransitionStage word={current.word} />}
          </>
        ) : (
          <LearningEmpty mode={mode} onExit={() => navigate('/')} />
        )}
      </div>
      {showHelp && <LearningHelp onClose={() => setShowHelp(false)} />}
    </div>
  )
}

function RecallStage({ item, recognition, disabled, onChoose, onSpeak, onToggleStar }: {
  item: StudyItem
  recognition: RecognitionChoice | null
  disabled: boolean
  onChoose: (choice: Exclude<RecognitionChoice, 'mastered'>) => void
  onSpeak: () => void
  onToggleStar: () => void
}) {
  return (
    <section className="learning-stage learning-stage--recall" aria-labelledby="learning-recall-title">
      <LearningWordHeader word={item.word} starred={item.card.starred} onSpeak={onSpeak} onToggleStar={onToggleStar} />
      <div className="learning-recall__prompt">
        <p id="learning-recall-title" className="learning-section-kicker">先凭记忆想一想</p>
        <p>不急着看答案，先判断它在你脑中有多清楚。</p>
      </div>
      <RecognitionActions selected={recognition} disabled={disabled} onChoose={onChoose} />
    </section>
  )
}

function TransitionStage({ word }: { word: Word }) {
  return <section className="learning-stage learning-stage--transitioning" aria-live="polite"><div className="learning-transition-word">{word.word}</div><p>保存这一刻，准备下一个。</p></section>
}

function LearningTopbar({ modeLabel, progress, index, total, completed, canUndo, onUndo, onHelp, onExit }: { modeLabel: string; progress: number; index: number; total: number; completed: boolean; canUndo: boolean; onUndo: () => void; onHelp: () => void; onExit: () => void }) {
  return (
    <header className="learning-topbar">
      <IconButton label="退出学习" onClick={onExit}><X size={19} /></IconButton>
      <div className="learning-progress" aria-label={`${modeLabel}进度`}>
        <span className="learning-progress__mode">{modeLabel}</span>
        <div className="learning-progress__track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><span style={{ width: `${progress}%` }} /></div>
        <span className="learning-progress__count">{completed ? '完成' : `${index + 1} / ${total}`}</span>
      </div>
      <div className="learning-topbar__actions">
        {canUndo && <button type="button" className="learning-undo" onClick={onUndo}><Undo2 size={15} /> 撤销</button>}
        <IconButton label="查看键盘帮助" onClick={onHelp}><HelpCircle size={19} /></IconButton>
      </div>
    </header>
  )
}

function LearningHelp({ onClose }: { onClose: () => void }) {
  return (
    <div className="learning-help-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="learning-help" role="dialog" aria-modal="true" aria-labelledby="learning-help-title">
        <div className="learning-help__header"><div><p className="learning-section-kicker">Keyboard</p><h2 id="learning-help-title">用键盘保持节奏</h2></div><IconButton label="关闭键盘帮助" onClick={onClose}><X size={18} /></IconButton></div>
        <dl className="learning-help__list">
          <div><dt>1 / 2 / 3</dt><dd>认识 / 模糊 / 不认识</dd></div>
          <div><dt>Space / Enter</dt><dd>继续或展开</dd></div>
          <div><dt>Z</dt><dd>撤销上一词</dd></div>
          <div><dt>P · S · Esc</dt><dd>发音 · 收藏 · 退出</dd></div>
        </dl>
      </section>
    </div>
  )
}

function LearningEmpty({ mode, onExit }: { mode: StudyProps['mode']; onExit: () => void }) {
  const title = mode === 'review' ? '现在没有到期复习。' : mode === 'weak' ? '暂时没有需要强化的词。' : '今天的学习队列已经清空。'
  return <div className="learning-empty"><p className="learning-section-kicker">{mode === 'review' ? '到期复习' : mode === 'weak' ? '薄弱词强化' : '今日学习'}</p><h1>{title}</h1><p>把这点空白留给之后的自己。你也可以去听写或整理词库。</p><EmptyState title="没有需要立即处理的单词" description="新的学习内容会根据你的真实记录继续出现。" action={<button type="button" className="learning-empty__exit" onClick={onExit}>回到首页</button>} /></div>
}

function waitForMotion(reducedMotion: boolean): Promise<void> {
  if (reducedMotion) return Promise.resolve()
  return new Promise((resolve) => window.setTimeout(resolve, 240))
}
