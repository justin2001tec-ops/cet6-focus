import { useEffect, useMemo, useRef, useState } from 'react'
import { Bookmark, Check, CircleHelp, Keyboard, Pause, RotateCcw, Sparkles, Undo2, Volume2, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/app/providers'
import { AudioButton, PageHeader } from '@/components/AppShell'
import { EmptyState } from '@/components/States'
import { Badge, Button, IconButton } from '@/components/ui'
import { createSession, finishSession, getCardsByIds, getQueue, getWordsByIds, recordReview, toggleStar, undoLastReview } from '@/db/db'
import { formatDue } from '@/lib/dates'
import { previewIntervals, scheduleCard } from '@/lib/fsrs'
import { speakWord } from '@/lib/speech'
import type { LearningCard, QueueItem, RatingValue, StudySessionRecord, Word } from '@/types'

interface StudyProps { mode: 'study' | 'review' | 'weak'; onComplete?: () => void }
interface StudyItem { queue: QueueItem; word: Word; card: LearningCard }

const ratingOptions: Array<{ rating: RatingValue; key: string; label: string; tone: string }> = [
  { rating: 1, key: '1', label: '忘记', tone: 'again' },
  { rating: 2, key: '2', label: '困难', tone: 'hard' },
  { rating: 3, key: '3', label: '良好', tone: 'good' },
  { rating: 4, key: '4', label: '轻松', tone: 'easy' },
]

export function Study({ mode, onComplete }: StudyProps) {
  const navigate = useNavigate()
  const { settings, refresh, showNotice } = useApp()
  const [items, setItems] = useState<StudyItem[]>([])
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<StudySessionRecord | null>(null)
  const cardStartedAt = useRef(Date.now())
  const [completed, setCompleted] = useState(false)
  const [ratedStack, setRatedStack] = useState<string[]>([])
  const [ratingBusy, setRatingBusy] = useState(false)
  const ratingInFlight = useRef(false)
  const queueSettings = useMemo(() => ({ dailyNewWords: settings.dailyNewWords }), [settings.dailyNewWords])

  useEffect(() => {
    let active = true
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
  const preview = useMemo(() => current ? previewIntervals(current.card.fsrsCard, new Date(), settings.targetRetention) : null, [current, settings.targetRetention])

  useEffect(() => {
    if (!current || !settings.autoplayPronunciation || !revealed) return
    const timer = window.setTimeout(() => speakWord(current.word.word, settings.pronunciation), 120)
    return () => window.clearTimeout(timer)
  }, [current, revealed, settings.autoplayPronunciation, settings.pronunciation])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)) return
      if (event.key === ' ') {
        event.preventDefault()
        if (!revealed) setRevealed(true)
      } else if (revealed && ['1', '2', '3', '4'].includes(event.key)) {
        event.preventDefault()
        void rate(Number(event.key) as RatingValue)
      } else if (event.key.toLowerCase() === 'p' && current) {
        speakWord(current.word.word, settings.pronunciation)
      } else if (event.key.toLowerCase() === 's' && current) {
        void toggleStar(current.word.id)
        setItems((existing) => existing.map((item) => item.word.id === current.word.id ? { ...item, card: { ...item.card, starred: !item.card.starred } } : item))
      } else if (event.key.toLowerCase() === 'z') {
        void undo()
      } else if (event.key === 'Escape') {
        navigate('/')
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  async function rate(rating: RatingValue) {
    if (!current || !session || !revealed || ratingInFlight.current) return
    ratingInFlight.current = true
    setRatingBusy(true)
    try {
      const before = current.card
      const result = scheduleCard(before.fsrsCard, rating, new Date(), settings.targetRetention)
      const after: LearningCard = { ...before, due: result.card.due, fsrsCard: result.card, updatedAt: new Date().toISOString() }
      await recordReview({ wordId: before.wordId, sessionId: session.id, rating, before, after, durationMs: Math.max(0, Date.now() - cardStartedAt.current) })
      await refresh()
      setItems((existing) => existing.map((item, itemIndex) => itemIndex === index ? { ...item, card: after } : item))
      setRatedStack((existing) => [...existing, before.wordId])
      if (index >= items.length - 1) {
        await finishSession(session.id)
        setCompleted(true)
        await refresh()
      } else {
        setIndex((existing) => existing + 1)
        setRevealed(false)
        cardStartedAt.current = Date.now()
      }
    } catch {
      showNotice('评分保存失败，请检查本地存储后重试。')
    } finally {
      ratingInFlight.current = false
      setRatingBusy(false)
    }
  }

  async function undo() {
    if (!session || ratedStack.length === 0) return
    const log = await undoLastReview(session.id)
    if (!log) return
    const restoredIndex = items.findIndex((item) => item.word.id === log.wordId)
    setItems((existing) => existing.map((item) => item.word.id === log.wordId ? { ...item, card: { ...item.card, due: log.before.due, fsrsCard: log.before } } : item))
    setIndex(restoredIndex >= 0 ? restoredIndex : Math.max(0, index - 1))
    setRevealed(false)
    setCompleted(false)
    setRatedStack((existing) => existing.slice(0, -1))
    cardStartedAt.current = Date.now()
    await refresh()
  }

  if (loading) return <div className="page page--center"><div className="loading-line" />正在整理今天的队列…</div>
  if (completed) return <StudyComplete mode={mode} count={items.length} onUndo={ratedStack.length ? () => void undo() : undefined} onContinue={onComplete} onAgain={() => { setIndex(0); setCompleted(false); setRatedStack([]); setRevealed(false); cardStartedAt.current = Date.now() }} onHome={() => navigate('/')} />
  if (!current) return <div className="page"><PageHeader eyebrow={mode === 'review' ? 'Review' : 'Study'} title={mode === 'review' ? '现在没有到期复习。' : '今天的学习队列已经清空。'} description="把这一点空白留给之后的自己。你也可以去听写或整理词库。" /><EmptyState title="没有需要立即处理的卡片" description={mode === 'review' ? '新的到期词会根据 FSRS 自动出现。' : '如果想继续，可以从词库或薄弱词开始专项练习。'} action={<div className="empty-state__actions"><Button onClick={() => navigate('/dictation')}><Volume2 size={16} /> 去听写</Button><Button variant="soft" onClick={() => navigate('/words')}>浏览词库</Button></div>} /></div>

  return (
    <div className="page page--study">
      <header className="study-toolbar"><div><p className="eyebrow">{mode === 'review' ? '到期复习' : mode === 'weak' ? '薄弱词强化' : '今日学习'}</p><div className="study-progress"><strong>{index + 1}</strong><span>/ {items.length}</span><div className="progress-track"><div className="progress-fill" style={{ width: `${((index + 1) / items.length) * 100}%` }} /></div></div></div><div className="study-toolbar__actions"><span className="keyboard-hint"><Keyboard size={15} /> Space 显示 · 1–4 评分</span>{ratedStack.length > 0 && <button type="button" className="toolbar-undo" onClick={() => void undo()}><Undo2 size={14} /> 撤销上一张</button>}<IconButton label="回到首页" onClick={() => navigate('/')}><X size={18} /></IconButton></div></header>
      <section className={`study-card card-surface ${revealed ? 'is-revealed' : ''}`}>
        <div className="study-card__topline"><Badge tone={current.queue.kind === 'new' ? 'blue' : current.queue.kind === 'weak' ? 'rose' : 'green'}>{current.queue.kind === 'new' ? 'NEW WORD' : current.queue.kind === 'weak' ? 'WEAK WORD' : 'DUE REVIEW'}</Badge><IconButton label={current.card.starred ? '取消重点标记' : '标记重点'} variant={current.card.starred ? 'secondary' : 'ghost'} onClick={async () => { const next = await toggleStar(current.word.id); if (next) setItems((existing) => existing.map((item) => item.word.id === current.word.id ? { ...item, card: next } : item)) }}><Bookmark size={18} fill={current.card.starred ? 'currentColor' : 'none'} /></IconButton></div>
        <div className="study-card__body"><p className="study-card__index">{String(index + 1).padStart(2, '0')}</p><h2>{current.word.word}</h2><div className="study-card__phonetic">{current.word.phonetic || '/—/'}<AudioButton onClick={() => { const result = speakWord(current.word.word, settings.pronunciation); if (!result.ok && result.message) showNotice(result.message) }} label="播放" /></div>{!revealed ? <div className="recall-prompt"><CircleHelp size={17} /><span>先在心里回忆，再显示释义</span><Button onClick={() => setRevealed(true)}><Sparkles size={16} /> 显示释义 <span className="keycap">Space</span></Button></div> : <RevealContent word={current.word} />}</div>
      </section>
      {revealed && <section className="rating-panel"><div className="rating-panel__heading"><span>这次记得怎么样？</span><span className="rating-panel__undo"><button type="button" onClick={() => void undo()} disabled={!ratedStack.length || ratingBusy}><Undo2 size={14} /> Undo <span className="keycap">Z</span></button></span></div><div className="rating-grid">{ratingOptions.map((option) => <button type="button" key={option.rating} disabled={ratingBusy} className={`rating-button rating-button--${option.tone}`} onClick={() => void rate(option.rating)}><span className="rating-button__key">{option.key}</span><span>{option.label}</span><small>{preview ? formatDue(preview[option.rating]) : '—'}</small></button>)}</div></section>}
      <footer className="study-footer"><span><Pause size={15} /> Esc 暂停</span><span><RotateCcw size={15} /> 评分后可撤销</span><span><Bookmark size={15} /> S 标记重点</span></footer>
    </div>
  )
}

function RevealContent({ word }: { word: Word }) {
  return <div className="reveal-content"><div className="meaning-list">{word.pos?.length ? <span className="pos-label">{word.pos.join(' · ')}</span> : null}{word.meaningZh.slice(0, 4).map((meaning) => <p key={meaning}>{meaning}</p>)}</div>{word.definitionEn?.length ? <div className="word-detail-block"><span>English definition</span><p>{word.definitionEn[0]}</p></div> : null}{word.examples?.length ? <div className="word-detail-block"><span>Example</span><p>{word.examples[0].en}</p>{word.examples[0].zh && <small>{word.examples[0].zh}</small>}</div> : <div className="word-detail-block"><span>Study cue</span><p>把这个词放回一个真实句子里，再继续评分。</p></div>}</div>
}

function StudyComplete({ mode, count, onUndo, onContinue, onAgain, onHome }: { mode: StudyProps['mode']; count: number; onUndo?: () => void; onContinue?: () => void; onAgain: () => void; onHome: () => void }) {
  const continueLabel = mode === 'review' ? '继续今日学习' : '进入听写强化'
  return <div className="complete-page"><div className="complete-mark"><Check size={25} /></div><p className="eyebrow">{mode === 'review' ? 'Review complete' : 'Today complete'}</p><h1>这一段，完成了。</h1><p>你处理了 {count} 张卡片。下一次复习时间已经交给 FSRS 安排。</p><div className="complete-page__actions">{onUndo && <Button variant="ghost" onClick={onUndo}><Undo2 size={16} /> 撤销上一张</Button>}{onContinue ? <Button onClick={onContinue}>{continueLabel}</Button> : <Button onClick={onHome}>回到今日</Button>}<Button variant="soft" onClick={onAgain}>再来一轮</Button></div></div>
}
