import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { backgrounds, chooseBackground, type Background } from '@/config/backgrounds'
import { ensureDatabaseMetadataReady, ensureDatabaseReady, getDashboardSummary, getSettings, saveSettings } from '@/db/db'
import { defaultSettings } from '@/lib/fsrs'
import type { AppSettings, DashboardSummary } from '@/types'

interface AppContextValue {
  ready: boolean
  dataReady: boolean
  error: string | null
  settings: AppSettings
  summary: DashboardSummary | null
  background: Background | null
  notice: string | null
  refresh: () => Promise<void>
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>
  showNotice: (message: string) => void
  clearNotice: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

function chooseInitialBackground(settings: AppSettings): Background | null {
  if (settings.backgroundMode === 'off') return null
  if (settings.backgroundMode === 'fixed') return backgrounds.find((background) => background.id === settings.backgroundId) ?? backgrounds[0]
  const sessionId = sessionStorage.getItem('cet6-focus:background-id')
  const current = backgrounds.find((background) => background.id === sessionId)
  if (current) return current
  const lastId = localStorage.getItem('cet6-focus:last-background-id') ?? settings.lastBackgroundId ?? undefined
  const next = chooseBackground(lastId)
  sessionStorage.setItem('cet6-focus:background-id', next.id)
  localStorage.setItem('cet6-focus:last-background-id', next.id)
  return next
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [dataReady, setDataReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [settings, setSettings] = useState<AppSettings>(defaultSettings())
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [background, setBackground] = useState<Background | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const nextSettings = await getSettings()
    const nextSummary = await getDashboardSummary(nextSettings)
    setSettings(nextSettings)
    setSummary(nextSummary)
    setBackground(chooseInitialBackground(nextSettings))
  }, [])

  useEffect(() => {
    let active = true
    ensureDatabaseMetadataReady()
      .then(async () => {
        const initialSettings = await getSettings()
        if (active) {
          setSettings(initialSettings)
          setBackground(chooseInitialBackground(initialSettings))
          setReady(true)
        }
        await ensureDatabaseReady()
        await refresh()
        if (active) setDataReady(true)
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : '本地数据库初始化失败')
      })
    return () => {
      active = false
    }
  }, [refresh])

  useEffect(() => {
    if (!ready) return
    const root = document.documentElement
    root.dataset.theme = settings.theme
    root.dataset.reducedMotion = settings.reducedMotion ? 'true' : 'false'
  }, [ready, settings.theme, settings.reducedMotion])

  const updateSettings = useCallback(async (patch: Partial<AppSettings>) => {
    const current = await getSettings()
    const fixedPatch = patch.backgroundMode === 'fixed' && !patch.backgroundId
      ? { ...patch, backgroundId: background?.id ?? current.backgroundId ?? current.lastBackgroundId ?? backgrounds[0].id }
      : patch
    const next = await saveSettings(fixedPatch)
    setSettings(next)
    setBackground(chooseInitialBackground(next))
    setSummary(await getDashboardSummary(next))
  }, [background])

  const value = useMemo<AppContextValue>(() => ({
    ready,
    dataReady,
    error,
    settings,
    summary,
    background,
    notice,
    refresh,
    updateSettings,
    showNotice: setNotice,
    clearNotice: () => setNotice(null),
  }), [background, dataReady, error, notice, ready, refresh, settings, summary, updateSettings])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const value = useContext(AppContext)
  if (!value) throw new Error('useApp must be used inside AppProvider')
  return value
}
