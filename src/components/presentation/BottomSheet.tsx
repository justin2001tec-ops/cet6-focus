import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { animate, m, useMotionValue } from 'motion/react'
import { X } from 'lucide-react'
import { IconButton } from '@/components/ui'
import { useMotionProfile } from '@/design-system/motion/useMotionProfile'

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
const OPENING_OFFSET_MIN = 32
const OPENING_OFFSET_MAX = 56

export function PhysicalSheet({ title, description, onClose, restoreFocusRef, children }: BottomSheetProps) {
  const { profile } = useMotionProfile()
  const reducedMotion = profile === 'reduced'
  const initialOffset = typeof window === 'undefined' ? 40 : Math.min(OPENING_OFFSET_MAX, Math.max(OPENING_OFFSET_MIN, window.innerHeight * 0.07))
  const sheetY = useMotionValue(reducedMotion ? 0 : initialOffset)
  const reducedMotionRef = useRef(reducedMotion)
  const onCloseRef = useRef(onClose)
  reducedMotionRef.current = reducedMotion
  onCloseRef.current = onClose
  const closeRef = useRef<HTMLButtonElement>(null)
  const sheetRef = useRef<HTMLElement>(null)
  const historyEntryRef = useRef(false)
  const historyCleanupPendingRef = useRef(false)
  const dismissingRef = useRef(false)
  const dismissAnimationCompleteRef = useRef(false)
  const closeCompleteRef = useRef(false)
  const animationIdRef = useRef(0)
  const sheetAnimationRef = useRef<{ stop: () => void } | null>(null)
  const lostCaptureTimerRef = useRef<number | null>(null)
  const gestureRef = useRef<GestureState | null>(null)
  const grabberRef = useRef<HTMLDivElement>(null)
  const pointerListenersRef = useRef<PointerListeners | null>(null)
  const [sheetState, setSheetState] = useState<SheetState>('entering')

  const clearPointerListeners = useCallback(() => {
    const listeners = pointerListenersRef.current
    if (!listeners) return
    window.removeEventListener('pointermove', listeners.move)
    window.removeEventListener('pointerup', listeners.end)
    window.removeEventListener('pointercancel', listeners.end)
    pointerListenersRef.current = null
  }, [])

  const stopSheetAnimation = useCallback(() => {
    animationIdRef.current += 1
    sheetAnimationRef.current?.stop()
    sheetAnimationRef.current = null
  }, [])

  const animateSheetTo = useCallback((target: number, velocityY: number, onComplete: () => void) => {
    stopSheetAnimation()
    const animationId = animationIdRef.current
    if (reducedMotionRef.current) {
      sheetY.set(target)
      onComplete()
      return
    }
    const controls = animate(sheetY, target, {
      type: 'spring',
      visualDuration: 0.3,
      bounce: 0.05,
      velocity: velocityY,
      onComplete: () => {
        if (animationId !== animationIdRef.current) return
        sheetAnimationRef.current = null
        onComplete()
      },
    })
    sheetAnimationRef.current = controls
  }, [sheetY, stopSheetAnimation])

  const completeClose = useCallback(() => {
    if (closeCompleteRef.current) return
    closeCompleteRef.current = true
    onCloseRef.current()
  }, [])

  const finishDismissAnimation = useCallback(() => {
    dismissAnimationCompleteRef.current = true
    if (!historyCleanupPendingRef.current) completeClose()
  }, [completeClose])

  const beginDismiss = useCallback((velocityY = 0) => {
    if (dismissingRef.current || closeCompleteRef.current) return
    dismissingRef.current = true
    if (historyEntryRef.current) {
      historyEntryRef.current = false
      historyCleanupPendingRef.current = true
      window.history.back()
    }
    clearPointerListeners()
    gestureRef.current = null
    setSheetState('dismissing')
    const height = sheetRef.current?.getBoundingClientRect().height ?? window.innerHeight
    animateSheetTo(Math.max(height, window.innerHeight), Math.max(0, velocityY), finishDismissAnimation)
  }, [animateSheetTo, clearPointerListeners, finishDismissAnimation])

  const requestClose = useCallback(() => {
    if (dismissingRef.current || closeCompleteRef.current) return
    beginDismiss()
  }, [beginDismiss])

  const snapBack = useCallback((velocityY = 0) => {
    if (dismissingRef.current || closeCompleteRef.current) return
    setSheetState('snapping')
    animateSheetTo(0, velocityY, () => setSheetState('idle'))
  }, [animateSheetTo])

  const finishGesture = useCallback((gesture: GestureState, cancelled = false) => {
    if (cancelled) {
      snapBack(gesture.velocityY)
      return
    }
    const height = sheetRef.current?.getBoundingClientRect().height ?? window.innerHeight
    const shouldDismiss = gesture.offset > height * DISMISS_OFFSET_RATIO || gesture.velocityY > DISMISS_VELOCITY
    if (shouldDismiss) {
      beginDismiss(gesture.velocityY)
      return
    }
    snapBack(gesture.velocityY)
  }, [beginDismiss, snapBack])

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const restoreTarget = restoreFocusRef?.current
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const frame = window.requestAnimationFrame(() => {
      if (reducedMotionRef.current) {
        sheetY.set(0)
        setSheetState('idle')
        closeRef.current?.focus()
        return
      }
      animateSheetTo(0, 0, () => {
        setSheetState('idle')
        closeRef.current?.focus()
      })
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
      if (historyCleanupPendingRef.current) {
        historyCleanupPendingRef.current = false
        if (dismissAnimationCompleteRef.current) completeClose()
        return
      }
      if (dismissingRef.current || closeCompleteRef.current) return
      historyEntryRef.current = false
      beginDismiss()
    }
    const onOrientationChange = () => {
      clearPointerListeners()
      gestureRef.current = null
      snapBack()
    }

    const existingHistoryState = window.history.state as { __cet6PhysicalSheet?: boolean } | null
    if (!existingHistoryState?.__cet6PhysicalSheet) {
      window.history.pushState({ ...(window.history.state ?? {}), __cet6PhysicalSheet: true }, document.title, window.location.href)
    }
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
      stopSheetAnimation()
      document.body.style.overflow = previousOverflow
      if (lostCaptureTimerRef.current !== null) window.clearTimeout(lostCaptureTimerRef.current)
      const focusTarget = restoreTarget ?? previousFocus
      if (focusTarget?.isConnected) focusTarget.focus()
    }
  }, [animateSheetTo, beginDismiss, clearPointerListeners, completeClose, requestClose, restoreFocusRef, sheetY, snapBack, stopSheetAnimation])

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
    sheetY.set(delta)
  }, [sheetY])

  const endGesture = useCallback((event: PointerEvent) => {
    const gesture = gestureRef.current
    if (!gesture || gesture.pointerId !== event.pointerId) return
    if (event.type === 'pointerup') updateGesture(event)
    const snapshot = { ...gesture }
    gesture.active = false
    clearPointerListeners()
    if (grabberRef.current?.hasPointerCapture(event.pointerId)) grabberRef.current.releasePointerCapture(event.pointerId)
    gestureRef.current = null
    finishGesture(snapshot, event.type === 'pointercancel')
  }, [clearPointerListeners, finishGesture, updateGesture])

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || dismissingRef.current) return
    stopSheetAnimation()
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
    <div className="bottom-sheet-layer" role="presentation" data-physical-sheet="true" data-sheet-motion-profile={profile}>
      <button className="bottom-sheet__backdrop" type="button" aria-label="关闭词条详情" onClick={requestClose} tabIndex={-1} />
      <m.section
        ref={sheetRef}
        className="bottom-sheet"
        data-sheet-state={sheetState}
        data-sheet-velocity-handoff={sheetState === 'snapping' || sheetState === 'dismissing' ? 'active' : 'idle'}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bottom-sheet-title"
        aria-describedby={description ? 'bottom-sheet-description' : undefined}
        tabIndex={-1}
        style={{ y: sheetY }}
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
      </m.section>
    </div>,
    document.body,
  )
}

export const BottomSheet = PhysicalSheet
