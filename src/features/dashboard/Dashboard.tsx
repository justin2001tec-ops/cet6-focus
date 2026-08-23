import { useEffect, useState, type CSSProperties } from 'react'
import { ArrowUpRight, BookOpen, CalendarDays, CheckCircle2, Clock3, Headphones, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/app/providers'
import { InlineLink, PageHeader, SectionHeader } from '@/components/AppShell'
import { EmptyState } from '@/components/States'
import { Badge, Button, ProgressBar, StatCard } from '@/components/ui'
import { getCardsByIds, getQueue, getWordsByIds } from '@/db/db'
import { daysUntil, formatDate } from '@/lib/dates'
import { examPlan } from '@/lib/planning'
import type { LearningCard, QueueItem, Word } from '@/types'

export function Dashboard() {
  const navigate = useNavigate()
  const { settings, summary, refresh } = useApp()
  const [priority, setPriority] = useState<Array<{ item: QueueItem; word?: Word; card?: LearningCard }>>([])

  useEffect(() => {
    let active = true
    getQueue('weak', settings).then(async (items) => {
      const [words, cards] = await Promise.all([getWordsByIds(items.slice(0, 3).map((item) => item.wordId)), getCardsByIds(items.slice(0, 3).map((item) => item.wordId))])
      if (active) setPriority(items.slice(0, 3).map((item) => ({ item, word: words.find((word) => word.id === item.wordId), card: cards.find((card) => card.wordId === item.wordId) })))
    }).catch(() => undefined)
    return () => { active = false }
  }, [settings, summary])

  if (!summary) return null
  const examDays = daysUntil(settings.examDate)
  const progress = summary.encountered ? Math.round((summary.mastered / Math.max(1, summary.encountered)) * 100) : 0
  const plan = examPlan(settings, summary.remaining)
  const greeting = getGreeting()
  const todayNew = Math.min(summary.newCount, settings.dailyNewWords)
  const dictation = Math.min(10, Math.max(0, summary.encountered))

  async function startToday() {
    await refresh()
    navigate('/today')
  }

  return (
    <div className="page page--dashboard">
      <PageHeader eyebrow={formatDate(new Date(), { weekday: 'long', month: 'long', day: 'numeric' })} title={`${greeting}，今天继续前进一点。`} description="到期复习优先，接着学习新词；没有需要赶的进度，只有下一张卡片。" action={<Button onClick={startToday}><Sparkles size={16} /> 开始今日学习</Button>} />

      <section className="dashboard-hero card-surface">
        <div className="dashboard-hero__copy"><span className="hero-kicker"><span className="status-dot" /> TODAY · CET-6 FOCUS</span><h2>{examDays !== null && examDays >= 0 ? <>距离 CET-6 还有 <em>{examDays}</em> 天</> : '今天先把该复习的词记牢。'}</h2><p>{examDays !== null && examDays >= 0 ? plan.message : '把注意力放在当前队列，完成一小段真实学习。'}</p><Button variant="secondary" onClick={startToday}>进入学习链路 <ArrowUpRight size={16} /></Button></div><div className="hero-ring" style={{ '--progress': `${progress}%` } as CSSProperties} aria-label={`掌握进度 ${progress}%`}><div><strong>{progress}%</strong><span>已掌握</span></div></div>
      </section>

      <section className="dashboard-grid dashboard-grid--tasks">
        <StatCard label="今日复习" value={summary.dueCount} caption="到期优先" tone="accent" />
        <StatCard label="今日新词" value={todayNew} caption={`每天 ${settings.dailyNewWords} 个上限`} />
        <StatCard label="听写强化" value={dictation} caption="从已接触词中抽取" tone="warm" />
        <StatCard label="薄弱词" value={summary.weakCount} caption="按最近表现派生" />
        <StatCard label="预计时间" value={`${settings.dailyMinutes} min`} caption="按你的节奏开始" />
      </section>

      <div className="dashboard-columns">
        <section className="card-surface dashboard-progress">
          <SectionHeader title="总进度" description="把看过一次和真正掌握分开。" action={<InlineLink to="/stats">查看统计</InlineLink>} />
          <div className="progress-summary"><div><strong>{summary.encountered.toLocaleString()}</strong><span>已接触</span></div><div><strong>{summary.mastered.toLocaleString()}</strong><span>已掌握</span></div><div><strong>{summary.remaining.toLocaleString()}</strong><span>待推进</span></div></div>
          <ProgressBar value={summary.encountered ? (summary.mastered / summary.encountered) * 100 : 0} label={`${summary.encountered ? Math.round((summary.mastered / summary.encountered) * 100) : 0}% · 在已接触词中达到 Mastered 条件`} />
        </section>
        <section className="card-surface dashboard-plan">
          <SectionHeader title="今天的顺序" />
          <PlanRow icon={<CheckCircle2 size={18} />} title="到期复习" value={`${summary.dueCount} 词`} tone="green" />
          <PlanRow icon={<BookOpen size={18} />} title="今日新词" value={`${todayNew} 词`} tone="blue" />
          <PlanRow icon={<Headphones size={18} />} title="听写强化" value={`${dictation} 词`} tone="warm" />
          <div className="plan-note"><Clock3 size={15} />完成一段后可以随时暂停，记录会自动保存。</div>
        </section>
      </div>

      <section className="card-surface priority-section">
        <SectionHeader title="优先处理" description="重点词、拼写错误和近期反复 Again 的词会在这里出现。" action={<InlineLink to="/mistakes">查看全部薄弱词</InlineLink>} />
        {priority.length ? <div className="priority-list">{priority.map(({ item, word, card }) => <PriorityRow key={item.wordId} word={word} card={card} kind={item.kind} onClick={() => navigate(`/word/${item.wordId}`)} />)}</div> : <EmptyState title="暂时没有需要特别处理的词" description="完成几次学习或标记重点后，这里会自动形成优先队列。" action={<Button variant="soft" onClick={startToday}>开始今天的第一组</Button>} />}
      </section>

      {settings.examDate && <div className="soft-callout"><CalendarDays size={17} /><div><strong>考试计划</strong><p>{plan.message}</p></div><Badge tone={plan.projectedPercent && plan.projectedPercent >= 100 ? 'green' : 'amber'}>{plan.projectedPercent ?? 0}% 预计完成</Badge></div>}
    </div>
  )
}

function PlanRow({ icon, title, value, tone }: { icon: React.ReactNode; title: string; value: string; tone: 'green' | 'blue' | 'warm' }) {
  return <div className="plan-row"><span className={`plan-row__icon plan-row__icon--${tone}`}>{icon}</span><span>{title}</span><strong>{value}</strong></div>
}

function PriorityRow({ word, card, kind, onClick }: { word?: Word; card?: LearningCard; kind: QueueItem['kind']; onClick: () => void }) {
  return <button type="button" className="priority-row" onClick={onClick}><span className="priority-row__word">{word?.word ?? '加载中…'}<small>{word?.phonetic ?? '—'}</small></span><span className="priority-row__meaning">{word?.meaningZh.slice(0, 2).join('；') ?? '—'}</span><span className="priority-row__meta">{card?.starred ? <Badge tone="amber">重点</Badge> : null}{card && card.spellingWrongCount > 0 ? <Badge tone="rose">拼写 {card.spellingWrongCount}</Badge> : null}<Badge tone={kind === 'due' ? 'blue' : 'neutral'}>{kind === 'weak' ? '薄弱' : '复习'}</Badge></span><ArrowUpRight size={16} /></button>
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了'
  if (hour < 12) return '早上好'
  if (hour < 18) return '下午好'
  return '晚上好'
}
