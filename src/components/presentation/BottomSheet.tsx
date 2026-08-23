import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface BottomSheetProps {
  title: string
  description?: string
  onClose: () => void
  restoreFocusRef?: React.RefObject<HTMLElement | null>
  children: React.ReactNode
}

export function BottomSheet({ title, description, onClose, restoreFocusRef, children }: BottomSheetProps) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const pointerStartY = useRef<number | null>(null)

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const restoreTarget = restoreFocusRef?.current
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusSheet = () => closeRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    const frame = window.requestAnimationFrame(focusSheet)
    return () => {
      window.cancelAnimationFrame(frame)
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      const focusTarget = restoreTarget ?? previousFocus
      if (focusTarget?.isConnected) focusTarget.focus()
    }
  }, [onClose, restoreFocusRef])

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    pointerStartY.current = event.clientY
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointerStartY.current !== null && event.clientY - pointerStartY.current > 72) onClose()
    pointerStartY.current = null
  }

  return createPortal(
    <div className="bottom-sheet-layer" role="presentation">
      <button className="bottom-sheet__backdrop" type="button" aria-label="关闭词条详情" onClick={onClose} tabIndex={-1} />
      <section
        ref={sheetRef}
        className="bottom-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bottom-sheet-title"
        aria-describedby={description ? 'bottom-sheet-description' : undefined}
        tabIndex={-1}
      >
        <div className="bottom-sheet__grabber" aria-hidden="true" onPointerDown={handlePointerDown} onPointerUp={handlePointerUp} onPointerCancel={() => { pointerStartY.current = null }} />
        <header className="bottom-sheet__header">
          <div>
            <h2 id="bottom-sheet-title">{title}</h2>
            {description && <p id="bottom-sheet-description">{description}</p>}
          </div>
          <button ref={closeRef} className="bottom-sheet__close icon-button" type="button" aria-label="关闭词条详情" onClick={onClose}><X size={18} /></button>
        </header>
        <div className="bottom-sheet__content">{children}</div>
      </section>
    </div>,
    document.body,
  )
}
