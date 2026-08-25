import { BarChart3, DatabaseBackup, Info, Settings2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/AppShell'
import { ApplePressable } from '@/design-system/components'

const entries = [
  { to: '/stats', icon: BarChart3, title: '学习统计', description: '查看 Review、听写和记忆状态。' },
  { to: '/settings', icon: Settings2, title: '设置与外观', description: '调整学习节奏、背景、声音和数据。' },
]

export function More() {
  const navigate = useNavigate()
  return <div className="page page--more">
    <PageHeader eyebrow="More" title="更多，把工具整理好。" description="设置、统计和数据备份仍然保留在这里，不会从应用里消失。" />
    <section className="more-list" aria-label="更多入口">
      {entries.map(({ to, icon: Icon, title, description }) => <ApplePressable key={to} type="button" className="ios-list-row" onClick={() => navigate(to)}><span className="ios-list-row__icon"><Icon size={18} /></span><span><strong>{title}</strong><small>{description}</small></span><span className="ios-list-row__chevron">›</span></ApplePressable>)}
      <div className="ios-list-row ios-list-row--static"><span className="ios-list-row__icon"><DatabaseBackup size={18} /></span><span><strong>本地数据</strong><small>学习记录只保存在当前浏览器的 IndexedDB。</small></span></div>
      <div className="ios-list-row ios-list-row--static"><span className="ios-list-row__icon"><Info size={18} /></span><span><strong>CET6 Focus</strong><small>Local-first · iOS 26 UI preview · v1.1 redesign</small></span></div>
    </section>
  </div>
}
