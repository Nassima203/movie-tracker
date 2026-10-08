import { AuthApiError, AuthRetryableFetchError } from '@supabase/supabase-js'
import { toAuthFailure } from './supabaseAuthGateway'

describe('toAuthFailure', () => {
  it.each([
    [
      new AuthApiError('Invalid login credentials', 400, 'invalid_credentials'),
      'invalid_credentials',
    ],
    [new AuthApiError('Email not confirmed', 400, 'email_not_confirmed'), 'email_not_confirmed'],
    [new AuthApiError('User already registered', 422, 'user_already_exists'), 'email_taken'],
    [new AuthApiError('Password is too weak', 422, 'weak_password'), 'weak_password'],
    [new AuthApiError('This account is not allowed to sign up.', 403, undefined), 'not_allowed'],
    [new AuthApiError('Too many requests', 429, undefined), 'rate_limited'],
    [new AuthRetryableFetchError('Failed to fetch', 0), 'network'],
    [new Error('boom'), 'network'],
  ] as const)('maps %s to %s', (error, kind) => {
    expect(toAuthFailure(error).kind).toBe(kind)
  })
})
