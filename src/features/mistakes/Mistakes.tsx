import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ArrowUpRight, Bookmark, PenLine, Play, Search, Target } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/AppShell'
import { EmptyState } from '@/components/States'
import { Badge, Button, StatCard } from '@/components/ui'
import { getCards, getReviewLogsSince, getWordsByIds } from '@/db/db'
import { formatDate } from '@/lib/dates'
import { getWeakWordSignals } from '@/lib/weak'
import type { LearningCard, Word } from '@/types'

interface WeakItem { word: Word; card: LearningCard; againCount: number; recentAgainCount: number; lastError: string | undefined; score: number }

export function Mistakes() {
  const navigate = useNavigate()
  const [items, setItems] = useState<WeakItem[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    Promise.all([getCards(), getReviewLogsSince(new Date(Date.now() - 30 * 86_400_000))]).then(async ([cards, logs]) => {
      const signals = getWeakWordSignals(cards, logs)
      const weakCards = cards.filter((card) => signals.get(card.wordId)?.isWeak)
      const words = await getWordsByIds(weakCards.map((card) => card.wordId))
      const next = weakCards.map((card) => { const word = words.find((candidate) => candidate.id === card.wordId); const signal = signals.get(card.wordId); return word && !word.archived && signal ? { word, card, againCount: signal.againCount, recentAgainCount: signal.recentAgainCount, lastError: signal.lastError, score: signal.score } : null }).filter((item): item is WeakItem => Boolean(item)).sort((a, b) => b.score - a.score)
      if (active) setItems(next)
    }).catch(() => undefined).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase()
    return needle ? items.filter((item) => `${item.word.word} ${item.word.meaningZh.join(' ')}`.toLocaleLowerCase().includes(needle)) : items
  }, [items, query])
  const spellingTotal = items.reduce((sum, item) => sum + item.card.spellingWrongCount, 0)
  const againTotal = items.reduce((sum, item) => sum + item.againCount, 0)

  if (loading) return <div className="page page--center"><div className="loading-line" />正在整理薄弱词…</div>
  return <div className="page page--mistakes"><PageHeader eyebrow="Weak words" title="薄弱词，不让它们悄悄溜走。" description="这里综合 Again、拼写错误、重学状态和你的重点标记；排序会优先呈现最需要回看的词。" action={<Button onClick={() => navigate('/mistakes/study')} disabled={!items.length}><Play size={16} /> 开始 15 词强化</Button>} /><section className="dashboard-grid dashboard-grid--tasks"><StatCard label="薄弱词" value={items.length} caption="自动派生" tone="accent" /><StatCard label="Again 次数" value={againTotal} caption="来自真实复习记录" /><StatCard label="拼写错误" value={spellingTotal} caption="听写会持续更新" tone="warm" /><StatCard label="重点词" value={items.filter((item) => item.card.starred).length} caption="手动标记" /></section><section className="card-surface mistakes-toolbar"><div className="search-box"><Search size={17} /><label className="sr-only" htmlFor="weak-search">搜索薄弱词</label><input id="weak-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索单词或中文释义…" /></div><span className="muted"><Target size={15} /> 每次强化最多 15 词</span></section>{visible.length ? <section className="weak-list">{visible.map((item) => <WeakRow key={item.word.id} item={item} onClick={() => navigate(`/word/${item.word.id}`)} />)}</section> : <EmptyState title="这组筛选下没有薄弱词" description="当你在学习中遇到 Again 或听写出错，这里会自动更新。" action={<Button variant="soft" onClick={() => setQuery('')}>清除搜索</Button>} />}</div>
}

function WeakRow({ item, onClick }: { item: WeakItem; onClick: () => void }) {
  return <button type="button" className="weak-row card-surface" onClick={onClick}><span className="weak-row__icon">{item.card.starred ? <Bookmark size={17} fill="currentColor" /> : item.card.spellingWrongCount ? <PenLine size={17} /> : <AlertTriangle size={17} />}</span><span className="weak-row__word"><strong>{item.word.word}</strong><small>{item.word.phonetic || '/—/'}</small></span><span className="weak-row__meaning">{item.word.meaningZh.slice(0, 2).join('；')}</span><span className="weak-row__signals">{item.card.starred && <Badge tone="amber">重点</Badge>}{item.card.spellingWrongCount > 0 && <Badge tone="rose">拼写 {item.card.spellingWrongCount}</Badge>}{item.recentAgainCount > 0 && <Badge tone="blue">近期 Again {item.recentAgainCount}</Badge>}</span><span className="weak-row__date">{item.lastError ? `最近 ${formatDate(item.lastError)}` : '待强化'}</span><ArrowUpRight size={16} /></button>
}
