import { HelpCircle, Undo2, X } from 'lucide-react'
import { GlassIconButton } from '@/design-system/glass/GlassControls'
import { GlassSurface } from '@/design-system/glass/GlassSurface'

interface StudySessionChromeProps {
  modeLabel: string
  progress: number
  index: number
  total: number
  completed: boolean
  canUndo: boolean
  onUndo: () => void
  onHelp: () => void
  onExit: () => void
}

export function StudySessionChrome({ modeLabel, progress, index, total, completed, canUndo, onUndo, onHelp, onExit }: StudySessionChromeProps) {
  return (
    <header className="learning-topbar study-session-chrome" data-functional-layer="session-chrome">
      <GlassIconButton label="退出学习" className="study-session-chrome__close" onClick={onExit}><X size={18} strokeWidth={1.8} /></GlassIconButton>
      <div className="learning-progress study-session-chrome__status" aria-label={`${modeLabel}进度`}>
        <div className="study-session-chrome__status-line">
          <span className="learning-progress__mode">{modeLabel}</span>
          <span className="learning-progress__count">{completed ? '完成' : `${index + 1} / ${total}`}</span>
        </div>
        <div className="learning-progress__track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-label={`${modeLabel} ${progress}%`}><span style={{ width: `${progress}%` }} /></div>
      </div>
      <div className="learning-topbar__actions study-session-chrome__actions">
        {canUndo && <GlassSurface as="button" type="button" variant="clear" interactive className="learning-undo" onClick={onUndo}><Undo2 size={15} /><span>撤销</span></GlassSurface>}
        <GlassIconButton label="查看键盘帮助" className="study-session-chrome__help" onClick={onHelp}><HelpCircle size={18} strokeWidth={1.8} /></GlassIconButton>
      </div>
    </header>
  )
}
