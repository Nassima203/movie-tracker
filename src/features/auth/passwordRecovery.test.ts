import {
  clearPasswordResetRequest,
  isPasswordResetPending,
  markPasswordResetRequested,
} from './passwordRecovery'

describe('password recovery flag', () => {
  afterEach(() => {
    localStorage.clear()
  })

  it('is pending right after a request and expires after an hour', () => {
    const now = Date.now()
    markPasswordResetRequested(now)

    expect(isPasswordResetPending(now + 59 * 60 * 1000)).toBe(true)
    expect(isPasswordResetPending(now + 61 * 60 * 1000)).toBe(false)
  })

  it('can be cleared', () => {
    markPasswordResetRequested()
    clearPasswordResetRequest()
    expect(isPasswordResetPending()).toBe(false)
  })

  it('ignores corrupted values', () => {
    localStorage.setItem('uwatch:password-reset-requested-at', 'abc')
    expect(isPasswordResetPending()).toBe(false)
  })
})
