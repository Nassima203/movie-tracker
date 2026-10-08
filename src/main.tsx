import '@fontsource-variable/inter'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { renderStartupError } from '@/app/startupError'
import '@/styles/index.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element #root not found in index.html')
}

/**
 * The app is imported dynamically so that a failure while loading it (e.g. an
 * invalid environment configuration) shows a readable screen, not a blank page.
 */
async function start(container: HTMLElement): Promise<void> {
  try {
    const { App } = await import('@/app/App')
    createRoot(container).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  } catch (error) {
    console.error('[uwatch] startup failed', error)
    renderStartupError(container, error)
  }
}

void start(rootElement)
