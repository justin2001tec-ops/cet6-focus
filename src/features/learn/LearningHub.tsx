import { ArrowUpRight, BookOpen, CheckCircle2, Headphones, Target } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/AppShell'
import { Button } from '@/components/ui'

const entries = [
  { to: '/today', icon: CheckCircle2, eyebrow: 'Today flow', title: '继续今日学习', description: '按照到期复习 → 新词 → 听写的真实顺序继续。', tone: 'accent' },
  { to: '/study', icon: BookOpen, eyebrow: 'New words', title: '学习新词', description: '进入当前新词队列，用 FSRS 记录每次评分。', tone: 'blue' },
  { to: '/review', icon: CheckCircle2, eyebrow: 'Due review', title: '复习到期词', description: '先处理已经到期的卡片，保持记忆节奏。', tone: 'green' },
  { to: '/dictation', icon: Headphones, eyebrow: 'Spelling', title: '听写强化', description: '把认识变成会写，错误会进入薄弱词信号。', tone: 'warm' },
  { to: '/mistakes/study', icon: Target, eyebrow: 'Weak words', title: '薄弱词强化', description: '按近期表现优先处理最值得回看的词。', tone: 'rose' },
] as const

export function LearningHub() {
  const navigate = useNavigate()

  return <div className="page page--learn">
    <PageHeader eyebrow="Learning" title="学习，保持自己的节奏。" description="所有入口仍然指向原有业务路由；这里负责把下一步组织得更清楚。" />
    <section className="learning-hub__lead material-panel">
      <div><span className="eyebrow">Focus session</span><h2>下一步不用想太多。</h2><p>从今日链路开始，或者直接选择你此刻需要的训练。</p></div>
      <Button onClick={() => navigate('/today')}><CheckCircle2 size={17} /> 开始今日学习 <ArrowUpRight size={16} /></Button>
    </section>
    <section className="learning-hub__list" aria-label="学习入口">
      {entries.map(({ to, icon: Icon, eyebrow, title, description, tone }) => <button key={to} type="button" className={`learning-entry learning-entry--${tone}`} onClick={() => navigate(to)}><span className="learning-entry__icon"><Icon size={20} /></span><span className="learning-entry__copy"><small>{eyebrow}</small><strong>{title}</strong><span>{description}</span></span><ArrowUpRight size={18} /></button>)}
    </section>
  </div>
}
