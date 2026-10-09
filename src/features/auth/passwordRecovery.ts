/**
 * Remembers, in this browser, that a password reset was requested. When the
 * user comes back from the email link (which signs them in), the app sends
 * them to the "new password" page instead of the home page.
 *
 * The reset link only works in the browser that requested it (PKCE), so a
 * per-browser flag is enough. It expires with the link (1 hour by default).
 */
export const RESET_PASSWORD_PATH = '/reset-password'

const STORAGE_KEY = 'uwatch:password-reset-requested-at'
const MAX_AGE_MS = 60 * 60 * 1000

export function markPasswordResetRequested(now = Date.now()): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(now))
  } catch {
    // Without storage the user lands on the home page and can still sign in.
  }
}

export function isPasswordResetPending(now = Date.now()): boolean {
  try {
    const requestedAt = Number(localStorage.getItem(STORAGE_KEY))
    return Number.isFinite(requestedAt) && requestedAt > 0 && now - requestedAt < MAX_AGE_MS
  } catch {
    return false
  }
}

export function clearPasswordResetRequest(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing to clear.
  }
}
