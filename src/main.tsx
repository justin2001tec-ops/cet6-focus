import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppRouter } from '@/app/router'
import { withBase } from '@/lib/public-path'
import '@/styles/global.css'

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
