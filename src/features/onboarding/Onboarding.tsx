import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, CalendarDays, Check, Volume2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/app/providers'
import { Button } from '@/components/ui'
import { examPlan } from '@/lib/planning'

const wordOptions = [20, 30, 40, 50]
const timeOptions = [15, 20, 30, 45]

export function Onboarding() {
  const navigate = useNavigate()
  const { settings, summary, updateSettings } = useApp()
  const [step, setStep] = useState(1)
  const [examDate, setExamDate] = useState(settings.examDate ?? '')
  const [dailyNewWords, setDailyNewWords] = useState(settings.dailyNewWords)
  const [dailyMinutes, setDailyMinutes] = useState(settings.dailyMinutes)
  const [pronunciation, setPronunciation] = useState(settings.pronunciation)
  const [autoplay, setAutoplay] = useState(settings.autoplayPronunciation)

  const draftSettings = useMemo(() => ({ ...settings, examDate: examDate || undefined, dailyNewWords, dailyMinutes, pronunciation, autoplayPronunciation: autoplay }), [autoplay, dailyMinutes, dailyNewWords, examDate, pronunciation, settings])
  const plan = examPlan(draftSettings, summary?.remaining ?? 0)

  async function finish() {
    await updateSettings({ examDate: examDate || undefined, dailyNewWords, dailyMinutes, pronunciation, autoplayPronunciation: autoplay, onboarded: true })
    navigate('/', { replace: true })
  }

  return (
    <main className="onboarding-page">
      <div className="onboarding__top"><span className="brand-mark">C6</span><span>个人学习空间 · CET-6</span></div>
      <div className="onboarding__shell">
        <div className="onboarding__progress"><span>开始之前</span><span>{step} / 4</span><div className="progress-track"><div className="progress-fill" style={{ width: `${step * 25}%` }} /></div></div>
        {step === 1 && <StepOne />}
        {step === 2 && <StepTwo examDate={examDate} setExamDate={setExamDate} plan={plan} />}
        {step === 3 && <StepThree dailyNewWords={dailyNewWords} setDailyNewWords={setDailyNewWords} dailyMinutes={dailyMinutes} setDailyMinutes={setDailyMinutes} />}
        {step === 4 && <StepFour pronunciation={pronunciation} setPronunciation={setPronunciation} autoplay={autoplay} setAutoplay={setAutoplay} />}
        <div className="onboarding__actions">
          {step > 1 ? <Button variant="ghost" onClick={() => setStep((current) => current - 1)}><ArrowLeft size={16} /> 返回</Button> : <span />}
          {step < 4 ? <Button onClick={() => setStep((current) => current + 1)}>继续 <ArrowRight size={16} /></Button> : <Button onClick={finish}><Check size={16} /> 开始备考</Button>}
        </div>
      </div>
      <p className="onboarding__footer">不需要账号 · 数据留在你的浏览器里 · 随时可以从设置调整</p>
    </main>
  )
}

function StepOne() {
  return <div className="onboarding__content"><p className="eyebrow">Welcome to Focus</p><h1>每天打开，都知道下一步做什么。</h1><p className="lead">CET6 Focus 会先安排到期复习，再给你一小组新词，最后用听写把“认识”变成“会写”。我们从一套安静、可持续的节奏开始。</p><div className="onboarding__note"><span className="brand-mark brand-mark--small">C6</span><div><strong>词书：CET-6</strong><p>本地词库 · FSRS 间隔重复 · 离线可用</p></div></div></div>
}

function StepTwo({ examDate, setExamDate, plan }: { examDate: string; setExamDate: (value: string) => void; plan: ReturnType<typeof examPlan> }) {
  return <div className="onboarding__content"><p className="eyebrow">你的节奏</p><h1>考试日期，可填，也可以跳过。</h1><p className="lead">如果你愿意，CET6 Focus 会用它估算首轮词库的节奏。它只负责给出温和的参考，不会制造倒计时压力。</p><label className="field-label" htmlFor="exam-date"><CalendarDays size={16} /> 考试日期（可选）</label><input id="exam-date" className="text-input" type="date" value={examDate} onChange={(event) => setExamDate(event.target.value)} />{examDate && <div className="planning-hint"><strong>距离考试 {plan.days ?? 0} 天</strong><span>{plan.message}</span></div>}</div>
}

function StepThree({ dailyNewWords, setDailyNewWords, dailyMinutes, setDailyMinutes }: { dailyNewWords: number; setDailyNewWords: (value: number) => void; dailyMinutes: number; setDailyMinutes: (value: number) => void }) {
  return <div className="onboarding__content"><p className="eyebrow">每日安排</p><h1>把量设在愿意坚持的地方。</h1><p className="lead">新词不是越多越好。复习量会随 FSRS 自然变化，这里只决定每天最多引入多少新词。</p><fieldset className="choice-fieldset"><legend>每日新词</legend><div className="choice-grid">{wordOptions.map((option) => <ChoiceButton key={option} active={dailyNewWords === option} onClick={() => setDailyNewWords(option)}>{option} 个</ChoiceButton>)}</div></fieldset><fieldset className="choice-fieldset"><legend>预计学习时间</legend><div className="choice-grid">{timeOptions.map((option) => <ChoiceButton key={option} active={dailyMinutes === option} onClick={() => setDailyMinutes(option)}>{option} 分钟</ChoiceButton>)}</div></fieldset></div>
}

function StepFour({ pronunciation, setPronunciation, autoplay, setAutoplay }: { pronunciation: 'en-GB' | 'en-US'; setPronunciation: (value: 'en-GB' | 'en-US') => void; autoplay: boolean; setAutoplay: (value: boolean) => void }) {
  return <div className="onboarding__content"><p className="eyebrow">最后一步</p><h1>让耳朵也参与记忆。</h1><p className="lead">学习卡和听写训练都可以使用浏览器自带的 Web Speech API。没有声音时，学习流程仍然可以正常进行。</p><fieldset className="choice-fieldset"><legend>默认发音</legend><div className="choice-grid choice-grid--two"><ChoiceButton active={pronunciation === 'en-GB'} onClick={() => setPronunciation('en-GB')}><span>英音</span><small>English (UK)</small></ChoiceButton><ChoiceButton active={pronunciation === 'en-US'} onClick={() => setPronunciation('en-US')}><span>美音</span><small>English (US)</small></ChoiceButton></div></fieldset><label className="toggle-row"><span><Volume2 size={17} /><span><strong>自动播放发音</strong><small>每张卡片显示时尝试播放</small></span></span><input type="checkbox" checked={autoplay} onChange={(event) => setAutoplay(event.target.checked)} /></label></div>
}

function ChoiceButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" className={`choice-button ${active ? 'is-selected' : ''}`} onClick={onClick}>{children}{active && <Check size={15} />}</button>
}
