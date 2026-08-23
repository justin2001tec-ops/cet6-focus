import { useEffect, useState } from 'react'
import { Bookmark, CalendarClock, Edit3, Save } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/app/providers'
import { BottomSheet } from '@/components/presentation/BottomSheet'
import { AudioButton } from '@/components/AppShell'
import { Badge, Button, IconButton } from '@/components/ui'
import { getCard, getWord, savePersonalNote, toggleStar } from '@/db/db'
import { formatDue } from '@/lib/dates'
import { isMastered, stateLabel } from '@/lib/fsrs'
import { speakWord } from '@/lib/speech'
import type { LearningCard, Word } from '@/types'

interface WordDetailSheetProps {
  wordId: string
  onClose: () => void
  restoreFocusRef: React.RefObject<HTMLElement | null>
}

export function WordDetailSheet({ wordId, onClose, restoreFocusRef }: WordDetailSheetProps) {
  const navigate = useNavigate()
  const { settings, showNotice } = useApp()
  const [word, setWord] = useState<Word | null>(null)
  const [card, setCard] = useState<LearningCard | null>(null)
  const [note, setNote] = useState('')
  const [editingNote, setEditingNote] = useState(false)

  useEffect(() => {
    let cancelled = false
    Promise.all([getWord(wordId), getCard(wordId)]).then(([nextWord, nextCard]) => {
      if (cancelled) return
      setWord(nextWord ?? null)
      setCard(nextCard ?? null)
      setNote(nextCard?.personalNote ?? '')
    }).catch(() => undefined)
    return () => { cancelled = true }
  }, [wordId])

  const play = () => {
    if (!word) return
    const result = speakWord(word.word, settings.pronunciation)
    if (!result.ok && result.message) showNotice(result.message)
  }

  const openFullDetail = () => {
    onClose()
    navigate(`/word/${wordId}`)
  }

  return <BottomSheet title={word?.word ?? '词条详情'} description={word?.phonetic || 'CET-6 vocabulary'} onClose={onClose} restoreFocusRef={restoreFocusRef}>
    {!word ? <div className="bottom-sheet__loading" aria-live="polite">正在读取词条…</div> : <>
      <div className="sheet-word-heading">
        <div><strong>{word.word}</strong><span>{word.phonetic || '/—/'}</span></div>
        <div className="sheet-word-heading__actions">
          <AudioButton label="播放发音" onClick={play} />
          {card && <IconButton label={card.starred ? '取消重点' : '标记重点'} variant={card.starred ? 'secondary' : 'ghost'} onClick={async () => { const next = await toggleStar(word.id); if (next) setCard(next) }}><Bookmark size={17} fill={card.starred ? 'currentColor' : 'none'} /></IconButton>}
        </div>
      </div>
      <section className="sheet-word-section">
        <div className="sheet-word-section__label">释义</div>
        {word.pos?.length && <Badge tone="blue">{word.pos.join(' · ')}</Badge>}
        <div className="sheet-word-meanings">{word.meaningZh.map((meaning) => <p key={meaning}>{meaning}</p>)}</div>
      </section>
      {word.examples?.length ? <section className="sheet-word-section"><div className="sheet-word-section__label">例句</div>{word.examples.slice(0, 2).map((example) => <div className="sheet-example" key={example.en}><p>{example.en}</p>{example.zh && <small>{example.zh}</small>}</div>)}</section> : null}
      {card && <section className="sheet-word-section sheet-word-status"><div className="sheet-word-section__label">学习状态</div><div className="sheet-status-row"><Badge tone={isMastered(card.fsrsCard, new Date(), settings.targetRetention) ? 'green' : 'blue'}>{isMastered(card.fsrsCard, new Date(), settings.targetRetention) ? 'Mastered' : stateLabel(card.fsrsCard.state)}</Badge><span><CalendarClock size={14} /> {formatDue(card.fsrsCard.due)}</span></div><small>记忆可提取度 {Math.round((card.fsrsCard.stability > 0 ? Math.min(1, card.fsrsCard.stability / 30) : 0) * 100)}% · 复习 {card.fsrsCard.reps} 次</small></section>}
      <section className="sheet-note-section">
        <div className="sheet-note-section__header"><div><strong>个人笔记</strong><small>只保存在当前浏览器</small></div><IconButton label={editingNote ? '保存笔记' : '编辑笔记'} onClick={async () => { if (editingNote) { const next = await savePersonalNote(word.id, note); if (next) setCard(next) } setEditingNote((value) => !value) }}>{editingNote ? <Save size={16} /> : <Edit3 size={16} />}</IconButton></div>
        {editingNote ? <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="写下一个联想、例句或易混淆点…" rows={3} /> : <p className={note ? '' : 'muted'}>{note || '还没有笔记。'}</p>}
      </section>
      <div className="bottom-sheet__actions"><Button onClick={() => navigate('/study')}><Edit3 size={16} /> 进入学习</Button><Button variant="soft" onClick={openFullDetail}>查看完整详情</Button></div>
    </>}
  </BottomSheet>
}
