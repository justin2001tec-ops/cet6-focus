import { NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useState, type MouseEvent } from 'react'
import { useApp } from '@/app/providers'
import { getAllWords } from '@/db/db'
import { backgrounds } from '@/config/backgrounds'
import type { Word } from '@/types'

export function ImmersiveHome() {
  const navigate = useNavigate()
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
        {featuredWord ? (
          <NavLink className="immersive-home__word-link" to={`/word/${featuredWord.id}`} aria-label={`打开单词 ${featuredWord.word}`}>
            <h1 id="immersive-home-word" className="immersive-home__featured-word">{featuredWord.word}</h1>
          </NavLink>
        ) : <h1 id="immersive-home-word" className="immersive-home__featured-word">focus</h1>}
      </section>

      <section className="immersive-home__actions" aria-label="今日学习入口">
        <NavLink to="/study" onClick={(event) => navigateToLearning(event, navigate, '/study')} className="immersive-home__task-card immersive-home__task-card--learn">
          <span className="immersive-home__task-label">Learn</span>
          <span className="immersive-home__task-value">{todayNew}</span>
        </NavLink>
        <NavLink to="/review" onClick={(event) => navigateToLearning(event, navigate, '/review')} className="immersive-home__task-card immersive-home__task-card--review">
          <span className="immersive-home__task-label">Review</span>
          <span className="immersive-home__task-value">{due}</span>
        </NavLink>
      </section>
    </div>
  )
}

function navigateToLearning(event: MouseEvent<HTMLAnchorElement>, navigate: ReturnType<typeof useNavigate>, path: '/study' | '/review') {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  event.preventDefault()
  const root = document.documentElement
  root.classList.add('learning-route-transition')
  const transitionDocument = document as Document & {
    startViewTransition?: (callback: () => void) => { finished: Promise<void> }
  }

  try {
    if (transitionDocument.startViewTransition) {
      const transition = transitionDocument.startViewTransition(() => navigate(path))
      void transition.finished.catch(() => undefined).finally(() => root.classList.remove('learning-route-transition'))
      return
    }
  } catch {
    // Fall through to the same opacity/transform bridge when the API is unavailable or interrupted.
  }

  navigate(path)
  window.setTimeout(() => root.classList.remove('learning-route-transition'), 480)
}
