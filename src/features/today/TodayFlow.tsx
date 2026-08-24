import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/app/providers'
import { BootScreen } from '@/components/States'
import { getDictationCandidates, getQueue } from '@/db/db'
import { Dictation } from '@/features/dictation/Dictation'
import { LearningComplete } from '@/features/study/LearningStages'
import { Study } from '@/features/study/Study'

type TodayStage = 'loading' | 'review' | 'study' | 'dictation' | 'complete'

export function TodayFlow() {
  const navigate = useNavigate()
  const { settings, showNotice } = useApp()
  const [stage, setStage] = useState<TodayStage>('loading')
  const queueSettings = useMemo(() => ({ dailyNewWords: settings.dailyNewWords }), [settings.dailyNewWords])

  useEffect(() => {
    let active = true
    async function start() {
      try {
        const review = await getQueue('review', queueSettings)
        if (active) setStage(review.length ? 'review' : await nextStageAfterReview())
      } catch {
        if (active) {
          showNotice('今日学习链路加载失败，请稍后重试。')
          setStage('complete')
        }
      }
    }
    async function nextStageAfterReview(): Promise<Exclude<TodayStage, 'loading' | 'review'>> {
      const study = await getQueue('study', queueSettings)
      if (study.length) return 'study'
      const dictation = await getDictationCandidates()
      return dictation.length ? 'dictation' : 'complete'
    }
    void start()
    return () => { active = false }
  }, [queueSettings, showNotice])

  async function continueAfterReview() {
    const study = await getQueue('study', queueSettings)
    if (study.length) {
      setStage('study')
      return
    }
    const dictation = await getDictationCandidates()
    setStage(dictation.length ? 'dictation' : 'complete')
  }

  async function continueAfterStudy() {
    const dictation = await getDictationCandidates()
    setStage(dictation.length ? 'dictation' : 'complete')
  }

  if (stage === 'loading') return <BootScreen />
  if (stage === 'review') return <Study key="today-review" mode="review" onComplete={() => void continueAfterReview()} />
  if (stage === 'study') return <Study key="today-study" mode="study" onComplete={() => void continueAfterStudy()} />
  if (stage === 'dictation') return <Dictation onComplete={() => setStage('complete')} />

  return <div className="learning-shell learning-shell--meaning"><div className="learning-shell__atmosphere" aria-hidden="true" /><div className="learning-shell__inner"><LearningComplete mode="study" onAgain={() => navigate('/study')} onHome={() => navigate('/')} /></div></div>
}
