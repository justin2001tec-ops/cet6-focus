import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Check, Headphones, Keyboard, RotateCcw, Send, Volume2, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/app/providers'
import { PageHeader } from '@/components/AppShell'
import { EmptyState } from '@/components/States'
import { Badge, Button, IconButton } from '@/components/ui'
import { createSession, finishSession, getDictationCandidates, getWordsByIds, incrementSpellingWrong, recordDictationAttempt, recordDictationCorrection } from '@/db/db'
import { spellingMatches } from '@/lib/normalize'
import { speakWord } from '@/lib/speech'
import type { LearningCard, StudySessionRecord, Word } from '@/types'

type DictationMode = 'audio' | 'meaning'
interface DictationItem { word: Word; card: LearningCard }
interface DictationProps { onComplete?: () => void }

export function Dictation({ onComplete }: DictationProps) {
  const navigate = useNavigate()
  const { settings, refresh, showNotice } = useApp()
  const inputRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<DictationMode>('audio')
  const [items, setItems] = useState<DictationItem[]>([])
  const [index, setIndex] = useState(0)
  const [input, setInput] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [wrong, setWrong] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [session, setSession] = useState<StudySessionRecord | null>(null)
  const sessionRef = useRef<StudySessionRecord | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    getDictationCandidates().then(async (candidates) => {
      const words = await getWordsByIds(candidates.map((card) => card.wordId))
      const nextItems = candidates.map((card) => { const word = words.find((candidate) => candidate.id === card.wordId); return word ? { word, card } : null }).filter((item): item is DictationItem => Boolean(item))
      if (active) {
        setItems(nextItems)
        if (nextItems.length) {
          const nextSession = await createSession('dictation')
          sessionRef.current = nextSession
          setSession(nextSession)
        }
      }
    }).catch(() => showNotice('听写队列加载失败，请稍后重试。')).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [showNotice])

  useEffect(() => () => {
    if (sessionRef.current) void finishSession(sessionRef.current.id)
  }, [])

  const current = items[index]

  useEffect(() => {
    if (!current || mode !== 'audio') return
    const timer = window.setTimeout(() => speakWord(current.word.word, settings.pronunciation), 180)
    return () => window.clearTimeout(timer)
  }, [current, mode, settings.pronunciation])

  useEffect(() => {
    if (!submitted && current) inputRef.current?.focus()
  }, [current, submitted])

  if (loading) return <div className="page page--center"><div className="loading-line" />正在准备听写…</div>
  if (!current) return <div className="page"><PageHeader eyebrow="Dictation" title="还没有可听写的词。" description="先完成一小段新词学习，听写会从已接触词中抽取。" /><EmptyState title="先学习，再听写" description="这样听写中的正确率会更有意义。" action={<Button onClick={() => navigate('/study')}>去学习</Button>} /></div>

  async function submit() {
    if (!input.trim() || submitted || !current || !session) return
    const match = spellingMatches(current.word.word, input)
    setSubmitted(true)
    try {
      if (match) {
        await recordDictationAttempt(session.id, current.word.id, 'correct')
        setCorrectCount((count) => count + 1)
        setWrong(false)
        return
      }
      setWrong(true)
      await incrementSpellingWrong(current.word.id)
      await recordDictationAttempt(session.id, current.word.id, 'wrong')
      showNotice('这次先记下错误位置；重新输入正确拼写后再继续。')
    } catch {
      showNotice('听写记录保存失败，请检查本地存储后重试。')
    }
  }

  async function continueAfterAnswer() {
    if (!current || !session || !submitted) return
    if (wrong && !spellingMatches(current.word.word, input)) {
      setInput('')
      setSubmitted(false)
      inputRef.current?.focus()
      return
    }
    if (wrong) {
      await recordDictationCorrection(session.id, current.word.id)
      setCorrectCount((count) => count + 1)
    }
    if (index >= items.length - 1) {
      await finishSession(session.id)
      await refresh()
      if (onComplete) onComplete()
      else navigate('/stats')
      return
    }
    setIndex((currentIndex) => currentIndex + 1)
    setInput('')
    setSubmitted(false)
    setWrong(false)
  }

  function replay() {
    const result = speakWord(current.word.word, settings.pronunciation)
    if (!result.ok && result.message) showNotice(result.message)
  }

  return (
    <div className="page page--dictation">
      <PageHeader eyebrow="Spelling reinforcement" title="听写，把认识变成会写。" description="大小写、连字符和合理空格不会影响判断；真正的拼写错误会进入薄弱词优先队列。" action={<IconButton label="回到首页" onClick={() => navigate('/')}><X size={18} /></IconButton>} />
      <div className="dictation-tabs" role="tablist" aria-label="听写模式"><button type="button" role="tab" aria-selected={mode === 'audio'} className={mode === 'audio' ? 'is-active' : ''} onClick={() => { setMode('audio'); setSubmitted(false); setInput('') }}><Headphones size={16} /> 听发音写单词</button><button type="button" role="tab" aria-selected={mode === 'meaning'} className={mode === 'meaning' ? 'is-active' : ''} onClick={() => { setMode('meaning'); setSubmitted(false); setInput('') }}><Keyboard size={16} /> 看中文写英文</button></div>
      <section className="dictation-card card-surface"><div className="dictation-card__meta"><Badge tone="blue">{index + 1} / {items.length}</Badge><span>已正确 {correctCount}</span></div>{mode === 'audio' ? <div className="audio-prompt"><button type="button" className="audio-prompt__button" onClick={replay} aria-label="再次播放发音"><Volume2 size={28} /></button><strong>听发音，写出单词</strong><button type="button" className="inline-link inline-link--button" onClick={replay}>再播放一次</button></div> : <div className="meaning-prompt"><span>{current.word.pos?.join(' · ') || 'word'}</span><strong>{current.word.meaningZh.slice(0, 2).join('；')}</strong><small>看中文，写出英文</small></div>}<form className="dictation-form" onSubmit={(event) => { event.preventDefault(); if (!submitted) void submit(); else void continueAfterAnswer() }}><label className="sr-only" htmlFor="dictation-input">输入英文拼写</label><input ref={inputRef} id="dictation-input" className={`dictation-input ${wrong ? 'has-error' : ''} ${submitted && !wrong ? 'has-success' : ''}`} autoComplete="off" spellCheck={false} value={input} onChange={(event) => setInput(event.target.value)} placeholder="输入英文拼写…" disabled={submitted && !wrong} />{!submitted ? <Button type="submit"><Send size={16} /> 提交 <span className="keycap">Enter</span></Button> : wrong ? <Button type="submit"><RotateCcw size={16} /> 重新输入正确拼写</Button> : <Button type="submit"><ArrowLeft size={16} className="flip-x" /> 下一词</Button>}</form>{submitted && <AnswerFeedback word={current.word} input={input} wrong={wrong} />}</section>
      <div className="dictation-footer"><span><Keyboard size={15} /> Enter 提交 / 继续</span><span>输入会自动聚焦</span></div>
    </div>
  )
}

function AnswerFeedback({ word, input, wrong }: { word: Word; input: string; wrong: boolean }) {
  return <div className={`answer-feedback ${wrong ? 'answer-feedback--wrong' : 'answer-feedback--correct'}`}><span className="answer-feedback__icon">{wrong ? <RotateCcw size={17} /> : <Check size={17} />}</span><div><strong>{wrong ? '再看一眼拼写' : '正确'}</strong>{wrong ? <p>正确答案：<SpellDiff expected={word.word} actual={input} /></p> : <p>很好，继续保持这个反应速度。</p>}</div></div>
}

function SpellDiff({ expected, actual }: { expected: string; actual: string }) {
  const normalizedExpected = expected.toLocaleLowerCase()
  return <span className="spell-diff">{normalizedExpected.split('').map((char, index) => <span key={`${char}-${index}`} className={actual.toLocaleLowerCase()[index] === char ? '' : 'is-different'}>{char}</span>)}</span>
}
