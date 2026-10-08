const STORAGE_KEY = 'uwatch:post-login-redirect'
const DEFAULT_PATH = '/'

/**
 * Only accepts same-origin, absolute in-app paths to prevent open redirects
 * (e.g. `//evil.com`, `/\evil.com`, `https://evil.com`).
 */
export function toSafeRedirectPath(candidate: unknown): string {
  if (typeof candidate !== 'string') return DEFAULT_PATH
  if (!candidate.startsWith('/')) return DEFAULT_PATH
  if (candidate.startsWith('//') || candidate.startsWith('/\\')) return DEFAULT_PATH
  if (candidate === '/login' || candidate.startsWith('/login?')) return DEFAULT_PATH

  return candidate
}

export function rememberPostLoginRedirect(path: string): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, toSafeRedirectPath(path))
  } catch {
    // Storage unavailable (private mode, blocked): fall back to the default path.
  }
}

export function readPostLoginRedirect(): string {
  try {
    return toSafeRedirectPath(sessionStorage.getItem(STORAGE_KEY))
  } catch {
    return DEFAULT_PATH
  }
}

export function clearPostLoginRedirect(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing to clear when storage is unavailable.
  }
}
