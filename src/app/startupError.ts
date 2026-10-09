/**
 * Écran de secours affiché quand l'application ne peut pas démarrer
 * (ex. configuration invalide), au lieu d'une page blanche.
 */

/**
 * Remplace le contenu de `container` par un message d'erreur lisible.
 * Écrit volontairement en DOM « brut », sans React : c'est peut-être React
 * (ou le chargement de l'application) qui a échoué.
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
  // `textContent` (et non `innerHTML`) : le message est affiché comme du texte,
  // aucun HTML qu'il contiendrait ne peut être interprété.
  technical.textContent = detail
  technical.style.cssText =
    'max-width:40rem;white-space:pre-wrap;margin:8px 0 0;padding:12px 16px;border-radius:8px;background:#14141c;color:#f0b54a;font-size:0.85rem;text-align:left'

  wrapper.append(title, message)
  // Les détails de configuration n'aident que le développeur : jamais affichés en production.
  if (import.meta.env.DEV) wrapper.append(technical)

  container.replaceChildren(wrapper)
}
