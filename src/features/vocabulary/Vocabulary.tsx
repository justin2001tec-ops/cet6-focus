import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDownAZ, Filter, Search, SlidersHorizontal, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/AppShell'
import { EmptyState } from '@/components/States'
import { Badge, Button } from '@/components/ui'
import { getAllWords, getCards, getReviewLogsSince } from '@/db/db'
import { formatDue } from '@/lib/dates'
import { isMastered, stateLabel } from '@/lib/fsrs'
import { getWeakWordSignals, type WeakWordSignal } from '@/lib/weak'
import type { LearningCard, Word } from '@/types'
import { WordDetailSheet } from './WordDetailSheet'
import { SharedElement } from '@/design-system/motion/MotionRoute'

type StatusFilter = 'all' | 'new' | 'learning' | 'review' | 'weak' | 'starred'
type SortMode = 'alpha' | 'frequency' | 'progress' | 'weak'

export function Vocabulary() {
  const [words, setWords] = useState<Word[]>([])
  const [cards, setCards] = useState<LearningCard[]>([])
  const [weakSignals, setWeakSignals] = useState<Map<string, WeakWordSignal>>(new Map())
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [sort, setSort] = useState<SortMode>('alpha')
  const [page, setPage] = useState(1)
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null)
  const selectedWordTriggerRef = useRef<HTMLElement | null>(null)
  const pageSize = 40

  useEffect(() => { Promise.all([getAllWords(), getCards(), getReviewLogsSince(new Date(Date.now() - 30 * 86_400_000))]).then(([nextWords, nextCards, logs]) => { setWords(nextWords.filter((word) => !word.archived)); setCards(nextCards); setWeakSignals(getWeakWordSignals(nextCards, logs)) }).catch(() => undefined) }, [])
  useEffect(() => { setPage(1) }, [query, status, sort])

  const cardMap = useMemo(() => new Map(cards.map((card) => [card.wordId, card])), [cards])
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase()
    const matches = words.filter((word) => {
      const card = cardMap.get(word.id)
      const searchable = `${word.word} ${word.meaningZh.join(' ')} ${word.definitionEn?.join(' ') ?? ''}`.toLocaleLowerCase()
      if (needle && !searchable.includes(needle)) return false
      if (status === 'new' && card?.fsrsCard.state !== 0) return false
      if (status === 'learning' && card?.fsrsCard.state !== 1) return false
      if (status === 'review' && card?.fsrsCard.state !== 2) return false
      if (status === 'weak' && !(card && weakSignals.get(card.wordId)?.isWeak)) return false
      if (status === 'starred' && !card?.starred) return false
      return true
    })
    return matches.sort((a, b) => {
      const cardA = cardMap.get(a.id)
      const cardB = cardMap.get(b.id)
      if (sort === 'frequency') return (a.frequency?.contemporary ?? 999_999) - (b.frequency?.contemporary ?? 999_999)
      if (sort === 'progress') return (cardB?.fsrsCard.state ?? 0) - (cardA?.fsrsCard.state ?? 0)
      if (sort === 'weak') return (weakSignals.get(b.id)?.score ?? 0) - (weakSignals.get(a.id)?.score ?? 0)
      return a.word.localeCompare(b.word)
    })
  }, [cardMap, query, sort, status, weakSignals, words])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize)

  const closeWordSheet = useCallback(() => {
    setSelectedWordId(null)
  }, [])

  const openWordSheet = useCallback((wordId: string, trigger: HTMLElement) => {
    selectedWordTriggerRef.current = trigger
    setSelectedWordId(wordId)
  }, [])

  return <div className="page page--vocabulary"><PageHeader eyebrow="Vocabulary" title="词库，保持可检索。" description={`${words.length.toLocaleString()} 个 CET-6 词条 · 在本地 IndexedDB 中浏览与筛选。`} action={<div className="vocabulary-count"><strong>{filtered.length.toLocaleString()}</strong><span>当前结果</span></div>} /><section className="library-toolbar card-surface"><div className="search-box"><Search size={17} /><label className="sr-only" htmlFor="word-search">搜索词库</label><input id="word-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索英文、中文释义…" /></div><div className="toolbar-selects"><label><Filter size={15} /><span className="sr-only">状态</span><select value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)}><option value="all">全部状态</option><option value="new">未学习</option><option value="learning">学习中</option><option value="review">复习中</option><option value="weak">薄弱</option><option value="starred">重点</option></select></label><label><ArrowDownAZ size={15} /><span className="sr-only">排序</span><select value={sort} onChange={(event) => setSort(event.target.value as SortMode)}><option value="alpha">按字母</option><option value="frequency">按词频</option><option value="progress">按进度</option><option value="weak">最易遗忘</option></select></label></div></section>{visible.length ? <section className="word-table card-surface"><div className="word-table__header"><span>词条</span><span>释义</span><span>状态</span><span>下次复习</span></div>{visible.map((word) => <WordRow key={word.id} word={word} card={cardMap.get(word.id)} onMobileOpen={openWordSheet} />)}</section> : <EmptyState title="没有匹配的词条" description="试试更短的英文前缀，或清除状态筛选。" action={<Button variant="soft" onClick={() => { setQuery(''); setStatus('all') }}><SlidersHorizontal size={15} /> 清除筛选</Button>} />}<div className="pagination"><span>第 {page} / {totalPages} 页</span><div><Button size="sm" variant="soft" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>上一页</Button><Button size="sm" variant="soft" disabled={page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>下一页</Button></div></div>{selectedWordId && <WordDetailSheet wordId={selectedWordId} onClose={closeWordSheet} restoreFocusRef={selectedWordTriggerRef} />}</div>
}

function WordRow({ word, card, onMobileOpen }: { word: Word; card?: LearningCard; onMobileOpen: (wordId: string, trigger: HTMLElement) => void }) {
  const mastered = card ? isMastered(card.fsrsCard) : false
  return <Link to={`/word/${word.id}`} className="word-row" onClick={(event) => { if (window.matchMedia('(max-width: 699px)').matches) { event.preventDefault(); onMobileOpen(word.id, event.currentTarget) } }}><span className="word-row__word"><SharedElement id={`word-${word.id}`}><strong>{word.word}</strong></SharedElement><small>{word.phonetic || '/—/'}</small></span><span className="word-row__meaning">{word.meaningZh.slice(0, 2).join('；')}</span><span className="word-row__status">{card?.starred && <Star size={14} fill="currentColor" />}<Badge tone={mastered ? 'green' : card?.fsrsCard.state === 0 ? 'neutral' : card?.fsrsCard.state === 3 ? 'rose' : 'blue'}>{mastered ? 'Mastered' : stateLabel(card?.fsrsCard.state ?? 0)}</Badge></span><span className="word-row__due">{card ? formatDue(card.fsrsCard.due) : '—'}</span></Link>
}
