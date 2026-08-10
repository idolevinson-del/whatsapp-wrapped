import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'
import { LanguageProvider } from './i18n'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <App />
      <Analytics />
    </LanguageProvider>
  </StrictMode>,
)

// Manual SW registration (injectRegister: false in vite.config.ts) so a new
// deploy actually reloads an already-open tab instead of silently activating
// for some future visit. Also polls for updates every 60s while the tab is
// open, rather than relying only on the browser's own (much slower, often
// ~24h-throttled) background check.
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    updateSW(true)
  },
  onRegisteredSW(_url, registration) {
    if (!registration) return
    setInterval(() => {
      registration.update()
    }, 60_000)
  },
})
