import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppRouter } from '@/app/router'
import { withBase } from '@/lib/public-path'
import '@/styles/global.css'
import '@/styles/ios26-tokens.css'
import '@/styles/ios26-materials.css'
import '@/styles/ios26-layout.css'
import '@/styles/bbdcd-home.css'
import '@/styles/motion-tokens.css'
import '@/styles/learning-experience.css'
import '@/styles/system-experience.css'
import '@/design-system/glass/glass.css'
import '@/styles/study-liquid-glass.css'

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(withBase('sw.js')).catch(() => undefined)
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppRouter />
  </StrictMode>,
)
