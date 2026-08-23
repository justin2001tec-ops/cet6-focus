import type { AppSettings } from '@/types'
import { daysUntil } from '@/lib/dates'

export function examPlan(settings: AppSettings, remainingWords: number, today = new Date()): {
  days: number | null
  projectedPercent: number | null
  suggestedDaily: number | null
  message: string
} {
  const days = daysUntil(settings.examDate, today)
  if (!days || days <= 0) return { days, projectedPercent: null, suggestedDaily: null, message: '先按今天的节奏学习，完成当前队列即可。' }
  if (remainingWords <= 0) return { days, projectedPercent: null, suggestedDaily: null, message: '本地词库正在准备，完成后会显示更准确的学习节奏。' }
  const expected = settings.dailyNewWords * days
  const projectedPercent = Math.min(100, Math.round((expected / Math.max(1, remainingWords)) * 100))
  const suggestedDaily = Math.ceil(remainingWords / days)
  const message = projectedPercent >= 100
    ? `按当前速度预计可完成首轮，保持每天 ${settings.dailyNewWords} 个新词即可。`
    : `按当前速度预计可完成 ${projectedPercent}%。如希望考前完成首轮，建议每日新词调整至 ${suggestedDaily} 个。`
  return { days, projectedPercent, suggestedDaily, message }
}
