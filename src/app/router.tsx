import { HashRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { AppProvider, useApp } from '@/app/providers'
import { AppShell } from '@/components/AppShell'
import { BootScreen, ErrorScreen } from '@/components/States'
import { ImmersiveHome } from '@/features/home/ImmersiveHome'
import { TodayFlow } from '@/features/today/TodayFlow'
import { Dictation } from '@/features/dictation/Dictation'
import { Mistakes } from '@/features/mistakes/Mistakes'
import { Onboarding } from '@/features/onboarding/Onboarding'
import { Settings } from '@/features/settings/Settings'
import { Stats } from '@/features/stats/Stats'
import { Study } from '@/features/study/Study'
import { Vocabulary } from '@/features/vocabulary/Vocabulary'
import { WordDetail } from '@/features/vocabulary/WordDetail'
import { LearningHub } from '@/features/learn/LearningHub'
import { More } from '@/features/more/More'

function ReadyGate() {
  const { ready, dataReady, error, settings } = useApp()
  const location = useLocation()
  if (!ready && !error) return <BootScreen />
  if (error) return <ErrorScreen message={error} />
  if (!dataReady) return <BootScreen />
  if (!settings.onboarded && location.pathname !== '/onboarding') return <Navigate to="/onboarding" replace />
  if (settings.onboarded && location.pathname === '/onboarding') return <Navigate to="/" replace />
  return <Outlet />
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname])
  return null
}

export function AppRouter() {
  return (
    <AppProvider>
      <HashRouter>
        <ScrollToTop />
        <Routes>
          <Route element={<ReadyGate />}>
            <Route path="/onboarding" element={<Onboarding />} />
            <Route element={<AppShell />}>
              <Route path="/" element={<ImmersiveHome />} />
              <Route path="/learn" element={<LearningHub />} />
              <Route path="/more" element={<More />} />
              <Route path="/today" element={<TodayFlow />} />
              <Route path="/study" element={<Study mode="study" />} />
              <Route path="/review" element={<Study mode="review" />} />
              <Route path="/mistakes/study" element={<Study mode="weak" />} />
              <Route path="/dictation" element={<Dictation />} />
              <Route path="/words" element={<Vocabulary />} />
              <Route path="/word/:id" element={<WordDetail />} />
              <Route path="/words/:id" element={<WordDetail />} />
              <Route path="/mistakes" element={<Mistakes />} />
              <Route path="/stats" element={<Stats />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AppProvider>
  )
}
