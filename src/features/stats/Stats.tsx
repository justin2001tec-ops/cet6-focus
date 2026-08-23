import { useEffect, useMemo, useState } from 'react'
import { Flame } from 'lucide-react'
import { PageHeader, SectionHeader } from '@/components/AppShell'
import { EmptyState } from '@/components/States'
import { ProgressBar, StatCard } from '@/components/ui'
import { getCards, getReviewLogsSince, getSessionsSince } from '@/db/db'
import { dateKey, formatDate } from '@/lib/dates'
import { getDictationStats, getReviewLogsForSessions } from '@/lib/stats'
import { getWeakWordSignals } from '@/lib/weak'
import type { LearningCard, ReviewLogRecord, StudySessionRecord } from '@/types'

type Range = 7 | 30

export function Stats() {
  const [range, setRange] = useState<Range>(7)
  const [logs, setLogs] = useState<ReviewLogRecord[]>([])
  const [sessions, setSessions] = useState<StudySessionRecord[]>([])
  const [cards, setCards] = useState<LearningCard[]>([])
  useEffect(() => { Promise.all([getReviewLogsSince(new Date(Date.now() - 90 * 86_400_000)), getSessionsSince(new Date(Date.now() - 90 * 86_400_000)), getCards()]).then(([nextLogs, nextSessions, nextCards]) => { setLogs(nextLogs); setSessions(nextSessions); setCards(nextCards) }).catch(() => undefined) }, [])

  const since = Date.now() - range * 86_400_000
  const rangeSessions = sessions.filter((session) => new Date(session.startedAt).getTime() >= since)
  const rangeLogs = getReviewLogsForSessions(logs.filter((log) => new Date(log.reviewedAt).getTime() >= since), rangeSessions)
  const againRate = rangeLogs.length ? Math.round((rangeLogs.filter((log) => log.rating === 1).length / rangeLogs.length) * 100) : 0
  const reviewSuccessRate = rangeLogs.length ? Math.round((rangeLogs.filter((log) => log.rating >= 3).length / rangeLogs.length) * 100) : 0
  const minutes = Math.round(rangeSessions.reduce((sum, session) => sum + session.durationMs, 0) / 60_000)
  const learned = new Set(rangeLogs.map((log) => log.wordId)).size
  const rangeDictationStats = getDictationStats(rangeSessions)
  const weakCount = Array.from(getWeakWordSignals(cards, logs).values()).filter((signal) => signal.isWeak).length
  const statusCounts = useMemo(() => cards.reduce((result, card) => { const state = card.fsrsCard.state === 0 ? 'New' : card.fsrsCard.state === 1 ? 'Learning' : card.fsrsCard.state === 2 ? 'Review' : 'Relearning'; result[state] = (result[state] ?? 0) + 1; return result }, {} as Record<string, number>), [cards])
  const daily = buildDaily(rangeLogs, range)
  const maxDaily = Math.max(1, ...daily.map((day) => day.count))

  return <div className="page page--stats"><PageHeader eyebrow="Your data" title="统计，为了看见节奏。" description="Review 和听写分别统计；没有虚构的连续打卡，也不把看过一次算作掌握。" action={<div className="range-switch"><button type="button" className={range === 7 ? 'is-active' : ''} onClick={() => setRange(7)}>7 天</button><button type="button" className={range === 30 ? 'is-active' : ''} onClick={() => setRange(30)}>30 天</button></div>} /><section className="dashboard-grid dashboard-grid--tasks"><StatCard label="学习词数" value={learned} caption={`近 ${range} 天 Review`} tone="accent" /><StatCard label="Review Again" value={`${againRate}%`} caption="真实 ReviewLog" tone="warm" /><StatCard label="Review Good / Easy" value={`${reviewSuccessRate}%`} caption="不含听写" /><StatCard label="听写首次正确率" value={`${Math.round(rangeDictationStats.accuracy * 100)}%`} caption={`${rangeDictationStats.attempted} 次尝试`} /><StatCard label="学习时间" value={`${minutes} min`} caption={`近 ${range} 天`} /></section><section className="card-surface dashboard-progress"><SectionHeader title="听写专项" description="首次拼写正确率 = firstTryCorrect / attempted；错误重输单独记录，不会修改 FSRS。" /><div className="progress-summary"><div><strong>{rangeDictationStats.attempted}</strong><span>尝试</span></div><div><strong>{rangeDictationStats.firstTryCorrect}</strong><span>首次正确</span></div><div><strong>{rangeDictationStats.wrong}</strong><span>首次错误</span></div><div><strong>{rangeDictationStats.corrected}</strong><span>纠正完成</span></div><div><strong>{weakCount}</strong><span>当前薄弱词</span></div></div></section><div className="stats-columns"><section className="card-surface chart-card"><SectionHeader title="每日学习量" description="按真实 Review 记录计数。" /><div className="bar-chart" role="img" aria-label="每日学习量柱状图">{daily.map((day) => <div className="bar-chart__item" key={day.key}><div className="bar-chart__bar-wrap"><div className="bar-chart__bar" style={{ height: `${Math.max(3, (day.count / maxDaily) * 100)}%` }} title={`${day.key}: ${day.count}`} /></div><span>{day.label}</span></div>)}</div></section><section className="card-surface state-card"><SectionHeader title="记忆状态" description="Mastered 是 UI 派生标签，不改变 FSRS 状态。" />{Object.entries(statusCounts).map(([label, count]) => <div className="state-row" key={label}><span>{label}</span><strong>{count.toLocaleString()}</strong><ProgressBar value={cards.length ? (count / cards.length) * 100 : 0} /></div>)}</section></div><section className="card-surface heatmap-card"><SectionHeader title="学习热力" description="更像一张地图，不是一根鞭子。" action={<span className="muted"><Flame size={15} /> {logs.length ? `最近一次 ${formatDate(logs.at(-1)?.reviewedAt ?? new Date())}` : '还没有记录'}</span>} /><Heatmap logs={logs} /></section>{!logs.length && !rangeDictationStats.attempted && <EmptyState title="完成第一次评分后，这里会出现真实趋势" description="学习记录默认只保存在本机。" />}</div>
}

function buildDaily(logs: ReviewLogRecord[], range: Range): Array<{ key: string; label: string; count: number }> {
  const result: Array<{ key: string; label: string; count: number }> = []
  for (let offset = range - 1; offset >= 0; offset -= 1) {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - offset)
    const key = dateKey(date)
    result.push({ key, label: range === 7 ? `${date.getMonth() + 1}/${date.getDate()}` : `${date.getDate()}`, count: logs.filter((log) => dateKey(log.reviewedAt) === key).length })
  }
  return result
}

function Heatmap({ logs }: { logs: ReviewLogRecord[] }) {
  const counts = new Map<string, number>()
  logs.forEach((log) => counts.set(dateKey(log.reviewedAt), (counts.get(dateKey(log.reviewedAt)) ?? 0) + 1))
  return <div className="heatmap" aria-label="最近 12 周学习热力图">{Array.from({ length: 84 }, (_, index) => { const date = new Date(); date.setHours(0, 0, 0, 0); date.setDate(date.getDate() - (83 - index)); const count = counts.get(dateKey(date)) ?? 0; return <span key={date.toISOString()} className={`heatmap__cell heatmap__cell--${Math.min(4, count === 0 ? 0 : count < 3 ? 1 : count < 7 ? 2 : count < 12 ? 3 : 4)}`} title={`${dateKey(date)} · ${count} 次`} /> })}</div>
}
