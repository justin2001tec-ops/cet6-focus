import { useEffect, useRef, useState, type ReactNode } from 'react'

export function BottomActionDock({ children, className = '', sticky = false }: { children: ReactNode; className?: string; sticky?: boolean }) {
  const dockRef = useRef<HTMLDivElement | null>(null)
  const sentinelRef = useRef<HTMLSpanElement | null>(null)
  const [scrollOverlap, setScrollOverlap] = useState(false)

  useEffect(() => {
    if (!sticky) {
      setScrollOverlap(false)
      return
    }
    const dock = dockRef.current
    const sentinel = sentinelRef.current
    if (!dock || !sentinel || typeof IntersectionObserver === 'undefined') return

    let frame: number | null = null
    let observer: IntersectionObserver | null = null

    const update = () => {
      frame = null
      if (getComputedStyle(dock).position !== 'sticky') {
        setScrollOverlap(false)
        return
      }
      const dockRect = dock.getBoundingClientRect()
      const sentinelRect = sentinel.getBoundingClientRect()
      const stuckAtBottom = dockRect.bottom >= window.innerHeight - 1 && dockRect.top < window.innerHeight
      // The zero-height sentinel is in the sticky dock's exclusion zone when
      // it is physically underneath the dock, not merely above the dock top.
      setScrollOverlap(stuckAtBottom && sentinelRect.top < dockRect.bottom - 1)
    }

    const scheduleUpdate = () => {
      if (frame !== null) return
      frame = window.requestAnimationFrame(update)
    }

    const rebuildObserver = () => {
      observer?.disconnect()
      const margin = `0px 0px -${Math.ceil(dock.getBoundingClientRect().height)}px 0px`
      observer = new IntersectionObserver(scheduleUpdate, { rootMargin: margin, threshold: [0, 1] })
      observer.observe(sentinel)
      scheduleUpdate()
    }

    const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(rebuildObserver)
    resizeObserver?.observe(dock)
    rebuildObserver()
    window.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate)
    return () => {
      observer?.disconnect()
      resizeObserver?.disconnect()
      window.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
      if (frame !== null) window.cancelAnimationFrame(frame)
    }
  }, [sticky])

  return (
    <>
      <span ref={sentinelRef} className="bottom-action-dock__sentinel" aria-hidden="true" />
      <div ref={dockRef} className={`learning-stage-actions bottom-action-dock ${sticky ? 'bottom-action-dock--sticky' : ''} ${className}`} data-functional-layer="bottom-actions" data-scroll-edge="conditional" data-scroll-overlap={scrollOverlap ? 'true' : 'false'}>
      <span className="bottom-action-dock__edge" aria-hidden="true" />
      <div className="bottom-action-dock__actions">{children}</div>
      </div>
    </>
  )
}
