export function startOfDay(value = new Date()): Date {
  const result = new Date(value)
  result.setHours(0, 0, 0, 0)
  return result
}

export function endOfDay(value = new Date()): Date {
  const result = startOfDay(value)
  result.setDate(result.getDate() + 1)
  return result
}

export function daysUntil(target?: string, from = new Date()): number | null {
  if (!target) return null
  const delta = startOfDay(new Date(`${target}T00:00:00`)).getTime() - startOfDay(from).getTime()
  return Math.ceil(delta / 86_400_000)
}

export function formatDate(value: string | Date, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('zh-CN', options ?? { month: 'short', day: 'numeric' }).format(new Date(value))
}

export function formatDue(value: string | Date, now = new Date()): string {
  const date = new Date(value)
  if (date.getTime() <= now.getTime()) return '现在'
  const dayDelta = Math.round((startOfDay(date).getTime() - startOfDay(now).getTime()) / 86_400_000)
  if (dayDelta === 1) return '明天'
  if (dayDelta > 1 && dayDelta < 7) return `${dayDelta} 天后`
  return formatDate(date)
}

export function dateKey(value: string | Date): string {
  const date = new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function todayKey(): string {
  return dateKey(new Date())
}
