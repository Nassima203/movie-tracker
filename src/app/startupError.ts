/**
 * Shown when the app cannot start (e.g. invalid configuration), instead of a
 * blank page. Plain DOM on purpose: React may be the part that failed.
 */
export function renderStartupError(container: HTMLElement, error: unknown): void {
  const detail = error instanceof Error ? error.message : String(error)

  const wrapper = document.createElement('main')
  wrapper.setAttribute('role', 'alert')
  wrapper.style.cssText =
    'min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:24px;text-align:center;font-family:system-ui,sans-serif;background:#07070b;color:#f4f4f6'

  const title = document.createElement('h1')
  title.textContent = 'uwatch ne peut pas démarrer'
  title.style.cssText = 'font-size:1.5rem;margin:0'

  const message = document.createElement('p')
  message.textContent = 'Vérifiez la configuration puis rechargez la page.'
  message.style.cssText = 'margin:0;color:#a3a3b0'

  const technical = document.createElement('pre')
  technical.textContent = detail
  technical.style.cssText =
    'max-width:40rem;white-space:pre-wrap;margin:8px 0 0;padding:12px 16px;border-radius:8px;background:#14141c;color:#f0b54a;font-size:0.85rem;text-align:left'

  wrapper.append(title, message)
  // Configuration details only help the developer: never shown in production builds.
  if (import.meta.env.DEV) wrapper.append(technical)

  container.replaceChildren(wrapper)
}
