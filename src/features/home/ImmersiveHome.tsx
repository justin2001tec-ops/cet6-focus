import { ArrowUpRight, BookOpen, RotateCcw } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useApp } from '@/app/providers'
import { getAllWords } from '@/db/db'
import { backgrounds } from '@/config/backgrounds'
import { formatDate } from '@/lib/dates'
import type { Word } from '@/types'

export function ImmersiveHome() {
  const { background, settings, summary } = useApp()
  const [words, setWords] = useState<Word[]>([])
  const scene = background ?? backgrounds[0]
  const featuredWord = words.find((word) => scene.featuredWords.includes(word.word)) ?? words[0]
  const todayNew = summary ? Math.min(summary.newCount, settings.dailyNewWords) : 0
  const due = summary?.dueCount ?? 0

  useEffect(() => {
    let active = true
    getAllWords().then((nextWords) => {
      if (active) setWords(nextWords.filter((word) => !word.archived))
    }).catch(() => undefined)
    return () => { active = false }
  }, [])

  if (!summary) return null

  return (
    <div className={`page page--dashboard page--immersive-home ${background ? '' : 'immersive-home--off'}`} data-scene-id={background?.id ?? 'off'}>
      <section className="immersive-home__stage" aria-labelledby="immersive-home-word">
        <div className="immersive-home__kicker">CET6 FOCUS <span aria-hidden="true">·</span> {formatDate(new Date(), { weekday: 'long', month: 'long', day: 'numeric' })}</div>
        {featuredWord ? <>
          <NavLink className="immersive-home__word-link" to={`/word/${featuredWord.id}`} aria-label={`打开单词 ${featuredWord.word}`}>
            <h1 id="immersive-home-word" className="immersive-home__featured-word">{featuredWord.word}</h1>
          </NavLink>
          <div className="immersive-home__word-meta"><span>{featuredWord.phonetic ?? '·'}</span><span aria-hidden="true">·</span><span>{featuredWord.meaningZh.slice(0, 2).join('；')}</span></div>
        </> : <h1 id="immersive-home-word" className="immersive-home__featured-word">CET6 Focus</h1>}
        <p className="immersive-home__scene-note">{scene.label}<span aria-hidden="true"> · </span>{scene.category}</p>
      </section>

      <section className="immersive-home__actions" aria-label="今日学习入口">
        <NavLink to="/study" className="immersive-home__task-card immersive-home__task-card--learn">
          <span className="immersive-home__task-icon"><BookOpen size={18} aria-hidden="true" /></span>
          <span className="immersive-home__task-copy"><strong>Learn</strong><small>新词 · {todayNew} 个</small></span>
          <span className="immersive-home__task-value">{todayNew}</span>
          <ArrowUpRight className="immersive-home__task-arrow" size={17} aria-hidden="true" />
        </NavLink>
        <NavLink to="/review" className="immersive-home__task-card immersive-home__task-card--review">
          <span className="immersive-home__task-icon"><RotateCcw size={18} aria-hidden="true" /></span>
          <span className="immersive-home__task-copy"><strong>Review</strong><small>到期 · {due} 个</small></span>
          <span className="immersive-home__task-value">{due}</span>
          <ArrowUpRight className="immersive-home__task-arrow" size={17} aria-hidden="true" />
        </NavLink>
      </section>
    </div>
  )
}
