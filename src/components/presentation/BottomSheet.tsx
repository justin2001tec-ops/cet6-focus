import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { IconButton } from '@/components/ui'

interface BottomSheetProps {
  title: string
  description?: string
  onClose: () => void
  restoreFocusRef?: React.RefObject<HTMLElement | null>
  children: React.ReactNode
}

type SheetState = 'entering' | 'idle' | 'dragging' | 'snapping' | 'dismissing'

interface GestureState {
  pointerId: number
  startY: number
  lastY: number
  lastTime: number
  offset: number
  velocityY: number
  active: boolean
}

interface PointerListeners {
  move: (event: PointerEvent) => void
  end: (event: PointerEvent) => void
}

const DISMISS_OFFSET_RATIO = 0.32
const DISMISS_VELOCITY = 720

export function PhysicalSheet({ title, description, onClose, restoreFocusRef, children }: BottomSheetProps) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const sheetRef = useRef<HTMLElement>(null)
  const historyEntryRef = useRef(false)
  const closingRef = useRef(false)
  const dismissTimerRef = useRef<number | null>(null)
  const settleTimerRef = useRef<number | null>(null)
  const lostCaptureTimerRef = useRef<number | null>(null)
  const gestureRef = useRef<GestureState | null>(null)
  const grabberRef = useRef<HTMLDivElement>(null)
  const pointerListenersRef = useRef<PointerListeners | null>(null)
  const [sheetState, setSheetState] = useState<SheetState>('entering')

  const setOffset = useCallback((offset: number) => {
    sheetRef.current?.style.setProperty('--sheet-offset', `${Math.max(0, offset)}px`)
  }, [])

  const clearPointerListeners = useCallback(() => {
    const listeners = pointerListenersRef.current
    if (!listeners) return
    window.removeEventListener('pointermove', listeners.move)
    window.removeEventListener('pointerup', listeners.end)
    window.removeEventListener('pointercancel', listeners.end)
    pointerListenersRef.current = null
  }, [])

  const requestClose = useCallback(() => {
    if (closingRef.current) return
    closingRef.current = true
    if (historyEntryRef.current) {
      historyEntryRef.current = false
      window.history.back()
    }
    onClose()
  }, [onClose])

  const snapBack = useCallback(() => {
    setSheetState('snapping')
    setOffset(0)
    if (settleTimerRef.current !== null) window.clearTimeout(settleTimerRef.current)
    settleTimerRef.current = window.setTimeout(() => setSheetState('idle'), 300)
  }, [setOffset])

  const finishGesture = useCallback(() => {
    const gesture = gestureRef.current
    if (!gesture?.active) return
    gesture.active = false
    const height = sheetRef.current?.getBoundingClientRect().height ?? window.innerHeight
    const shouldDismiss = gesture.offset > height * DISMISS_OFFSET_RATIO || gesture.velocityY > DISMISS_VELOCITY
    if (shouldDismiss) {
      setSheetState('dismissing')
      setOffset(Math.max(height, window.innerHeight))
      if (dismissTimerRef.current !== null) window.clearTimeout(dismissTimerRef.current)
      dismissTimerRef.current = window.setTimeout(requestClose, 220)
      return
    }
    snapBack()
  }, [requestClose, setOffset, snapBack])

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const restoreTarget = restoreFocusRef?.current
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const frame = window.requestAnimationFrame(() => {
      setSheetState('idle')
      closeRef.current?.focus()
    })

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        requestClose()
        return
      }
      if (event.key !== 'Tab' || !sheetRef.current) return
      const focusable = Array.from(sheetRef.current.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])')).filter((element) => !element.hasAttribute('disabled'))
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    const onPopState = () => {
      if (closingRef.current) return
      historyEntryRef.current = false
      closingRef.current = true
      onClose()
    }
    const onOrientationChange = () => {
      clearPointerListeners()
      gestureRef.current = null
      snapBack()
    }

    window.history.pushState({ ...(window.history.state ?? {}), __cet6PhysicalSheet: true }, document.title, window.location.href)
    historyEntryRef.current = true
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('popstate', onPopState)
    window.addEventListener('orientationchange', onOrientationChange)
    return () => {
      window.cancelAnimationFrame(frame)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('popstate', onPopState)
      window.removeEventListener('orientationchange', onOrientationChange)
      clearPointerListeners()
      document.body.style.overflow = previousOverflow
      if (dismissTimerRef.current !== null) window.clearTimeout(dismissTimerRef.current)
      if (settleTimerRef.current !== null) window.clearTimeout(settleTimerRef.current)
      if (lostCaptureTimerRef.current !== null) window.clearTimeout(lostCaptureTimerRef.current)
      const focusTarget = restoreTarget ?? previousFocus
      if (focusTarget?.isConnected) focusTarget.focus()
    }
  }, [clearPointerListeners, onClose, requestClose, restoreFocusRef, snapBack])

  const updateGesture = useCallback((event: PointerEvent) => {
    const gesture = gestureRef.current
    if (!gesture?.active || gesture.pointerId !== event.pointerId) return
    const now = performance.now()
    const delta = Math.max(0, event.clientY - gesture.startY)
    const elapsed = Math.max(1, now - gesture.lastTime)
    gesture.velocityY = ((event.clientY - gesture.lastY) / elapsed) * 1000
    gesture.lastY = event.clientY
    gesture.lastTime = now
    gesture.offset = delta
    setOffset(delta)
  }, [setOffset])

  const endGesture = useCallback((event: PointerEvent) => {
    const gesture = gestureRef.current
    if (!gesture || gesture.pointerId !== event.pointerId) return
    if (event.type === 'pointerup') updateGesture(event)
    clearPointerListeners()
    finishGesture()
    if (grabberRef.current?.hasPointerCapture(event.pointerId)) grabberRef.current.releasePointerCapture(event.pointerId)
    gestureRef.current = null
  }, [clearPointerListeners, finishGesture, updateGesture])

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary) return
    clearPointerListeners()
    const now = performance.now()
    gestureRef.current = { pointerId: event.pointerId, startY: event.clientY, lastY: event.clientY, lastTime: now, offset: 0, velocityY: 0, active: true }
    setSheetState('dragging')
    const listeners: PointerListeners = {
      move: (pointerEvent) => {
        updateGesture(pointerEvent)
        if (gestureRef.current?.active && gestureRef.current.pointerId === pointerEvent.pointerId) pointerEvent.preventDefault()
      },
      end: (pointerEvent) => endGesture(pointerEvent),
    }
    pointerListenersRef.current = listeners
    window.addEventListener('pointermove', listeners.move, { passive: false })
    window.addEventListener('pointerup', listeners.end)
    window.addEventListener('pointercancel', listeners.end)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handleLostPointerCapture = () => {
    if (lostCaptureTimerRef.current !== null) window.clearTimeout(lostCaptureTimerRef.current)
    lostCaptureTimerRef.current = window.setTimeout(() => {
      lostCaptureTimerRef.current = null
      if (gestureRef.current?.active) endGesture(new PointerEvent('pointercancel', { pointerId: gestureRef.current.pointerId }))
    }, 50)
  }

  return createPortal(
    <div className="bottom-sheet-layer" role="presentation" data-physical-sheet="true">
      <button className="bottom-sheet__backdrop" type="button" aria-label="关闭词条详情" onClick={requestClose} tabIndex={-1} />
      <section
        ref={sheetRef}
        className="bottom-sheet"
        data-sheet-state={sheetState}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bottom-sheet-title"
        aria-describedby={description ? 'bottom-sheet-description' : undefined}
        tabIndex={-1}
      >
        <div
          className="bottom-sheet__grabber"
          aria-hidden="true"
          ref={grabberRef}
          onPointerDown={handlePointerDown}
          onLostPointerCapture={handleLostPointerCapture}
        />
        <header className="bottom-sheet__header">
          <div>
            <h2 id="bottom-sheet-title">{title}</h2>
            {description && <p id="bottom-sheet-description">{description}</p>}
          </div>
          <IconButton ref={closeRef} className="bottom-sheet__close" label="关闭词条详情" onClick={requestClose}><X size={18} /></IconButton>
        </header>
        <div className="bottom-sheet__content">{children}</div>
      </section>
    </div>,
    document.body,
  )
}

export const BottomSheet = PhysicalSheet
