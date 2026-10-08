import { act, render, screen } from '@testing-library/react'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { fakeSession } from '../../../tests/utils/renderWithAuth'
import { AuthProvider } from './AuthProvider'
import { useAuth } from './hooks/useAuth'

type Listener = (event: AuthChangeEvent, session: Session | null) => void

const { authMock } = vi.hoisted(() => {
  const state: { listener: Listener | null } = { listener: null }
  const unsubscribe = vi.fn()
  return {
    authMock: {
      state,
      unsubscribe,
      onAuthStateChange: vi.fn((listener: Listener) => {
        state.listener = listener
        return { data: { subscription: { unsubscribe } } }
      }),
    },
  }
})

vi.mock('@/lib/supabase', () => ({
  supabase: { auth: { onAuthStateChange: authMock.onAuthStateChange } },
}))

function StatusProbe() {
  return <p>{useAuth().status}</p>
}

function emit(event: AuthChangeEvent, session: Session | null) {
  act(() => {
    authMock.state.listener?.(event, session)
  })
}

describe('AuthProvider', () => {
  it('stays loading until the initial session is known', () => {
    render(
      <AuthProvider>
        <StatusProbe />
      </AuthProvider>,
    )

    expect(screen.getByText('loading')).toBeInTheDocument()
  })

  it('follows the Supabase auth lifecycle', () => {
    render(
      <AuthProvider>
        <StatusProbe />
      </AuthProvider>,
    )

    emit('INITIAL_SESSION', null)
    expect(screen.getByText('anonymous')).toBeInTheDocument()

    emit('SIGNED_IN', fakeSession)
    expect(screen.getByText('authenticated')).toBeInTheDocument()

    emit('SIGNED_OUT', null)
    expect(screen.getByText('anonymous')).toBeInTheDocument()
  })

  it('unsubscribes on unmount', () => {
    const { unmount } = render(
      <AuthProvider>
        <StatusProbe />
      </AuthProvider>,
    )

    unmount()

    expect(authMock.unsubscribe).toHaveBeenCalled()
  })
})
