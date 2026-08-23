import { useEffect, useState } from 'react'
import { ArrowLeft, Bookmark, CalendarClock, Edit3, Save, Volume2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useApp } from '@/app/providers'
import { AudioButton, PageHeader } from '@/components/AppShell'
import { EmptyState } from '@/components/States'
import { Badge, Button, IconButton } from '@/components/ui'
import { getCard, getWord, savePersonalNote, toggleStar } from '@/db/db'
import { formatDate, formatDue } from '@/lib/dates'
import { isMastered, retrievability, stateLabel } from '@/lib/fsrs'
import { speakWord } from '@/lib/speech'
import type { LearningCard, Word } from '@/types'

export function WordDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { settings, showNotice } = useApp()
  const [word, setWord] = useState<Word | null>(null)
  const [card, setCard] = useState<LearningCard | null>(null)
  const [note, setNote] = useState('')
  const [editingNote, setEditingNote] = useState(false)

  useEffect(() => {
    if (!id) return
    Promise.all([getWord(id), getCard(id)]).then(([nextWord, nextCard]) => { setWord(nextWord ?? null); setCard(nextCard ?? null); setNote(nextCard?.personalNote ?? '') }).catch(() => undefined)
  }, [id])

  if (!word || !card) return <div className="page"><EmptyState title="找不到这个词条" description="它可能来自另一个词库版本，或链接已经失效。" action={<Button onClick={() => navigate('/words')}><ArrowLeft size={16} /> 回到词库</Button>} /></div>
  const mastered = isMastered(card.fsrsCard, new Date(), settings.targetRetention)
  const retrieval = Math.round(retrievability(card.fsrsCard, new Date(), settings.targetRetention) * 100)

  return <div className="page page--word-detail"><PageHeader eyebrow="Word detail" title={word.word} description={word.phonetic || 'CET-6 vocabulary'} action={<div className="page-header__actions"><IconButton label="播放发音" onClick={() => { const result = speakWord(word.word, settings.pronunciation); if (!result.ok && result.message) showNotice(result.message) }}><Volume2 size={18} /></IconButton><IconButton label={card.starred ? '取消重点' : '标记重点'} variant={card.starred ? 'secondary' : 'ghost'} onClick={async () => { const next = await toggleStar(word.id); if (next) setCard(next) }}><Bookmark size={18} fill={card.starred ? 'currentColor' : 'none'} /></IconButton></div>} /><section className="word-detail-layout"><div className="word-detail-main card-surface"><div className="word-detail-main__top"><span className="word-detail__phonetic">{word.phonetic || '/—/'}</span><AudioButton label="播放发音" onClick={() => { const result = speakWord(word.word, settings.pronunciation); if (!result.ok && result.message) showNotice(result.message) }} /></div><div className="word-detail__meaning">{word.pos?.length && <Badge tone="blue">{word.pos.join(' · ')}</Badge>}{word.meaningZh.map((meaning) => <p key={meaning}>{meaning}</p>)}</div>{word.definitionEn?.length && <DetailBlock label="English definition"><p>{word.definitionEn.join('；')}</p></DetailBlock>}{word.examples?.length ? <DetailBlock label="Example">{word.examples.map((example) => <div key={example.en}><p>{example.en}</p>{example.zh && <small>{example.zh}</small>}</div>)}</DetailBlock> : <DetailBlock label="学习提示"><p>把 {word.word} 放入一条你自己的句子里，记忆会比孤立地看释义更稳。</p></DetailBlock>}{word.frequency && <DetailBlock label="词频"><p>BNC {word.frequency.bnc ?? '—'} · Contemporary {word.frequency.contemporary ?? '—'}</p></DetailBlock>}</div><aside className="word-detail-side"><div className="card-surface detail-status"><div className="detail-status__title"><span>学习状态</span><Badge tone={mastered ? 'green' : 'blue'}>{mastered ? 'Mastered' : stateLabel(card.fsrsCard.state)}</Badge></div><div className="detail-metrics"><div><strong>{retrieval}%</strong><span>记忆可提取度</span></div><div><strong>{card.fsrsCard.reps}</strong><span>复习次数</span></div><div><strong>{card.spellingWrongCount}</strong><span>拼写错误</span></div></div><div className="detail-next"><CalendarClock size={16} /><span>下次复习</span><strong>{formatDue(card.fsrsCard.due)}</strong><small>{formatDate(card.fsrsCard.due, { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</small></div><Button onClick={() => navigate('/study')}><Edit3 size={16} /> 进入学习</Button></div><div className="card-surface note-card"><div className="section-header"><div><h2>个人笔记</h2><p>只保存在你的浏览器</p></div><IconButton label={editingNote ? '保存笔记' : '编辑笔记'} onClick={async () => { if (editingNote) { const next = await savePersonalNote(word.id, note); if (next) setCard(next) } setEditingNote((value) => !value) }}>{editingNote ? <Save size={16} /> : <Edit3 size={16} />}</IconButton></div>{editingNote ? <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="写下一个联想、例句或易混淆点…" rows={5} /> : <p className={note ? '' : 'muted'}>{note || '还没有笔记。'}</p>}</div><Link className="back-link" to="/words"><ArrowLeft size={15} /> 返回词库</Link></aside></section></div>
}

function DetailBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="word-detail-block word-detail-block--large"><span>{label}</span>{children}</div>
}
