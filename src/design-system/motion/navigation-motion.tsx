import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useLocation, useNavigate, type NavigateOptions } from 'react-router-dom'

interface NavigationMotionValue {
  navigateWithMotion: (to: string, options?: NavigateOptions) => void
  markNavigationIntent: () => number
  intentId: number
}

const NavigationMotionContext = createContext<NavigationMotionValue | null>(null)

export function NavigationMotionProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const nextIntentId = useRef(0)
  const [intentId, setIntentId] = useState(0)

  const markNavigationIntent = useCallback(() => {
    const next = ++nextIntentId.current
    setIntentId(next)
    document.documentElement.dataset.motionIntentId = String(next)
    return next
  }, [])

  const navigateWithMotion = useCallback((to: string, options?: NavigateOptions) => {
    markNavigationIntent()
    navigate(to, options)
  }, [markNavigationIntent, navigate])

  useEffect(() => {
    document.documentElement.dataset.motionRoute = location.pathname
  }, [location.pathname])

  return <NavigationMotionContext.Provider value={{ navigateWithMotion, markNavigationIntent, intentId }}>{children}</NavigationMotionContext.Provider>
}

export function useNavigationMotion(): NavigationMotionValue {
  const value = useContext(NavigationMotionContext)
  if (!value) throw new Error('useNavigationMotion must be used inside NavigationMotionProvider')
  return value
}
